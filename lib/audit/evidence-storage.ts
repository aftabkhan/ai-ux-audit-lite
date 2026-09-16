import type { AuditEvidenceRecord, ProductLabAuditContext } from "@/src/types/audit-lifecycle";
import { evidenceMetadataSchema } from "@/lib/audit/lifecycle-schema";

const BUCKET = "ai-ux-audit-evidence";

interface EvidenceRow {
  id: string;
  audit_id: string;
  reviewer_id: string;
  evidence_type: "screenshot";
  label: string;
  sequence_index: number;
  object_key: string;
  mime_type: AuditEvidenceRecord["mimeType"];
  byte_size: number;
  created_at: string;
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Audit evidence storage is not configured.");
  return { url, key };
}

function authHeaders(extra?: HeadersInit) {
  const { key } = config();
  const result = new Headers(extra);
  result.set("apikey", key);
  if (!key.startsWith("sb_secret_")) result.set("Authorization", `Bearer ${key}`);
  return result;
}

function assertAuditContext(context: ProductLabAuditContext) {
  if (context.productKey !== "ai-ux-audit") throw new Error("Audit product access is required.");
  if (!context.reviewerId || !context.sessionId) throw new Error("Validated Product Lab context is required.");
  if (Date.parse(context.expiresAt) <= Date.now()) throw new Error("Product Lab session has expired.");
}

function eq(value: string) {
  return encodeURIComponent(`eq.${value}`);
}

function encodeObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function extensionFor(mimeType: AuditEvidenceRecord["mimeType"]) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  return "webp";
}

function toEvidenceRecord(row: EvidenceRow): AuditEvidenceRecord {
  return {
    id: row.id,
    auditId: row.audit_id,
    reviewerId: row.reviewer_id,
    evidenceType: row.evidence_type,
    label: row.label,
    sequenceIndex: row.sequence_index,
    objectKey: row.object_key,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    createdAt: row.created_at,
  };
}

async function assertOwnedAudit(context: ProductLabAuditContext, auditId: string) {
  const { url } = config();
  const response = await fetch(
    `${url}/rest/v1/ai_ux_audits?id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}&select=id&limit=1`,
    { headers: authHeaders(), cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Audit ownership check failed (${response.status}).`);
  const rows = (await response.json()) as Array<{ id: string }>;
  if (rows.length !== 1) throw new Error("Audit not found or access denied.");
}

export async function uploadAuditEvidence(
  context: ProductLabAuditContext,
  auditId: string,
  input: {
    label: string;
    sequenceIndex: number;
    mimeType: AuditEvidenceRecord["mimeType"];
    bytes: Uint8Array;
  },
): Promise<AuditEvidenceRecord> {
  assertAuditContext(context);
  const metadata = evidenceMetadataSchema.parse({
    label: input.label,
    sequenceIndex: input.sequenceIndex,
    mimeType: input.mimeType,
    byteSize: input.bytes.byteLength,
  });
  await assertOwnedAudit(context, auditId);

  const { url } = config();
  const objectKey = `${context.reviewerId}/${auditId}/${crypto.randomUUID()}.${extensionFor(metadata.mimeType)}`;
  const uploadResponse = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${encodeObjectPath(objectKey)}`,
    {
      method: "POST",
      headers: authHeaders({
        "Content-Type": metadata.mimeType,
        "x-upsert": "false",
        "Cache-Control": "no-store",
      }),
      body: input.bytes,
      cache: "no-store",
    },
  );
  if (!uploadResponse.ok) throw new Error(`Audit evidence upload failed (${uploadResponse.status}).`);

  const insertResponse = await fetch(`${url}/rest/v1/ai_ux_audit_evidence`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({
      audit_id: auditId,
      reviewer_id: context.reviewerId,
      evidence_type: "screenshot",
      label: metadata.label,
      sequence_index: metadata.sequenceIndex,
      object_key: objectKey,
      mime_type: metadata.mimeType,
      byte_size: metadata.byteSize,
    }),
    cache: "no-store",
  });

  if (!insertResponse.ok) {
    await removeEvidenceObjects([objectKey]).catch(() => undefined);
    throw new Error(`Audit evidence metadata write failed (${insertResponse.status}).`);
  }

  const rows = (await insertResponse.json()) as EvidenceRow[];
  if (rows.length !== 1) {
    await removeEvidenceObjects([objectKey]).catch(() => undefined);
    throw new Error("Audit evidence metadata returned an unexpected result.");
  }
  return toEvidenceRecord(rows[0]);
}

export async function removeEvidenceObjects(objectKeys: string[]): Promise<void> {
  if (objectKeys.length === 0) return;
  if (objectKeys.length > 1000) throw new Error("Audit evidence cleanup exceeds the supported batch limit.");
  const { url } = config();
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: objectKeys }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Audit evidence cleanup failed (${response.status}).`);
}
