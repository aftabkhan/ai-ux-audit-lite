// Text/structured-output Gemini choices verified against Google's model catalog, 2026-10-05.
// Availability depends on the server's Google project. Custom IDs support other compatible models.
export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
export const GEMINI_MODELS = [
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
  { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash" },
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (preview)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (legacy access)" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite (legacy access)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (legacy access)" },
] as const;

export const GEMINI_MODEL_PATTERN = /^gemini-[a-z0-9][a-z0-9.-]{0,79}$/;

/** undefined = server default; null = malformed; otherwise a validated model ID. */
export function parseGeminiModel(value: unknown): string | undefined | null {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value !== "string") return null;
  const model = value.trim();
  return GEMINI_MODEL_PATTERN.test(model) ? model : null;
}

export function geminiModelLabel(model: string): string {
  return GEMINI_MODELS.find((item) => item.id === model)?.label ?? model;
}

export function geminiFailureContext(error: { code?: string; message: string; upstreamStatus?: number }, model: string) {
  const name = geminiModelLabel(model);
  const retained = "Your inputs are preserved.";
  let message = `${name}: ${error.message}`;
  let recovery = `${retained} Choose a different Gemini model and retry.`;
  let canChangeModel = true;
  if (error.upstreamStatus === 401 || error.code === "MISSING_API_KEY" || error.code === "PROVIDER_ERROR") {
    message = "Gemini generation is not configured or could not authenticate this request.";
    recovery = `${retained} Changing models will not fix the server credentials. Contact the site owner.`;
    canChangeModel = false;
  } else if (error.upstreamStatus === 403) {
    message = `Gemini denied access to ${name}.`;
    recovery = `${retained} Try another model. If every model fails, contact the site owner to check project access.`;
  } else if (error.upstreamStatus === 404) {
    message = `${name} is not available for this Gemini API request.`;
    recovery = `${retained} Choose another model, or check the custom model ID and retry.`;
  } else if (error.upstreamStatus === 400) {
    message = `${name} rejected this generation request.`;
    recovery = `${retained} Choose a compatible text-generation model and retry.`;
  } else if (error.code === "AI_PROVIDER_RATE_LIMITED") {
    message = `${name} reached a Gemini rate or quota limit.`;
    recovery = `${retained} Wait before retrying, or try another model. Project-wide limits may affect multiple models.`;
  } else if (error.code === "PROVIDER_TIMEOUT") {
    message = `${name} did not respond within the time limit.`;
    recovery = `${retained} Choose another model and retry, or try fewer screenshots or a shorter brief.`;
  } else if (error.code === "INVALID_RESPONSE") {
    message = `${name} returned output that could not be validated.`;
  } else if (error.code === "AI_PROVIDER_UNAVAILABLE") {
    message = `${name} is temporarily unavailable for this request.`;
    recovery = `${retained} Choose another model and retry. If several models fail, wait and try again later.`;
  }
  return { message, recovery, model, canChangeModel };
}


export type GeminiThinkingConfig = { thinkingLevel: "low" | "high" } | { thinkingBudget: number };

/** Return thinking parameters supported by the selected Gemini model family. */
export function geminiThinkingConfig(model: string, extended: boolean): GeminiThinkingConfig | undefined {
  if (/^gemini-3(?:\.\d+)?-/i.test(model)) {
    return { thinkingLevel: extended ? "high" : "low" };
  }
  if (/^gemini-2\.5-flash(?:-lite)?(?:-|$)/i.test(model)) {
    return { thinkingBudget: extended ? -1 : 0 };
  }
  return undefined;
}
