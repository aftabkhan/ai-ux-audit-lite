import type { AuditProvider, AuditProviderInput } from "@/lib/ai/provider";
import type { AuditResult } from "@/src/types/audit";

export class FixtureAuditProvider implements AuditProvider {
  readonly name = "fixture";

  async review(input: AuditProviderInput): Promise<AuditResult> {
    const screen = input.context.screenTitle || "the submitted interface";

    return {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      context: input.context,
      summary: {
        overview: `This development fixture demonstrates the structured result expected for ${screen}. It does not inspect image pixels and must not be represented as a real AI review.`,
        strengths: [
          "The interface provides a visible primary task area.",
          "The review context can be supplied without requiring an account.",
        ],
        priorityActions: [
          "Confirm that the primary action remains visually dominant.",
          "Review text contrast, labels, and keyboard focus before release.",
        ],
      },
      findings: [
        {
          id: "fixture-visual-hierarchy",
          title: "Validate primary-action prominence",
          severity: "medium",
          category: "visual-hierarchy",
          observation: "The fixture cannot inspect the screenshot, so primary-action prominence remains unverified.",
          impact: "Users may hesitate if several actions appear equally important.",
          recommendation: "Use size, position, contrast, and spacing to establish one clear next action.",
          confidence: "low",
        },
        {
          id: "fixture-accessibility",
          title: "Complete an accessibility review",
          severity: "high",
          category: "accessibility-basics",
          observation: "Automated fixture mode cannot validate contrast, focus order, semantics, or assistive-technology behavior.",
          impact: "Accessibility barriers may prevent people from understanding or completing the task.",
          recommendation: "Run keyboard, screen-reader, zoom, and contrast checks with the implemented interface.",
          confidence: "high",
        },
      ],
      disclaimer: "Development fixture only. This response is not generated from screenshot analysis and is not a formal UX or accessibility audit.",
    };
  }
}
