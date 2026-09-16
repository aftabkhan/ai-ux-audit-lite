import { auditResultSchema } from "@/lib/audit/schema";
import { toCanonicalAuditDimension } from "@/lib/audit/dimensions";
import type { AuditResult } from "@/src/types/audit";
import type { ProductLabAuditContext } from "@/src/types/audit-lifecycle";

interface EvidenceRow {
  id: string;
  sequence_index: number;
}

export interface PersistAuditRunInput {
  auditId: string;
  provider: string;
  model?: string;
  result: AuditResult;
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Audit run persistence is not configured.");
  return { url, key };
}

function authHeaders(extra?: HeadersInit) {
  const { key } = config();
  const result = new Headers(extra);
  result.set("apikey", key);
  result.set("Content-Type", "application/json");
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

export async function persistAuditRun(
  context: ProductLabAuditContext,
  input: PersistAuditRunInput,
): Promise<string> {
  assertAuditContext(context);
  const result = auditResultSchema.parse(input.result);
  const provider = input.provider.trim();
  const model = input.model?.trim();
  if (!provider || provider.length > 80) throw new Error("Audit provider identifier is invalid.");
  if (model && model.length > 160) throw new Error("Audit model identifier is invalid.");

  const { url } = config();
  const evidenceResponse = await fetch(
    `${url}/rest/v1/ai_ux_audit_evidence?audit_id=${eq(input.auditId)}&reviewer_id=${eq(context.reviewerId)}&select=id,sequence_index&order=sequence_index.asc`,
    { headers: authHeaders(), cache: "no-store" },
  );
  if (!evidenceResponse.ok) throw new Error(`Audit evidence lookup failed (${evidenceResponse.status}).`);
  const evidenceRows = (await evidenceResponse.json()) as EvidenceRow[];
  const evidenceByPosition = new Map(evidenceRows.map((row) => [row.sequence_index + 1, row.id]));

  const findings = result.findings.map((finding) => {
    const refs = finding.evidenceRefs ?? [];
    if (refs.length === 0) throw new Error(`Finding ${finding.id} has no evidence references.`);
    const evidenceIds = refs.map((position) => {
      const id = evidenceByPosition.get(position);
      if (!id) throw new Error(`Finding ${finding.id} references unavailable evidence ${position}.`);
      return id;
    });

    return {
      sourceFindingId: finding.id,
      title: finding.title,
      dimension: toCanonicalAuditDimension(finding.category),
      observation: finding.observation,
      impact: finding.impact,
      recommendation: finding.recommendation,
      aiSeverity: finding.severity,
      confidence: finding.confidence,
      evidenceIds,
    };
  });

  const rpcResponse = await fetch(`${url}/rest/v1/rpc/persist_ai_ux_audit_run`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      p_audit_id: input.auditId,
      p_reviewer_id: context.reviewerId,
      p_provider: provider,
      p_model: model ?? null,
      p_result_version: result.version,
      p_summary: result.summary,
      p_generated_at: result.generatedAt,
      p_findings: findings,
    }),
    cache: "no-store",
  });
  if (!rpcResponse.ok) throw new Error(`Audit run persistence failed (${rpcResponse.status}).`);

  const runId = (await rpcResponse.json()) as unknown;
  if (typeof runId !== "string" || !runId) throw new Error("Audit run persistence returned an invalid identifier.");
  return runId;
}
