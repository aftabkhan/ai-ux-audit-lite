import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiAuditProvider } from "@/lib/ai/gemini-provider";

const input = {
  images: [
    {
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: "image/png" as const,
      fileName: "screen-1.png",
      sequenceIndex: 0,
    },
    {
      bytes: new Uint8Array([4, 5, 6]),
      mimeType: "image/webp" as const,
      fileName: "screen-2.webp",
      sequenceIndex: 1,
    },
  ],
  context: { screenTitle: "Checkout" },
};

const payload = {
  overview: "The checkout has a clear structure, with a few visible opportunities to improve action clarity.",
  strengths: ["The page title is visually prominent."],
  priorityActions: ["Clarify the primary checkout action."],
  findings: [
    {
      id: "primary-action-clarity",
      title: "Primary action needs stronger emphasis",
      severity: "medium",
      category: "clarity-of-actions",
      observation: "The visible primary and secondary actions have similar emphasis.",
      impact: "Users may need longer to identify the next step.",
      recommendation: "Increase the visual distinction of the primary checkout action.",
      confidence: "high",
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_AUDIT_MODEL;
});

describe("GeminiAuditProvider", () => {
  it("sends ordered screenshot evidence server-side and returns a validated audit", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GeminiAuditProvider().review(input);

    expect(result.summary.overview).toContain("checkout");
    expect(result.findings).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("gemini-3.6-flash:generateContent");
    expect(request.headers).toMatchObject({ "x-goog-api-key": "test-key" });
    const body = JSON.parse(String(request.body));
    expect(body.contents[0].parts[1].text).toContain("Evidence 1 of 2");
    expect(body.contents[0].parts[2].inlineData).toEqual({ mimeType: "image/png", data: "AQID" });
    expect(body.contents[0].parts[3].text).toContain("Evidence 2 of 2");
    expect(body.contents[0].parts[4].inlineData).toEqual({ mimeType: "image/webp", data: "BAUG" });
    expect(body.generationConfig.responseMimeType).toBe("application/json");
  });

  it("fails safely when the server credential is missing", async () => {
    await expect(new GeminiAuditProvider().review(input)).rejects.toMatchObject({
      code: "PROVIDER_ERROR",
      status: 503,
    });
  });

  it("maps provider timeout to a recoverable 504 error", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));

    await expect(new GeminiAuditProvider().review(input)).rejects.toMatchObject({
      code: "PROVIDER_TIMEOUT",
      status: 504,
      recovery: expect.stringContaining("inputs are still available"),
    });
  });

  it("does not log upstream response bodies on provider failure", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("sensitive-upstream-detail", { status: 429 })));

    await expect(new GeminiAuditProvider().review(input)).rejects.toMatchObject({ code: "PROVIDER_ERROR" });
    expect(errorSpy).toHaveBeenCalledWith("Gemini audit request failed", { status: 429 });
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("sensitive-upstream-detail");
  });
});
