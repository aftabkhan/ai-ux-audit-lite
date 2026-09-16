import { z } from "zod";
import { AUDIT_DIMENSIONS, AUDIT_LIFECYCLE_STATUSES, AUDIT_SCOPE_TYPES } from "@/src/types/audit-lifecycle";

export const auditDefinitionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  scopeType: z.enum(AUDIT_SCOPE_TYPES),
  targetUser: z.string().trim().max(240).optional(),
  productContext: z.string().trim().max(2000).optional(),
  taskDescription: z.string().trim().max(1200).optional(),
  businessObjective: z.string().trim().max(1200).optional(),
  expectedOutcome: z.string().trim().max(1200).optional(),
}).strict();

export const auditDefinitionUpdateSchema = auditDefinitionSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one audit field must be updated." },
);

export const auditLifecycleStatusSchema = z.enum(AUDIT_LIFECYCLE_STATUSES);
export const auditDimensionSchema = z.enum(AUDIT_DIMENSIONS);

export const evidenceMetadataSchema = z.object({
  label: z.string().trim().min(1).max(160),
  sequenceIndex: z.number().int().min(0).max(199),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  byteSize: z.number().int().positive().max(5 * 1024 * 1024),
}).strict();

export const humanReviewUpdateSchema = z.object({
  status: z.enum(["unreviewed", "accepted", "dismissed"]),
  severityOverride: z.enum(["critical", "high", "medium", "low"]).nullable().optional(),
  reviewerNote: z.string().trim().max(2000).nullable().optional(),
  approvedRecommendation: z.string().trim().max(4000).nullable().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.status === "unreviewed") {
    if (value.severityOverride || value.reviewerNote || value.approvedRecommendation) {
      ctx.addIssue({
        code: "custom",
        message: "Unreviewed findings cannot carry human decisions.",
      });
    }
  }
});

export const versionLabelSchema = z.string().trim().min(1).max(160);
