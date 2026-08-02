import { describe, expect, it } from "vitest";
import { auditContextSchema, auditResultSchema } from "@/lib/audit/schema";

const validResult = {
  version: "1.0",
  generatedAt: "2026-08-02T12:00:00.000Z",
  context: { screenTitle: "Checkout" },
  summary: {
    overview: "A focused first-pass review.",
    strengths: ["Clear page purpose"],
    priorityActions: ["Clarify the primary action"],
  },
  findings: [
    {
      id: "finding-1",
      title: "Primary action needs stronger emphasis",
      severity: "medium",
      category: "clarity-of-actions",
      observation: "Multiple actions have similar visual weight.",
      impact: "Users may hesitate before continuing.",
      recommendation: "Give the primary action a distinct visual treatment.",
      confidence: "medium",
    },
  ],
  disclaimer: "AI-assisted first-pass review only.",
} as const;

describe("audit schemas", () => {
  it("accepts a valid audit result", () => {
    expect(auditResultSchema.safeParse(validResult).success).toBe(true);
  });

  it("rejects unsupported categories", () => {
    const invalid = {
      ...validResult,
      findings: [{ ...validResult.findings[0], category: "performance" }],
    };

    expect(auditResultSchema.safeParse(invalid).success).toBe(false);
  });

  it("enforces context length limits", () => {
    expect(auditContextSchema.safeParse({ screenTitle: "x".repeat(101) }).success).toBe(false);
  });
});
