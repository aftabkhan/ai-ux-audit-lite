import type { AuditResult } from "@/src/types/audit";

export function auditToMarkdown(result: AuditResult): string {
  const contextLines = [
    result.context.screenTitle ? `- Screen: ${result.context.screenTitle}` : null,
    result.context.targetUser ? `- Target user: ${result.context.targetUser}` : null,
    result.context.productContext ? `- Context: ${result.context.productContext}` : null,
  ].filter(Boolean);

  const findings = result.findings
    .map(
      (finding, index) =>
        `### ${index + 1}. ${finding.title}\n\n` +
        `- Severity: ${finding.severity}\n` +
        `- Category: ${finding.category}\n` +
        `- Confidence: ${finding.confidence}\n\n` +
        `**Observation**\n\n${finding.observation}\n\n` +
        `**Impact**\n\n${finding.impact}\n\n` +
        `**Recommendation**\n\n${finding.recommendation}`,
    )
    .join("\n\n---\n\n");

  return [
    "# AI UX Audit Lite Report",
    "",
    `Generated: ${new Date(result.generatedAt).toLocaleString()}`,
    "",
    contextLines.length ? "## Context\n\n" + contextLines.join("\n") : null,
    "## Summary",
    "",
    result.summary.overview,
    "",
    "### Strengths",
    "",
    ...result.summary.strengths.map((item) => `- ${item}`),
    "",
    "### Priority actions",
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

export function downloadAuditJson(result: AuditResult): void {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  downloadBlob(blob, "ai-ux-audit-report.json");
}

export function downloadAuditMarkdown(result: AuditResult): void {
  const blob = new Blob([auditToMarkdown(result)], { type: "text/markdown;charset=utf-8" });
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
