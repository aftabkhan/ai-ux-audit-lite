/** Server-only Gemini transport. One deadline includes requests, bodies and backoff. */
export type GeminiErrorCode =
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_PROVIDER_RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "INVALID_RESPONSE";

export class GeminiRequestError extends Error {
  constructor(public readonly code: GeminiErrorCode, message: string, public readonly status: number) {
    super(message);
    this.name = "GeminiRequestError";
  }
}

const retryableStatuses = new Set([429, 500, 502, 503, 504]);
const providerCodes = new Set([
  "INVALID_ARGUMENT", "FAILED_PRECONDITION", "PERMISSION_DENIED", "UNAUTHENTICATED",
  "NOT_FOUND", "RESOURCE_EXHAUSTED", "INTERNAL", "UNAVAILABLE", "DEADLINE_EXCEEDED",
]);

function retryDelay(value: string | null, attempt: number): number {
  const backoff = 1_000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
  if (!value) return backoff;
  const seconds = Number(value);
  const delay = value.trim() && Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(value) - Date.now();
  return Number.isFinite(delay) ? Math.max(backoff, delay, 0) : backoff;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve(); }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function timeout(): GeminiRequestError {
  return new GeminiRequestError("PROVIDER_TIMEOUT", "The AI provider took too long to respond. Please try again.", 504);
}

function unavailable(status: number): GeminiRequestError {
  return status === 429
    ? new GeminiRequestError("AI_PROVIDER_RATE_LIMITED", "The AI provider is temporarily rate limited. Please try again later.", 429)
    : new GeminiRequestError("AI_PROVIDER_UNAVAILABLE", "AI generation is temporarily unavailable. Please try again later.", 503);
}

export async function requestGeminiJson(options: {
  apiKey: string;
  model: string;
  operation: "audit" | "token-generation";
  body: unknown;
  timeoutMs: number;
}): Promise<unknown> {
  const signal = AbortSignal.timeout(options.timeoutMs);
  const deadline = Date.now() + options.timeoutMs;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent`;
  const body = JSON.stringify(options.body);
  const metadata = { provider: "gemini", operation: options.operation, model: options.model };

  for (let attempt = 1; attempt <= 4; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": options.apiKey },
        body,
        signal,
      });
    } catch (error) {
      const timedOut = signal.aborted || (error !== null && typeof error === "object" && "name" in error &&
        ["TimeoutError", "AbortError"].includes(String(error.name)));
      console.error("Gemini request failed", { ...metadata, attempt, category: timedOut ? "timeout" : "network" });
      if (timedOut) throw timeout();
      throw unavailable(503);
    }

    if (response.ok) {
      try {
        return await response.json();
      } catch {
        if (signal.aborted) throw timeout();
        console.error("Gemini request failed", { ...metadata, attempt, category: "invalid-json" });
        throw new GeminiRequestError("INVALID_RESPONSE", "The AI provider returned an unreadable response. Please try again.", 502);
      }
    }

    let providerErrorCode: string | undefined;
    try {
      const data: unknown = await response.json();
      if (data && typeof data === "object" && "error" in data) {
        const error = data.error;
        if (error && typeof error === "object" && "status" in error && typeof error.status === "string" && providerCodes.has(error.status)) {
          providerErrorCode = error.status;
        }
      }
    } catch {
      if (signal.aborted) throw timeout();
    }
    console.error("Gemini request failed", { ...metadata, upstreamStatus: response.status, attempt, providerErrorCode });
    const failure = unavailable(response.status);
    if (!retryableStatuses.has(response.status) || attempt === 4) throw failure;
    const delay = retryDelay(response.headers.get("Retry-After"), attempt);
    // Do not retry earlier than Retry-After or exceed the server's request budget.
    if (delay >= deadline - Date.now()) throw failure;
    try {
      await wait(delay, signal);
    } catch {
      throw timeout();
    }
  }
  throw unavailable(503);
}
