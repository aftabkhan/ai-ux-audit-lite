import type { AuditResult, AuditTriageMap, AuditTriageSummary } from "@/src/types/audit";

export function auditToMarkdown(
  result: AuditResult,
  triage?: AuditTriageMap,
  triageSummary?: AuditTriageSummary,
): string {
  const contextLines = [
    result.context.screenTitle ? `- Screen: ${result.context.screenTitle}` : null,
    result.context.targetUser ? `- Target user: ${result.context.targetUser}` : null,
    result.context.productContext ? `- Context: ${result.context.productContext}` : null,
  ].filter(Boolean);

  let hitlSection: string | null = null;
  if (triageSummary) {
    const overrideLines = triage
      ? Object.entries(triage)
          .filter(([, state]) => state.severity !== state.originalSeverity)
          .map(([id, state]) => {
            const finding = result.findings.find((f) => f.id === id);
            return `- **${finding?.title ?? id}**: AI rated \`${state.originalSeverity}\` → Overridden to \`${state.severity}\``;
          })
      : [];

    hitlSection = [
      "## Human-in-the-Loop (HITL) Triage Summary",
      "",
      `- Review Status: ${triageSummary.reviewStatus}`,
      `- Baseline AI Score: ${triageSummary.baselineScore}/100`,
      `- Adjusted Directional Score: ${triageSummary.adjustedScore}/100`,
      `- Reviewed Findings: ${triageSummary.reviewedCount} / ${triageSummary.totalCount}`,
      `- Accepted Findings: ${triageSummary.acceptedCount}`,
      `- Dismissed (False Positives): ${triageSummary.dismissedCount}`,
      `- Severity Overrides: ${triageSummary.overrideCount}`,
      `- Remaining Unreviewed: ${triageSummary.unreviewedCount}`,
      ...(overrideLines.length
        ? ["", "### Severity Overrides Detail", "", ...overrideLines]
        : []),
    ].join("\n");
  }

  const findings = result.findings
    .map((finding, index) => {
      const itemTriage = triage?.[finding.id];
      const status = itemTriage?.status ?? "unreviewed";
      const effectiveSeverity = itemTriage?.severity ?? finding.severity;
      const isDismissed = status === "dismissed";
      const isOverridden = itemTriage && itemTriage.severity !== itemTriage.originalSeverity;

      const formatStatus = (s: string) => {
        if (s === "accepted") return "Accepted";
        if (s === "dismissed") return "Dismissed";
        return "Unreviewed";
      };

      const metaLines = [
        `- Review Status: ${formatStatus(status)}`,
        `- Severity: ${effectiveSeverity}${
          isOverridden ? ` (Overridden from ${itemTriage.originalSeverity})` : ""
        }`,
        `- Category: ${finding.category}`,
        `- Confidence: ${finding.confidence}`,
        ...(itemTriage?.reviewerNote?.trim()
          ? [`- Reviewer Note: ${itemTriage.reviewerNote.trim()}`]
          : []),
      ];

      return (
        `### ${index + 1}. ${finding.title}${isDismissed ? " [DISMISSED]" : ""}\n\n` +
        metaLines.join("\n") +
        `\n\n**Observation**\n\n${finding.observation}\n\n` +
        `**Impact**\n\n${finding.impact}\n\n` +
        `**Recommendation**\n\n${finding.recommendation}`
      );
    })
    .join("\n\n---\n\n");

  return [
    "# AI UX Audit Lite Report",
    "",
    `Generated: ${new Date(result.generatedAt).toLocaleString()}`,
    "",
    contextLines.length ? "## Context\n\n" + contextLines.join("\n") : null,
    hitlSection,
    "",
    "## Summary",
    "",
    result.summary.overview,
    "",
    "### Strengths",
    "",
    ...result.summary.strengths.map((item) => `- ${item}`),
    "",
    "### AI Baseline — Priority Actions (Pre-Review)",
    "",
    ...result.summary.priorityActions.map((item) => `- ${item}`),
    "",
    "## Findings",
    "",
    findings,
    "",
    "## Disclaimer",
    "",
    result.disclaimer,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function downloadAuditJson(
  result: AuditResult,
  triage?: AuditTriageMap,
  triageSummary?: AuditTriageSummary,
): void {
  const now = new Date().toISOString();
  const payload = triageSummary
    ? {
        aiBaseline: result,
        humanReview: {
          status: triageSummary.reviewStatus,
          triage: triage ?? {},
          summary: triageSummary,
          exportedAt: now,
          ...(triageSummary.reviewStatus === "completed" ? { completedAt: now } : {}),
        },
      }
    : {
        ...result,
      };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, "ai-ux-audit-report.json");
}

export function downloadAuditMarkdown(
  result: AuditResult,
  triage?: AuditTriageMap,
  triageSummary?: AuditTriageSummary,
): void {
  const blob = new Blob([auditToMarkdown(result, triage, triageSummary)], {
    type: "text/markdown;charset=utf-8",
  });
  downloadBlob(blob, "ai-ux-audit-report.md");
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
