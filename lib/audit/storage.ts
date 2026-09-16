import type { AuditDefinition, PersistedAudit, ProductLabAuditContext } from "@/src/types/audit-lifecycle";
import {
  auditDefinitionSchema,
  auditDefinitionUpdateSchema,
  humanReviewUpdateSchema,
} from "@/lib/audit/lifecycle-schema";
import { removeEvidenceObjects } from "@/lib/audit/evidence-storage";

interface AuditRow {
  id: string;
  reviewer_id: string;
  title: string;
  scope_type: PersistedAudit["scopeType"];
  status: PersistedAudit["status"];
  target_user: string | null;
  product_context: string | null;
  task_description: string | null;
  business_objective: string | null;
  expected_outcome: string | null;
  archived_at: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersistedHumanReview {
  findingId: string;
  auditId: string;
  reviewerId: string;
  status: "unreviewed" | "accepted" | "dismissed";
  severityOverride?: "critical" | "high" | "medium" | "low";
  reviewerNote?: string;
  approvedRecommendation?: string;
  reviewedAt?: string;
  updatedAt: string;
}

interface ReviewRow {
  finding_id: string;
  audit_id: string;
  reviewer_id: string;
  status: PersistedHumanReview["status"];
  severity_override: PersistedHumanReview["severityOverride"] | null;
  reviewer_note: string | null;
  approved_recommendation: string | null;
  reviewed_at: string | null;
  updated_at: string;
}

interface DeletionPreparationRow {
  deletion_job_id: string;
  object_keys: string[];
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Audit persistence is not configured.");
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

