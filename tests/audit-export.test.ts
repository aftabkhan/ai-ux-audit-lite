import { describe, expect, it } from "vitest";
import { auditToMarkdown } from "@/lib/audit/export";
import type { AuditResult } from "@/src/types/audit";

const result: AuditResult = {
  version: "1.0",
  generatedAt: "2026-08-02T12:00:00.000Z",
  context: {
    screenTitle: "Checkout",
    targetUser: "First-time buyer",
  },
  summary: {
    overview: "A focused first-pass review.",
    strengths: ["Clear purpose"],
    priorityActions: ["Clarify the primary action"],
  },
  findings: [
    {
      id: "finding-1",
      title: "Primary action needs emphasis",
      severity: "medium",
      category: "clarity-of-actions",
      observation: "Actions have similar visual weight.",
      impact: "Users may hesitate.",
      recommendation: "Strengthen the primary action.",
      confidence: "medium",
    },
  ],
  disclaimer: "AI-assisted first-pass review only.",
};

describe("auditToMarkdown", () => {
  it("creates a readable report with context and findings", () => {
    const markdown = auditToMarkdown(result);

    expect(markdown).toContain("# AI UX Audit Lite Report");
    expect(markdown).toContain("- Screen: Checkout");
    expect(markdown).toContain("## Findings");
    expect(markdown).toContain("Primary action needs emphasis");
    expect(markdown).toContain(result.disclaimer);
  });
});
