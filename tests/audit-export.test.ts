import { describe, expect, it, vi } from "vitest";
import { auditToMarkdown, downloadAuditJson } from "@/lib/audit/export";
import type { AuditResult } from "@/src/types/audit";

const result: AuditResult = {
  version: "1.0",
  generatedAt: "2026-08-02T12:00:00.000Z",
  context: {
    screenTitle: "Checkout",
    scopeType: "user-flow",
    targetUser: "First-time buyer",
    taskDescription: "Complete checkout from cart to confirmation",
    businessObjective: "Reduce abandonment",
    expectedOutcome: "Complete payment confidently",
    productContext: "Mobile commerce checkout",
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
      evidenceRefs: [1, 2],
    },
  ],
  disclaimer: "AI-assisted first-pass review only.",
};

describe("auditToMarkdown", () => {
  it("creates a readable report with full audit definition and evidence provenance", () => {
    const markdown = auditToMarkdown(result);

    expect(markdown).toContain("# AI UX Audit Lite Report");
    expect(markdown).toContain("## Audit Definition");
    expect(markdown).toContain("- Audit title: Checkout");
    expect(markdown).toContain("- Scope: User Flow");
    expect(markdown).toContain("- Target user: First-time buyer");
    expect(markdown).toContain("- Task: Complete checkout from cart to confirmation");
    expect(markdown).toContain("- Business objective: Reduce abandonment");
    expect(markdown).toContain("- Expected outcome: Complete payment confidently");
    expect(markdown).toContain("- Product context: Mobile commerce checkout");
    expect(markdown).toContain("- Evidence: Evidence 1, Evidence 2");
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
        reviewerNote: "Escalated due to checkout drop-off impact",
      },
      "finding-2": {
        status: "dismissed" as const,
        severity: "low" as const,
        originalSeverity: "low" as const,
        reviewerNote: "False positive: only shown on desktop viewport",
      },
    };

    const triageSummary = {
      totalCount: 2,
      reviewedCount: 2,
      unreviewedCount: 0,
      acceptedCount: 1,
      dismissedCount: 1,
      overrideCount: 1,
      baselineScore: 92,
      adjustedScore: 82,
      reviewStatus: "completed" as const,
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
          evidenceRefs: [2],
        },
      ],
    };

    const markdown = auditToMarkdown(multiResult, triage, triageSummary);

    expect(markdown).toContain("## Human-in-the-Loop (HITL) Triage Summary");
    expect(markdown).toContain("- Review Status: completed");
    expect(markdown).toContain("- Baseline AI Score: 92/100");
    expect(markdown).toContain("- Adjusted Directional Score: 82/100");
    expect(markdown).toContain("- Reviewed Findings: 2 / 2");
    expect(markdown).toContain("- Accepted Findings: 1");
    expect(markdown).toContain("- Dismissed (False Positives): 1");
    expect(markdown).toContain("- Severity Overrides: 1");
    expect(markdown).toContain("- Remaining Unreviewed: 0");
    expect(markdown).toContain("### Severity Overrides Detail");
    expect(markdown).toContain("AI rated `medium` → Overridden to `critical`");
    expect(markdown).toContain("- Review Status: Dismissed");
    expect(markdown).toContain("- Reviewer Note: Escalated due to checkout drop-off impact");
    expect(markdown).toContain("- Reviewer Note: False positive: only shown on desktop viewport");
    expect(markdown).toContain("[DISMISSED]");
  });

  it("handles JSON export structure with aiBaseline and humanReview", () => {
    let exportedBlobContent = "";

    class MockBlob extends Blob {
      constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
        super(blobParts, options);
        if (blobParts && blobParts[0]) {
          exportedBlobContent = String(blobParts[0]);
        }
      }
    }

    vi.stubGlobal("Blob", MockBlob);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = () => {};

    try {
      const inProgressSummary = {
        totalCount: 2,
        reviewedCount: 1,
        unreviewedCount: 1,
        acceptedCount: 1,
        dismissedCount: 0,
        overrideCount: 0,
        baselineScore: 92,
        adjustedScore: 92,
        reviewStatus: "in-progress" as const,
      };

      downloadAuditJson(result, {}, inProgressSummary);
      const parsedInProgress = JSON.parse(exportedBlobContent);

      expect(parsedInProgress.aiBaseline).toBeDefined();
      expect(parsedInProgress.aiBaseline.findings[0].evidenceRefs).toEqual([1, 2]);
      expect(parsedInProgress.humanReview.status).toBe("in-progress");
      expect(parsedInProgress.humanReview.exportedAt).toBeDefined();
      expect(parsedInProgress.humanReview.completedAt).toBeUndefined();

      const completedSummary = {
        ...inProgressSummary,
        reviewedCount: 2,
        unreviewedCount: 0,
        reviewStatus: "completed" as const,
      };

      downloadAuditJson(result, {}, completedSummary);
      const parsedCompleted = JSON.parse(exportedBlobContent);

      expect(parsedCompleted.humanReview.status).toBe("completed");
      expect(parsedCompleted.humanReview.exportedAt).toBeDefined();
      expect(parsedCompleted.humanReview.completedAt).toBeUndefined();
      expect(parsedCompleted.humanReview.reviewedAt).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
      HTMLAnchorElement.prototype.click = originalClick;
    }
  });
});
