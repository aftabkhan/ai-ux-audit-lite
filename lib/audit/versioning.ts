import { versionLabelSchema } from "@/lib/audit/lifecycle-schema";
import type {
  AuditDimension,
  AuditEvidenceRecord,
  AuditVersionSnapshot,
  PersistedAudit,
  ProductLabAuditContext,
} from "@/src/types/audit-lifecycle";

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

interface RunRow { id: string }
interface FindingRow {
  id: string;
  source_finding_id: string;
  dimension: AuditDimension;
  ai_severity: "critical" | "high" | "medium" | "low";
}
interface ReviewRow {
  finding_id: string;
  status: "unreviewed" | "accepted" | "dismissed";
  severity_override: "critical" | "high" | "medium" | "low" | null;
  reviewer_note: string | null;
  approved_recommendation: string | null;
}
interface VersionRow {
  id: string;
  audit_id: string;
  reviewer_id: string;
  version_number: number;
  label: string;
  snapshot: AuditVersionSnapshot;
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

function toAudit(row: AuditRow): PersistedAudit {
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

function toEvidence(row: EvidenceRow): AuditEvidenceRecord {
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

function toVersion(row: VersionRow): PersistedAuditVersion {
  return {
    id: row.id,
    auditId: row.audit_id,
    reviewerId: row.reviewer_id,
    versionNumber: row.version_number,
    label: row.label,
    snapshot: row.snapshot,
    createdAt: row.created_at,
  };
}

export async function createAuditVersion(
  context: ProductLabAuditContext,
  auditId: string,
  label: string,
): Promise<PersistedAuditVersion> {
  assertContext(context);
  const safeLabel = versionLabelSchema.parse(label);
  const owner = `audit_id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}`;

  const [audits, evidence, runs, findings, reviews, previousVersions] = await Promise.all([
    request<AuditRow[]>(`/rest/v1/ai_ux_audits?id=${eq(auditId)}&reviewer_id=${eq(context.reviewerId)}&limit=1`),
    request<EvidenceRow[]>(`/rest/v1/ai_ux_audit_evidence?${owner}&order=sequence_index.asc`),
    request<RunRow[]>(`/rest/v1/ai_ux_audit_runs?${owner}&select=id&order=created_at.desc&limit=1`),
    request<FindingRow[]>(`/rest/v1/ai_ux_audit_findings?${owner}&select=id,source_finding_id,dimension,ai_severity&order=created_at.asc`),
    request<ReviewRow[]>(`/rest/v1/ai_ux_audit_reviews?${owner}&select=finding_id,status,severity_override,reviewer_note,approved_recommendation`),
    request<Array<{ version_number: number }>>(`/rest/v1/ai_ux_audit_versions?${owner}&select=version_number&order=version_number.desc&limit=1`),
  ]);

  if (audits.length !== 1) throw new Error("Audit not found or access denied.");
  const reviewByFinding = new Map(reviews.map((review) => [review.finding_id, review]));
  const snapshot: AuditVersionSnapshot = {
    audit: toAudit(audits[0]),
    evidence: evidence.map(toEvidence),
    runId: runs[0]?.id,
    findings: findings.map((finding) => {
      const review = reviewByFinding.get(finding.id);
      return {
        findingId: finding.id,
        sourceFindingId: finding.source_finding_id,
        dimension: finding.dimension,
        aiSeverity: finding.ai_severity,
        reviewStatus: review?.status ?? "unreviewed",
        severityOverride: review?.severity_override ?? undefined,
        reviewerNote: review?.reviewer_note ?? undefined,
        approvedRecommendation: review?.approved_recommendation ?? undefined,
      };
    }),
  };
  const versionNumber = (previousVersions[0]?.version_number ?? 0) + 1;

  const rows = await request<VersionRow[]>("/rest/v1/ai_ux_audit_versions", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      audit_id: auditId,
      reviewer_id: context.reviewerId,
      version_number: versionNumber,
      label: safeLabel,
      snapshot,
    }),
  });
  if (rows.length !== 1) throw new Error("Audit version creation returned an unexpected result.");
  return toVersion(rows[0]);
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
