import { describe, expect, it } from "vitest";
import { createAuditScorecard, describeScore } from "@/lib/audit/score";
import type { AuditFinding } from "@/src/types/audit";

const findings: AuditFinding[] = [
  {
    id: "one",
    title: "Primary action lacks emphasis",
    severity: "high",
    category: "visual-hierarchy",
    observation: "Several actions have similar visual weight.",
    impact: "Users may hesitate.",
    recommendation: "Establish one dominant action.",
    confidence: "high",
  },
  {
    id: "two",
    title: "Supporting text is dense",
    severity: "medium",
    category: "readability",
    observation: "Paragraphs are difficult to scan.",
    impact: "Important content may be missed.",
    recommendation: "Break content into shorter sections.",
    confidence: "medium",
  },
];

describe("createAuditScorecard", () => {
  it("applies documented severity penalties", () => {
    const scorecard = createAuditScorecard(findings);

    expect(scorecard.overall).toBe(82);
    expect(scorecard.byCategory).toEqual([
      { category: "visual-hierarchy", score: 88, findings: 1 },
      { category: "readability", score: 94, findings: 1 },
    ]);
  });

  it("clamps heavily penalized reports at zero", () => {
    const repeated = Array.from({ length: 10 }, (_, index) => ({
      ...findings[0],
      id: String(index),
    }));

    expect(createAuditScorecard(repeated).overall).toBe(0);
  });

  it("recalculates score when findings are dismissed", () => {
    // Baseline: high (12) + medium (6) = 18 penalty => score 82
    const baseline = createAuditScorecard(findings);
    expect(baseline.overall).toBe(82);

    // Dismiss finding one (high severity dismissed): only finding two (medium: 6 penalty) remains
    const activeAfterDismissal = findings.filter((f) => f.id !== "one");
    const recalculated = createAuditScorecard(activeAfterDismissal);
    expect(recalculated.overall).toBe(94);
    expect(recalculated.byCategory).toEqual([
      { category: "readability", score: 94, findings: 1 },
    ]);
  });

  it("recalculates score when severity is overridden (critical, high, medium, low)", () => {
    // Override finding two from medium (6) to low (2)
    const downgraded = findings.map((f) => (f.id === "two" ? { ...f, severity: "low" as const } : f));
    // High (12) + Low (2) = 14 penalty => 86
    expect(createAuditScorecard(downgraded).overall).toBe(86);

    // Override finding one from high (12) to critical (18)
    const escalated = findings.map((f) => (f.id === "one" ? { ...f, severity: "critical" as const } : f));
    // Critical (18) + Medium (6) = 24 penalty => 76
    expect(createAuditScorecard(escalated).overall).toBe(76);
  });

  it("clamps score to 100 when all findings are dismissed", () => {
    expect(createAuditScorecard([]).overall).toBe(100);
  });
});

describe("describeScore", () => {
  it("returns plain-language score bands", () => {
    expect(describeScore(92)).toBe("Strong foundation");
    expect(describeScore(80)).toBe("Generally effective");
    expect(describeScore(65)).toBe("Needs focused improvement");
    expect(describeScore(40)).toBe("Needs significant attention");
  });
});
