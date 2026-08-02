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

export const FINDING_SEVERITIES = ["high", "medium", "low"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export interface AuditContext {
  screenTitle?: string;
  productContext?: string;
  targetUser?: string;
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
    | "PROVIDER_ERROR"
    | "INVALID_RESPONSE"
    | "UNKNOWN_ERROR";
  message: string;
  recovery?: string;
}
