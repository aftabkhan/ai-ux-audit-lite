import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiAuditProvider } from "@/lib/ai/gemini-provider";

const input = {
  image: {
    bytes: new Uint8Array([1, 2, 3]),
    mimeType: "image/png" as const,
    fileName: "screen.png",
  },
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
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_AUDIT_MODEL;
});

describe("GeminiAuditProvider", () => {
  it("sends the screenshot server-side and returns a validated audit", async () => {
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
    expect(body.contents[0].parts[1].inlineData).toEqual({ mimeType: "image/png", data: "AQID" });
    expect(body.generationConfig.responseMimeType).toBe("application/json");
  });

  it("fails safely when the server credential is missing", async () => {
    await expect(new GeminiAuditProvider().review(input)).rejects.toMatchObject({
      code: "PROVIDER_ERROR",
      status: 503,
    });
  });
});
