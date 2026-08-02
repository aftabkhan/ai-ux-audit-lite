import { z } from "zod";

export const auditCategorySchema = z.enum([
  "visual-hierarchy",
  "navigation-orientation",
  "clarity-of-actions",
  "consistency",
  "readability",
  "feedback-system-status",
  "error-prevention-recovery",
  "accessibility-basics",
]);

export const severitySchema = z.enum(["high", "medium", "low"]);
export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const auditContextSchema = z.object({
  screenTitle: z.string().trim().max(100).optional(),
  productContext: z.string().trim().max(600).optional(),
  targetUser: z.string().trim().max(120).optional(),
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
