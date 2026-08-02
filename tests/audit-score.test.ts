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
    const repeated = Array.from({ length: 10 }, (_, index) => ({ ...findings[0], id: String(index) }));
    expect(createAuditScorecard(repeated).overall).toBe(0);
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
