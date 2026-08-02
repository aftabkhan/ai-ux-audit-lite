import type { AuditProvider, AuditProviderInput } from "@/lib/ai/provider";
import type { AuditResult } from "@/src/types/audit";

export class FixtureAuditProvider implements AuditProvider {
  readonly name = "fixture";

  async review(input: AuditProviderInput): Promise<AuditResult> {
    const screenName = input.context.screenTitle || input.image.fileName;

    return {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      context: input.context,
      summary: {
        overview: `This sample report demonstrates the result structure for ${screenName}. Fixture mode is deterministic and does not inspect screenshot pixels.`,
        strengths: [
          "The screen can be evaluated through a clear hierarchy of findings.",
          "Recommendations are separated from observations and likely impact.",
        ],
        priorityActions: [
          "Confirm one visually dominant primary action.",
          "Review content grouping and scanability.",
          "Validate keyboard, focus, and contrast behaviour manually.",
        ],
      },
      findings: [
        {
          id: "primary-action-emphasis",
          title: "Primary action may need stronger emphasis",
          severity: "high",
          category: "visual-hierarchy",
          observation: "Fixture mode provides a representative hierarchy finding rather than analysing the submitted pixels.",
          impact: "Users may hesitate when multiple actions appear equally important.",
          recommendation: "Use position, contrast, label clarity, and surrounding space to establish one primary action.",
          confidence: "low",
        },
        {
          id: "content-scanability",
          title: "Supporting content should remain easy to scan",
          severity: "medium",
          category: "readability",
          observation: "Dense or weakly grouped content commonly increases review effort.",
          impact: "Important information can be missed during quick task completion.",
          recommendation: "Use concise headings, shorter text blocks, and consistent spacing between related groups.",
          confidence: "low",
        },
        {
          id: "visible-system-status",
          title: "System status should be explicit",
          severity: "medium",
          category: "feedback-system-status",
          observation: "Loading, success, and failure states should remain visible near the action that triggered them.",
          impact: "Unclear feedback can lead to repeated actions or uncertainty.",
          recommendation: "Provide accessible progress, success, and recovery messages with clear next steps.",
          confidence: "low",
        },
        {
          id: "accessibility-verification",
          title: "Accessibility requires manual verification",
          severity: "low",
          category: "accessibility-basics",
          observation: "A screenshot cannot confirm keyboard order, semantic structure, announcements, or exact contrast values.",
          impact: "Visual review alone can miss barriers affecting keyboard and assistive-technology users.",
          recommendation: "Validate focus order, accessible names, semantics, zoom behaviour, and contrast with appropriate tools.",
          confidence: "high",
        },
      ],
      disclaimer:
        "Fixture mode returns deterministic sample content and does not inspect screenshot pixels. Use a configured multimodal provider for screenshot-specific feedback.",
    };
  }
}
