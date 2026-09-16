import { describe, expect, it } from "vitest";
import {
  auditDefinitionSchema,
  evidenceMetadataSchema,
  humanReviewUpdateSchema,
} from "@/lib/audit/lifecycle-schema";

describe("audit lifecycle schema", () => {
  it("accepts a bounded multi-screen audit definition", () => {
    const result = auditDefinitionSchema.safeParse({
      title: "Checkout flow audit",
      scopeType: "user-flow",
      targetUser: "First-time mobile customer",
      taskDescription: "Complete checkout from cart to confirmation",
      businessObjective: "Reduce checkout abandonment",
      expectedOutcome: "Customer completes the purchase",
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown fields and oversized context", () => {
    expect(
      auditDefinitionSchema.safeParse({
        title: "Checkout",
        scopeType: "single-screen",
        reviewerId: "client-supplied-owner",
      }).success,
    ).toBe(false);

    expect(
      auditDefinitionSchema.safeParse({
        title: "Checkout",
        scopeType: "single-screen",
        productContext: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });

  it("enforces evidence size, type and sequence bounds", () => {
    expect(
      evidenceMetadataSchema.safeParse({
        label: "Checkout step 1",
        sequenceIndex: 0,
        mimeType: "image/png",
        byteSize: 1024,
      }).success,
    ).toBe(true);

    expect(
      evidenceMetadataSchema.safeParse({
        label: "Too large",
        sequenceIndex: 0,
        mimeType: "image/png",
        byteSize: 5 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);

    expect(
      evidenceMetadataSchema.safeParse({
        label: "Unsupported",
        sequenceIndex: 0,
        mimeType: "image/svg+xml",
        byteSize: 1024,
      }).success,
    ).toBe(false);
  });

  it("prevents an unreviewed finding from carrying a human decision", () => {
    expect(
      humanReviewUpdateSchema.safeParse({
        status: "unreviewed",
        reviewerNote: "Looks fine",
      }).success,
    ).toBe(false);

    expect(
      humanReviewUpdateSchema.safeParse({
        status: "accepted",
        severityOverride: "high",
        reviewerNote: "Confirmed against the supplied flow.",
      }).success,
    ).toBe(true);
  });
});
