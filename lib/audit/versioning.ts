import { auditVersionSnapshotSchema, versionLabelSchema } from "@/lib/audit/lifecycle-schema";
import type { AuditVersionSnapshot, ProductLabAuditContext } from "@/src/types/audit-lifecycle";

interface VersionRow {
  id: string;
  audit_id: string;
  reviewer_id: string;
  version_number: number;
  label: string;
  snapshot: unknown;
  created_at: string;
}

export interface PersistedAuditVersion {
  id: string;
  auditId: string;
  reviewerId: string;
  versionNumber: number;
  label: string;
  snapshot: AuditVersionSnapshot;
  createdAt: string;
}

export interface AuditVersionComparison {
  fromVersion: number;
  toVersion: number;
  reviewStatusChanges: number;
  severityChanges: number;
  reviewerNoteChanges: number;
  recommendationChanges: number;
  addedFindings: number;
  removedFindings: number;
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Audit versioning is not configured.");
  return { url, key };
}

function headers(extra?: HeadersInit) {
  const { key } = config();
  const result = new Headers(extra);
  result.set("apikey", key);
  result.set("Content-Type", "application/json");
  if (!key.startsWith("sb_secret_")) result.set("Authorization", `Bearer ${key}`);
  return result;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url } = config();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: headers(init.headers),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Audit version storage request failed (${response.status}).`);
  return (await response.json()) as T;
}

function assertContext(context: ProductLabAuditContext) {
  if (context.productKey !== "ai-ux-audit") throw new Error("Audit product access is required.");
  if (!context.reviewerId || !context.sessionId) throw new Error("Validated Product Lab context is required.");
  if (Date.parse(context.expiresAt) <= Date.now()) throw new Error("Product Lab session has expired.");
}

function eq(value: string) {
  return encodeURIComponent(`eq.${value}`);
}

function toVersion(row: VersionRow): PersistedAuditVersion {
  if (!row.id || !row.audit_id || !row.reviewer_id || !Number.isInteger(row.version_number) || row.version_number < 1) {
    throw new Error("Audit version storage returned invalid metadata.");
  }
  const snapshot = auditVersionSnapshotSchema.parse(row.snapshot);
  return {
    id: row.id,
    auditId: row.audit_id,
    reviewerId: row.reviewer_id,
    versionNumber: row.version_number,
    label: row.label,
    snapshot,
    createdAt: row.created_at,
  };
}

function validateOwnedVersion(
  rows: VersionRow[],
  context: ProductLabAuditContext,
  auditId: string,
  operation: string,
): PersistedAuditVersion {
  if (rows.length !== 1) throw new Error(`${operation} returned an unexpected result.`);
  const version = toVersion(rows[0]);
  if (version.reviewerId !== context.reviewerId || version.auditId !== auditId) {
    throw new Error("Audit version ownership validation failed.");
  }
  return version;
}

export async function createAuditVersion(
  context: ProductLabAuditContext,
  auditId: string,
  label: string,
): Promise<PersistedAuditVersion> {
  assertContext(context);
  const safeLabel = versionLabelSchema.parse(label);
  const rows = await request<VersionRow[]>("/rest/v1/rpc/create_ai_ux_audit_version", {
    method: "POST",
    body: JSON.stringify({
      p_audit_id: auditId,
      p_reviewer_id: context.reviewerId,
      p_label: safeLabel,
    }),
  });
  return validateOwnedVersion(rows, context, auditId, "Audit version creation");
}

export async function finalizeAudit(
  context: ProductLabAuditContext,
  auditId: string,
  label = "Final reviewed audit",
): Promise<PersistedAuditVersion> {
  assertContext(context);
  const safeLabel = versionLabelSchema.parse(label);
  const rows = await request<VersionRow[]>("/rest/v1/rpc/finalize_ai_ux_audit", {
    method: "POST",
    body: JSON.stringify({
      p_audit_id: auditId,
      p_reviewer_id: context.reviewerId,
      p_version_label: safeLabel,
    }),
  });
  const version = validateOwnedVersion(rows, context, auditId, "Audit finalization");
  if (version.snapshot.audit.status !== "finalized" || !version.snapshot.audit.finalizedAt) {
    throw new Error("Audit finalization returned a non-finalized snapshot.");
  }
  return version;
}

export async function listAuditVersions(
  context: ProductLabAuditContext,
  auditId: string,
): Promise<PersistedAuditVersion[]> {
  assertContext(context);
  const rows = await request<VersionRow[]>(
    `/rest/v1/ai_ux_audit_versions?audit_id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}&order=version_number.desc`,
  );
  return rows.map(toVersion);
}

export function compareAuditVersions(
  from: PersistedAuditVersion,
  to: PersistedAuditVersion,
): AuditVersionComparison {
  const before = new Map(from.snapshot.findings.map((finding) => [finding.findingId, finding]));
  const after = new Map(to.snapshot.findings.map((finding) => [finding.findingId, finding]));
  let reviewStatusChanges = 0;
  let severityChanges = 0;
  let reviewerNoteChanges = 0;
  let recommendationChanges = 0;
  let addedFindings = 0;
  let removedFindings = 0;

  for (const [id, current] of after) {
    const previous = before.get(id);
    if (!previous) {
      addedFindings += 1;
      continue;
    }
    if (previous.reviewStatus !== current.reviewStatus) reviewStatusChanges += 1;
    if ((previous.severityOverride ?? previous.aiSeverity) !== (current.severityOverride ?? current.aiSeverity)) severityChanges += 1;
    if ((previous.reviewerNote ?? "") !== (current.reviewerNote ?? "")) reviewerNoteChanges += 1;
    if ((previous.approvedRecommendation ?? "") !== (current.approvedRecommendation ?? "")) recommendationChanges += 1;
  }
  for (const id of before.keys()) {
    if (!after.has(id)) removedFindings += 1;
  }

  return {
    fromVersion: from.versionNumber,
    toVersion: to.versionNumber,
    reviewStatusChanges,
    severityChanges,
    reviewerNoteChanges,
    recommendationChanges,
    addedFindings,
    removedFindings,
  };
}
