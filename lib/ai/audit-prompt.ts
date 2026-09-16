import type { AuditContext } from "@/src/types/audit";

export function buildAuditPrompt(context: AuditContext, evidenceCount = 1): string {
  const contextLines = [
    context.screenTitle ? `Audit title / screen title: ${context.screenTitle}` : null,
    context.targetUser ? `Target user: ${context.targetUser}` : null,
    context.productContext ? `Product context: ${context.productContext}` : null,
  ].filter(Boolean);

  const evidenceDescription = evidenceCount === 1
    ? "one interface screenshot"
    : `${evidenceCount} ordered interface screenshots that may represent a sequence or flow`;

  return `You are a senior UX reviewer evaluating ${evidenceDescription}.

Analyze only what is visible in the supplied evidence and what is supported by the supplied context. Treat evidence order as meaningful when multiple screenshots are provided. Do not invent hidden flows, analytics, research findings, technical implementation, contrast ratios, keyboard behavior, or screen-reader behavior. When something cannot be verified, say so and lower confidence.

When multiple screenshots are supplied:
- compare continuity, hierarchy, navigation, labels, feedback and task progression across the sequence;
- identify cross-screen inconsistency or workflow friction only when evidence supports it;
- refer to evidence positions such as "Evidence 1" or "Evidence 2" in observations where useful;
- never claim behavior that is not visible in the sequence.

Review the interface evidence across these eight currently supported lenses:
1. visual-hierarchy
2. navigation-orientation
3. clarity-of-actions
4. consistency
5. readability
6. feedback-system-status
7. error-prevention-recovery
8. accessibility-basics

${contextLines.length ? `Context:\n${contextLines.join("\n")}` : "No additional product context was supplied."}

Return valid JSON only. Do not wrap it in markdown. Use this exact structure:
{
  "overview": "2-4 sentence executive summary grounded in the supplied evidence",
  "strengths": ["2-4 specific strengths"],
  "priorityActions": ["3-5 highest-value actions ordered by priority"],
  "findings": [
    {
      "id": "short-kebab-case-id",
      "title": "concise finding title",
      "severity": "high|medium|low",
      "category": "one of the eight lens identifiers",
      "observation": "specific evidence-grounded observation; identify evidence position when useful",
      "impact": "likely user or business impact stated cautiously",
      "recommendation": "specific and actionable improvement",
      "confidence": "high|medium|low"
    }
  ]
}

Quality rules:
- Produce 5-10 non-duplicative findings.
- Mention visible interface regions, labels, alignment, grouping, controls, content or sequence transitions where relevant.
- Balance problems with strengths.
- Use high severity only for issues likely to block or seriously impair task completion.
- Treat accessibility as a visual first-pass only.
- Do not claim WCAG compliance or failure from screenshot evidence alone.
- Keep recommendations practical for a product team.`;
}