  if (!response.ok) {
    throw new Error(`Audit storage request failed (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function assertAuditContext(context: ProductLabAuditContext) {
  if (context.productKey !== "ai-ux-audit") throw new Error("Audit product access is required.");
  if (!context.reviewerId || !context.sessionId) throw new Error("Validated Product Lab context is required.");
  if (Date.parse(context.expiresAt) <= Date.now()) throw new Error("Product Lab session has expired.");
}

function eq(value: string) {
  return encodeURIComponent(`eq.${value}`);
}

function toPersistedAudit(row: AuditRow): PersistedAudit {
  return {
    id: row.id,
    reviewerId: row.reviewer_id,
    title: row.title,
    scopeType: row.scope_type,
    status: row.status,
    targetUser: row.target_user ?? undefined,
    productContext: row.product_context ?? undefined,
    taskDescription: row.task_description ?? undefined,
    businessObjective: row.business_objective ?? undefined,
    expectedOutcome: row.expected_outcome ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    finalizedAt: row.finalized_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPersistedReview(row: ReviewRow): PersistedHumanReview {
  return {
    findingId: row.finding_id,
    auditId: row.audit_id,
    reviewerId: row.reviewer_id,
    status: row.status,
    severityOverride: row.severity_override ?? undefined,
    reviewerNote: row.reviewer_note ?? undefined,
    approvedRecommendation: row.approved_recommendation ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

export async function createAudit(context: ProductLabAuditContext, input: AuditDefinition): Promise<PersistedAudit> {
  assertAuditContext(context);
  const parsed = auditDefinitionSchema.parse(input);
  const rows = await request<AuditRow[]>("/rest/v1/ai_ux_audits", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      reviewer_id: context.reviewerId,
      title: parsed.title,
      scope_type: parsed.scopeType,
      target_user: parsed.targetUser ?? null,
      product_context: parsed.productContext ?? null,
      task_description: parsed.taskDescription ?? null,
      business_objective: parsed.businessObjective ?? null,
      expected_outcome: parsed.expectedOutcome ?? null,
    }),
  });

  if (rows.length !== 1) throw new Error("Audit creation returned an unexpected result.");
  return toPersistedAudit(rows[0]);
}

export async function updateAudit(
  context: ProductLabAuditContext,
  auditId: string,
  input: Partial<AuditDefinition>,
): Promise<PersistedAudit | null> {
  assertAuditContext(context);
  const parsed = auditDefinitionUpdateSchema.parse(input);
  const now = new Date().toISOString();
  const body: Record<string, string | null> = { updated_at: now };
  if (parsed.title !== undefined) body.title = parsed.title;
  if (parsed.scopeType !== undefined) body.scope_type = parsed.scopeType;
  if (parsed.targetUser !== undefined) body.target_user = parsed.targetUser || null;
  if (parsed.productContext !== undefined) body.product_context = parsed.productContext || null;
  if (parsed.taskDescription !== undefined) body.task_description = parsed.taskDescription || null;
  if (parsed.businessObjective !== undefined) body.business_objective = parsed.businessObjective || null;
  if (parsed.expectedOutcome !== undefined) body.expected_outcome = parsed.expectedOutcome || null;

  const rows = await request<AuditRow[]>(
    `/rest/v1/ai_ux_audits?id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}&status=neq.archived&status=neq.finalized`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(body),
    },
  );
  return rows[0] ? toPersistedAudit(rows[0]) : null;
}

export async function listAudits(context: ProductLabAuditContext, includeArchived = false): Promise<PersistedAudit[]> {
  assertAuditContext(context);
  const archivedFilter = includeArchived ? "" : "&status=neq.archived";
  const rows = await request<AuditRow[]>(
    `/rest/v1/ai_ux_audits?reviewer_id=${eq(context.reviewerId)}${archivedFilter}&order=updated_at.desc`,
  );
  return rows.map(toPersistedAudit);
}

export async function getAudit(context: ProductLabAuditContext, auditId: string): Promise<PersistedAudit | null> {
  assertAuditContext(context);
  const rows = await request<AuditRow[]>(
    `/rest/v1/ai_ux_audits?id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}&limit=1`,
  );
  return rows[0] ? toPersistedAudit(rows[0]) : null;
}

export async function updateHumanReview(
  context: ProductLabAuditContext,
  auditId: string,
  findingId: string,
  input: {
    status: "unreviewed" | "accepted" | "dismissed";
    severityOverride?: "critical" | "high" | "medium" | "low" | null;
    reviewerNote?: string | null;
    approvedRecommendation?: string | null;
  },
): Promise<PersistedHumanReview | null> {
  assertAuditContext(context);
  const parsed = humanReviewUpdateSchema.parse(input);
  const rows = await request<ReviewRow[]>("/rest/v1/rpc/update_ai_ux_audit_review", {
    method: "POST",
    body: JSON.stringify({
      p_audit_id: auditId,
      p_reviewer_id: context.reviewerId,
      p_finding_id: findingId,
      p_status: parsed.status,
      p_severity_override: parsed.severityOverride ?? null,
      p_reviewer_note: parsed.reviewerNote ?? null,
      p_approved_recommendation: parsed.approvedRecommendation ?? null,
    }),
  });
  if (rows.length > 1) throw new Error("Audit review update returned an unexpected result.");
  return rows[0] ? toPersistedReview(rows[0]) : null;
}

export async function archiveAudit(context: ProductLabAuditContext, auditId: string): Promise<PersistedAudit | null> {
  assertAuditContext(context);
  const now = new Date().toISOString();
  const rows = await request<AuditRow[]>(
    `/rest/v1/ai_ux_audits?id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}&status=neq.archived`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "archived", archived_at: now, updated_at: now }),
    },
  );
  return rows[0] ? toPersistedAudit(rows[0]) : null;
}

export async function restoreAudit(context: ProductLabAuditContext, auditId: string): Promise<PersistedAudit | null> {
  assertAuditContext(context);
  const now = new Date().toISOString();
  const rows = await request<AuditRow[]>(
    `/rest/v1/ai_ux_audits?id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}&status=eq.archived`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "in-review", archived_at: null, finalized_at: null, updated_at: now }),
    },
  );
  return rows[0] ? toPersistedAudit(rows[0]) : null;
}

export async function reopenAudit(context: ProductLabAuditContext, auditId: string): Promise<PersistedAudit | null> {
  assertAuditContext(context);
  const now = new Date().toISOString();
  const rows = await request<AuditRow[]>(
    `/rest/v1/ai_ux_audits?id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}&status=eq.finalized`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "in-review", finalized_at: null, archived_at: null, updated_at: now }),
    },
  );
  return rows[0] ? toPersistedAudit(rows[0]) : null;
}

export async function deleteAudit(context: ProductLabAuditContext, auditId: string): Promise<boolean> {
  assertAuditContext(context);
  const prepared = await request<DeletionPreparationRow[]>("/rest/v1/rpc/prepare_ai_ux_audit_deletion", {
    method: "POST",
    body: JSON.stringify({ p_audit_id: auditId, p_reviewer_id: context.reviewerId }),
  });
  if (prepared.length !== 1) throw new Error("Audit deletion returned an unexpected result.");

  const job = prepared[0];
  try {
    await removeEvidenceObjects(job.object_keys);
    const now = new Date().toISOString();
    await request<void>(`/rest/v1/ai_ux_audit_deletion_jobs?id=${eq(job.deletion_job_id)}&reviewer_id=${eq(context.reviewerId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "completed", completed_at: now, updated_at: now, failure_code: null }),
    });
    return true;
  } catch (error) {
    await request<void>(`/rest/v1/ai_ux_audit_deletion_jobs?id=${eq(job.deletion_job_id)}&reviewer_id=${eq(context.reviewerId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "failed",
        failure_code: "STORAGE_DELETE_FAILED",
        completed_at: null,
        updated_at: new Date().toISOString(),
      }),
    }).catch(() => undefined);
    throw error;
  }
}
