import { z } from "zod";
import {
  AUDIT_CATEGORIES,
  LEGACY_AUDIT_CATEGORIES,
} from "@/src/types/audit";
import { AUDIT_SCOPE_TYPES } from "@/src/types/audit-lifecycle";

export const auditCategorySchema = z.enum([
  ...AUDIT_CATEGORIES,
  ...LEGACY_AUDIT_CATEGORIES,
]);

export const severitySchema = z.enum(["critical", "high", "medium", "low"]);
export const confidenceSchema = z.enum(["high", "medium", "low"]);
export const auditScopeTypeSchema = z.enum(AUDIT_SCOPE_TYPES);

export const auditContextSchema = z.object({
  screenTitle: z.string().trim().max(160).optional(),
  scopeType: auditScopeTypeSchema.optional(),
  productContext: z.string().trim().max(2000).optional(),
  targetUser: z.string().trim().max(240).optional(),
  taskDescription: z.string().trim().max(1200).optional(),
  businessObjective: z.string().trim().max(1200).optional(),
  expectedOutcome: z.string().trim().max(1200).optional(),
});

export const auditFindingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(140),
  severity: severitySchema,
  category: auditCategorySchema,
  observation: z.string().min(1),
  impact: z.string().min(1),
  recommendation: z.string().min(1),
  confidence: confidenceSchema,
  evidenceRefs: z.array(z.number().int().min(1).max(8)).min(1).max(8).optional(),
});

export const auditResultSchema = z.object({
  version: z.literal("1.0"),
  generatedAt: z.string().datetime(),
  context: auditContextSchema,
  summary: z.object({
    overview: z.string().min(1),
    strengths: z.array(z.string().min(1)).max(6),
    priorityActions: z.array(z.string().min(1)).max(6),
  }),
  findings: z.array(auditFindingSchema).min(1).max(12),
  disclaimer: z.string().min(1),
});

export type ValidatedAuditResult = z.infer<typeof auditResultSchema>;

export const findingTriageStatusSchema = z.enum(["unreviewed", "accepted", "dismissed"]);

export const findingTriageStateSchema = z.object({
  status: findingTriageStatusSchema,
  severity: severitySchema,
  originalSeverity: severitySchema,
  reviewerNote: z.string().max(500).optional(),
});

export const auditReviewStatusSchema = z.enum(["not-started", "in-progress", "completed"]);

export const auditTriageSummarySchema = z.object({
  totalCount: z.number().int().nonnegative(),
  reviewedCount: z.number().int().nonnegative(),
  unreviewedCount: z.number().int().nonnegative(),
  acceptedCount: z.number().int().nonnegative(),
  dismissedCount: z.number().int().nonnegative(),
  overrideCount: z.number().int().nonnegative(),
  baselineScore: z.number().int().min(0).max(100),
  adjustedScore: z.number().int().min(0).max(100),
  reviewStatus: auditReviewStatusSchema,
});
