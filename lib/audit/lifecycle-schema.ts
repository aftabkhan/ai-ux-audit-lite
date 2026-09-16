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

export const persistedAuditSchema = auditDefinitionSchema.extend({
  id: z.string().uuid(),
  reviewerId: z.string().uuid(),
  status: auditLifecycleStatusSchema,
  archivedAt: z.string().datetime().optional(),
  finalizedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export const auditEvidenceRecordSchema = z.object({
  id: z.string().uuid(),
  auditId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  evidenceType: z.literal("screenshot"),
  label: z.string().min(1).max(160),
  sequenceIndex: z.number().int().min(0).max(199),
  objectKey: z.string().min(1).max(500),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  byteSize: z.number().int().positive().max(5 * 1024 * 1024),
  createdAt: z.string().datetime(),
}).strict();

export const auditVersionSnapshotSchema = z.object({
  audit: persistedAuditSchema,
  evidence: z.array(auditEvidenceRecordSchema),
  runId: z.string().uuid().nullable().optional(),
  findings: z.array(z.object({
    findingId: z.string().uuid(),
    sourceFindingId: z.string().min(1).max(160),
    dimension: auditDimensionSchema,
    aiSeverity: z.enum(["critical", "high", "medium", "low"]),
    reviewStatus: z.enum(["unreviewed", "accepted", "dismissed"]),
    severityOverride: z.enum(["critical", "high", "medium", "low"]).optional(),
    reviewerNote: z.string().optional(),
    approvedRecommendation: z.string().optional(),
  }).strict()),
}).strict();
