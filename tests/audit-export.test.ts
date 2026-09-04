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

  it("includes dedicated Human-in-the-Loop Triage Summary when triage state is supplied", () => {
    const triage = {
      "finding-1": {
        status: "accepted" as const,
        severity: "critical" as const,
        originalSeverity: "medium" as const,
      },
      "finding-2": {
        status: "dismissed" as const,
        severity: "low" as const,
        originalSeverity: "low" as const,
      },
    };

    const triageSummary = {
      acceptedCount: 1,
      dismissedCount: 1,
      overrideCount: 1,
      baselineScore: 92,
      adjustedScore: 82,
    };

    const multiResult: AuditResult = {
      ...result,
      findings: [
        ...result.findings,
        {
          id: "finding-2",
          title: "Minor label contrast issue",
          severity: "low",
          category: "accessibility-basics",
          observation: "Footer link contrast is 4.1:1.",
          impact: "Low vision users may struggle.",
          recommendation: "Increase contrast to 4.5:1.",
          confidence: "high",
        },
      ],
    };

    const markdown = auditToMarkdown(multiResult, triage, triageSummary);

    expect(markdown).toContain("## Human-in-the-Loop Triage Summary");
    expect(markdown).toContain("- Baseline AI Score: 92/100");
    expect(markdown).toContain("- Final Adjusted Score: 82/100");
    expect(markdown).toContain("- Accepted Findings: 1");
    expect(markdown).toContain("- Dismissed / False Positives: 1");
    expect(markdown).toContain("- Severity Overrides: 1");
    expect(markdown).toContain("### Severity Overrides Detail");
    expect(markdown).toContain("AI rated `medium` → Overridden to `critical`");
    expect(markdown).toContain("- Status: Dismissed (False Positive)");
    expect(markdown).toContain("[DISMISSED]");
  });
});
