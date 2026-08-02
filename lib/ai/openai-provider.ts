import type { AuditProvider, AuditProviderInput } from "@/lib/ai/provider";
import { buildAuditPrompt } from "@/lib/ai/audit-prompt";
import { AuditServiceError } from "@/lib/audit/errors";
import { auditResultSchema } from "@/lib/audit/schema";
import type { AuditResult } from "@/src/types/audit";

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

interface ModelAuditPayload {
  overview: string;
  strengths: string[];
  priorityActions: string[];
  findings: AuditResult["findings"];
}

export class OpenAIAuditProvider implements AuditProvider {
  readonly name = "openai";

  async review(input: AuditProviderInput): Promise<AuditResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AuditServiceError(
        "PROVIDER_ERROR",
        "The AI audit provider is not configured.",
        503,
        "Add OPENAI_API_KEY to the server environment or use fixture mode for development.",
      );
    }

    const model = process.env.OPENAI_AUDIT_MODEL ?? "gpt-5";
    const imageUrl = `data:${input.image.mimeType};base64,${Buffer.from(input.image.bytes).toString("base64")}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: buildAuditPrompt(input.context) },
              { type: "input_image", image_url: imageUrl, detail: "high" },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI audit request failed", response.status, detail.slice(0, 500));
      throw new AuditServiceError(
        "PROVIDER_ERROR",
        "The AI provider could not complete the screenshot review.",
        502,
        "Retry in a moment. If the problem continues, check the provider configuration and usage limits.",
      );
    }

    const raw = (await response.json()) as OpenAIResponse;
    const text = extractOutputText(raw);
    const parsed = parseModelPayload(text);

    const result: AuditResult = {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      context: input.context,
      summary: {
        overview: parsed.overview,
        strengths: parsed.strengths,
        priorityActions: parsed.priorityActions,
      },
      findings: parsed.findings,
      disclaimer:
        "AI-generated first-pass UX review based on one screenshot and the context provided. Validate findings through user research, accessibility testing, analytics, and expert review before making product decisions.",
    };

    const validated = auditResultSchema.safeParse(result);
    if (!validated.success) {
      console.error("OpenAI audit response failed validation", validated.error.flatten());
      throw new AuditServiceError(
        "INVALID_RESPONSE",
        "The AI provider returned an incomplete audit report.",
        502,
        "Retry the audit. If the problem continues, review the model and prompt configuration.",
      );
    }

    return validated.data;
  }
}

function extractOutputText(response: OpenAIResponse): string {
  if (response.output_text?.trim()) return response.output_text.trim();

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new AuditServiceError(
      "INVALID_RESPONSE",
      "The AI provider returned no audit content.",
      502,
      "Retry the audit.",
    );
  }

  return text;
}

function parseModelPayload(text: string): ModelAuditPayload {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    return JSON.parse(cleaned) as ModelAuditPayload;
  } catch {
    throw new AuditServiceError(
      "INVALID_RESPONSE",
      "The AI provider returned an unreadable audit report.",
      502,
      "Retry the audit.",
    );
  }
}
