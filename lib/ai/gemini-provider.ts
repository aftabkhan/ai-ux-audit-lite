import { GeminiRequestError, requestGeminiJson } from "@/lib/ai/gemini-request";
import type { AuditProvider, AuditProviderInput } from "@/lib/ai/provider";
import { buildAuditContextMessage, buildAuditInstructions } from "@/lib/ai/audit-prompt";
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

    if (input.images.length === 0) {
      throw new AuditServiceError("INVALID_REQUEST", "At least one screenshot is required.", 400);
    }

    const model = input.model ?? process.env.GEMINI_AUDIT_MODEL ?? "gemini-3.6-flash";
    const evidenceParts = input.images.flatMap((image, index) => [
      { text: `Evidence ${index + 1} of ${input.images.length}: ${safeEvidenceLabel(image.fileName)}` },
      {
        inlineData: {
          mimeType: image.mimeType,
          data: Buffer.from(image.bytes).toString("base64"),
        },
      },
    ]);

    let raw: unknown;
    try {
      raw = await requestGeminiJson({
        apiKey,
        model,
        operation: "audit",
        timeoutMs: 60_000,
        body: {
          systemInstruction: {
            parts: [{ text: buildAuditInstructions(input.images.length) }],
          },
          contents: [{
            role: "user",
            parts: [{ text: buildAuditContextMessage(input.context) }, ...evidenceParts],
          }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        },
      });
    } catch (error) {
      if (error instanceof GeminiRequestError) {
        throw new AuditServiceError(error.code, error.message, error.status,
          "Your inputs are still available. Retry the audit in a moment.", error.upstreamStatus);
      }
      throw error;
    }

    const parsed = parseModelPayload(extractOutputText(raw));
    if (!parsed || typeof parsed !== "object") {
      throw new AuditServiceError("INVALID_RESPONSE", "The AI provider returned an incomplete audit report.", 502, "Retry the audit.");
    }
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
        "AI-generated first-pass UX review based on the supplied screenshot evidence and context. Validate findings through user research, accessibility testing, analytics, and expert review before making product decisions.",
    };

    const validated = auditResultSchema.safeParse(result);
    if (!validated.success) {
      console.error("Gemini audit response failed validation", { issueCount: validated.error.issues.length });
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

function safeEvidenceLabel(fileName: string): string {
  return fileName.replace(/[\r\n\t]/g, " ").slice(0, 120) || "screenshot";
}

function extractOutputText(raw: unknown): string {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as GeminiResponse).candidates)) {
    throw new AuditServiceError("INVALID_RESPONSE", "The AI provider returned no audit content.", 502, "Retry the audit.");
  }
  const response = raw as GeminiResponse;
  const text = response.candidates
    ?.flatMap((candidate) => Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [])
    .map((part) => part?.text)
    .filter((part): part is string => typeof part === "string" && Boolean(part))
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
