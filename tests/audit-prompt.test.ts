import { describe, expect, it } from "vitest";
import { buildAuditPrompt } from "@/lib/ai/audit-prompt";

describe("buildAuditPrompt", () => {
  it("includes supplied context and review lenses", () => {
    const prompt = buildAuditPrompt({
      screenTitle: "Checkout payment",
      targetUser: "First-time customer",
      productContext: "Mobile ecommerce checkout",
    });

    expect(prompt).toContain("Checkout payment");
    expect(prompt).toContain("First-time customer");
    expect(prompt).toContain("visual-hierarchy");
    expect(prompt).toContain("accessibility-basics");
  });

  it("prevents unsupported claims", () => {
    const prompt = buildAuditPrompt({});
    expect(prompt).toContain("Do not invent hidden flows");
    expect(prompt).toContain("Do not claim WCAG compliance or failure");
    expect(prompt).toContain("Return valid JSON only");
  });
});
