import { describe, expect, it } from "vitest";
import { buildAuditPrompt } from "@/lib/ai/audit-prompt";

describe("buildAuditPrompt", () => {
  it("includes supplied audit context, professional dimensions, and evidence provenance", () => {
    const prompt = buildAuditPrompt(
      {
        screenTitle: "Checkout payment",
        scopeType: "user-flow",
        targetUser: "First-time customer",
        taskDescription: "Complete checkout from cart to confirmation",
        businessObjective: "Reduce abandonment",
        expectedOutcome: "Complete payment confidently",
        productContext: "Mobile ecommerce checkout",
      },
      2,
    );

    expect(prompt).toContain("Checkout payment");
    expect(prompt).toContain("user-flow");
    expect(prompt).toContain("First-time customer");
    expect(prompt).toContain("Complete checkout from cart to confirmation");
    expect(prompt).toContain("Reduce abandonment");
    expect(prompt).toContain("Complete payment confidently");
    expect(prompt).toContain("Mobile ecommerce checkout");
    expect(prompt).toContain("visual-hierarchy");
    expect(prompt).toContain("accessibility");
    expect(prompt).toContain("workflow-friction");
    expect(prompt).toContain("evidenceRefs");
    expect(prompt).toContain("integers from 1 through 2");
  });

  it("prevents unsupported accessibility and hidden-flow claims", () => {
    const prompt = buildAuditPrompt({});

    expect(prompt).toContain("Do not invent hidden flows");
    expect(prompt).toContain("Do not claim WCAG compliance or failure");
    expect(prompt).toContain("Return valid JSON only");
  });
});
