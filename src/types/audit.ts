export const AUDIT_CATEGORIES = [
  "visual-hierarchy",
  "navigation-orientation",
  "clarity-of-actions",
  "consistency",
  "readability",
  "feedback-system-status",
  "error-prevention-recovery",
  "accessibility-basics",
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const FINDING_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export type FindingTriageStatus = "unreviewed" | "accepted" | "dismissed";

export interface FindingTriageState {
  status: FindingTriageStatus;
  severity: FindingSeverity;
  originalSeverity: FindingSeverity;
  reviewerNote?: string;
}

export type AuditTriageMap = Record<string, FindingTriageState>;

export type AuditReviewStatus = "not-started" | "in-progress" | "completed";

export interface AuditTriageSummary {
  totalCount: number;
  reviewedCount: number;
  unreviewedCount: number;
  acceptedCount: number;
  dismissedCount: number;
  overrideCount: number;
  baselineScore: number;
  adjustedScore: number;
  reviewStatus: AuditReviewStatus;
}

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export type AuditScopeType = "single-screen" | "multi-screen" | "user-flow" | "page-sequence" | "product-workflow";

export interface AuditContext {
  screenTitle?: string;
  scopeType?: AuditScopeType;
  productContext?: string;
  targetUser?: string;
  taskDescription?: string;
  businessObjective?: string;
  expectedOutcome?: string;
}

export interface AuditFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  category: AuditCategory;
  observation: string;
  impact: string;
  recommendation: string;
  confidence: ConfidenceLevel;
  /** 1-based positions in the submitted ordered evidence sequence. */
  evidenceRefs?: number[];
}

export interface AuditSummary {
  overview: string;
  strengths: string[];
  priorityActions: string[];
}

export interface AuditResult {
  version: "1.0";
  generatedAt: string;
  context: AuditContext;
  summary: AuditSummary;
  findings: AuditFinding[];
  disclaimer: string;
}

export interface AuditError {
  code:
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_RESPONSE"
  | "UNKNOWN_ERROR";
  message: string;
  recovery?: string;
}
