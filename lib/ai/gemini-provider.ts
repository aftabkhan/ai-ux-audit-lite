import type { AuditProvider, AuditProviderInput } from "@/lib/ai/provider";
import { buildAuditPrompt } from "@/lib/ai/audit-prompt";
import { AuditServiceError } from "@/lib/audit/errors";
import { auditResultSchema } from "@/lib/audit/schema";
import type { AuditResult } from "@/src/types/audit";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface ModelAuditPayload {
  overview: string;
  strengths: string[];
  priorityActions: string[];
  findings: AuditResult["findings"];
}

export class GeminiAuditProvider implements AuditProvider {
  readonly name = "gemini";

  async review(input: AuditProviderInput): Promise<AuditResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AuditServiceError(
        "PROVIDER_ERROR",
        "The AI audit provider is not configured.",
        503,
        "Add GEMINI_API_KEY to the server environment or use fixture mode for development.",
      );
    }

    const model = process.env.GEMINI_AUDIT_MODEL ?? "gemini-3.6-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: buildAuditPrompt(input.context) },
              {
                inlineData: {
                  mimeType: input.image.mimeType,
                  data: Buffer.from(input.image.bytes).toString("base64"),
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Gemini audit request failed", response.status, detail.slice(0, 500));
      throw new AuditServiceError(
        "PROVIDER_ERROR",
        "The AI provider could not complete the screenshot review.",
        502,
        "Retry in a moment. If the problem continues, check the provider configuration and usage limits.",
      );
    }

    const raw = (await response.json()) as GeminiResponse;
    const parsed = parseModelPayload(extractOutputText(raw));
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
      console.error("Gemini audit response failed validation", validated.error.flatten());
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

function extractOutputText(response: GeminiResponse): string {
  const text = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter((part): part is string => Boolean(part))
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
