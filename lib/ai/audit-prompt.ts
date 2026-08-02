import type { AuditContext } from "@/src/types/audit";

export function buildAuditPrompt(context: AuditContext): string {
  const contextLines = [
    context.screenTitle ? `Screen title: ${context.screenTitle}` : null,
    context.targetUser ? `Target user: ${context.targetUser}` : null,
    context.productContext ? `Product context: ${context.productContext}` : null,
  ].filter(Boolean);

  return `You are a senior UX reviewer evaluating one interface screenshot.

Analyze only what is visible in the screenshot and supported by the supplied context. Do not invent hidden flows, analytics, research findings, technical implementation, contrast ratios, keyboard behavior, or screen-reader behavior. When something cannot be verified from a screenshot, say so and lower confidence.

Review the interface across these eight lenses:
1. visual-hierarchy
2. navigation-orientation
3. clarity-of-actions
4. consistency
5. readability
6. feedback-system-status
7. error-prevention-recovery
8. accessibility-basics

${contextLines.length ? `Context:\n${contextLines.join("\n")}` : "No additional product context was supplied."}

Return valid JSON only using this exact structure:
{
  "overview": "2-4 sentence executive summary grounded in the screenshot",
  "strengths": ["2-4 specific strengths"],
  "priorityActions": ["3-5 highest-value actions ordered by priority"],
  "findings": [
    {
      "id": "short-kebab-case-id",
      "title": "concise finding title",
      "severity": "high|medium|low",
      "category": "one of the eight lens identifiers",
      "observation": "specific visible evidence from the screenshot",
      "impact": "likely user or business impact stated cautiously",
      "recommendation": "specific and actionable improvement",
      "confidence": "high|medium|low"
    }
  ]
}

Quality rules:
- Produce 5-10 non-duplicative findings.
- Mention visible regions, labels, alignment, grouping, controls, or content where relevant.
- Balance problems with strengths.
- Use high severity only for issues likely to block or seriously impair task completion.
- Treat accessibility as a visual first pass only.
- Do not claim WCAG compliance or failure from the screenshot alone.
- Keep recommendations practical for a product team.`;
}
