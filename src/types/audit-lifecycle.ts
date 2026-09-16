export const AUDIT_SCOPE_TYPES = [
  "single-screen",
  "multi-screen",
  "user-flow",
  "page-sequence",
  "product-workflow",
] as const;

export type AuditScopeType = (typeof AUDIT_SCOPE_TYPES)[number];

export const AUDIT_LIFECYCLE_STATUSES = [
  "draft",
  "ready",
  "analyzing",
  "in-review",
  "finalized",
  "archived",
] as const;

export type AuditLifecycleStatus = (typeof AUDIT_LIFECYCLE_STATUSES)[number];

export const AUDIT_DIMENSIONS = [
  "usability",
  "interaction-design",
  "navigation",
  "information-architecture",
  "visual-hierarchy",
  "content-clarity",
  "forms",
  "error-prevention-recovery",
  "accessibility",
  "responsive-behavior",
  "cognitive-load",
  "task-completion",
  "workflow-friction",
  "consistency",
  "trust",
  "feedback-system-status",
  "empty-loading-error-states",
] as const;

export type AuditDimension = (typeof AUDIT_DIMENSIONS)[number];

export interface AuditDefinition {
  title: string;
  scopeType: AuditScopeType;
  targetUser?: string;
  productContext?: string;
  taskDescription?: string;
  businessObjective?: string;
  expectedOutcome?: string;
}

export interface PersistedAudit extends AuditDefinition {
  id: string;
  reviewerId: string;
  status: AuditLifecycleStatus;
  archivedAt?: string;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvidenceRecord {
  id: string;
  auditId: string;
  reviewerId: string;
  evidenceType: "screenshot";
  label: string;
  sequenceIndex: number;
  objectKey: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  byteSize: number;
  createdAt: string;
}

export interface ProductLabAuditContext {
  reviewerId: string;
  sessionId: string;
  productKey: "ai-ux-audit";
  expiresAt: string;
}

export interface AuditVersionSnapshot {
  audit: PersistedAudit;
  evidence: AuditEvidenceRecord[];
  runId?: string;
  findings: Array<{
    findingId: string;
    sourceFindingId: string;
    dimension: AuditDimension;
    aiSeverity: "critical" | "high" | "medium" | "low";
    reviewStatus: "unreviewed" | "accepted" | "dismissed";
    severityOverride?: "critical" | "high" | "medium" | "low";
    reviewerNote?: string;
    approvedRecommendation?: string;
  }>;
}
