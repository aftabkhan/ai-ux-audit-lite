import type { AuditCategory, AuditFinding, FindingSeverity } from "@/src/types/audit";

const severityPenalty: Record<FindingSeverity, number> = {
  high: 12,
  medium: 6,
  low: 2,
};

export interface AuditScorecard {
  overall: number;
  byCategory: Array<{
    category: AuditCategory;
    score: number;
    findings: number;
  }>;
}

export function createAuditScorecard(findings: AuditFinding[]): AuditScorecard {
  const overallPenalty = findings.reduce(
    (total, finding) => total + severityPenalty[finding.severity],
    0,
  );

  const categories = Array.from(new Set(findings.map((finding) => finding.category)));

  return {
    overall: clampScore(100 - overallPenalty),
    byCategory: categories
      .map((category) => {
        const categoryFindings = findings.filter((finding) => finding.category === category);
        const penalty = categoryFindings.reduce(
          (total, finding) => total + severityPenalty[finding.severity],
          0,
        );

        return {
          category,
          score: clampScore(100 - penalty),
          findings: categoryFindings.length,
        };
      })
      .sort((left, right) => left.score - right.score),
  };
}

export function describeScore(score: number): string {
  if (score >= 90) return "Strong foundation";
  if (score >= 75) return "Generally effective";
  if (score >= 60) return "Needs focused improvement";
  return "Needs significant attention";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}
