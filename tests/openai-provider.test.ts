import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIAuditProvider } from "@/lib/ai/openai-provider";

const input = {
  image: {
    bytes: new Uint8Array([1, 2, 3]),
    mimeType: "image/png" as const,
    fileName: "screen.png",
  },
  context: { screenTitle: "Checkout" },
};

const payload = {
  overview: "The checkout is understandable with a few visible issues.",
  strengths: ["Clear page title."],
  priorityActions: ["Clarify the primary action."],
  findings: [
    {
      id: "primary-action",
      title: "Primary action needs stronger emphasis",
      severity: "medium",
      category: "clarity-of-actions",
      observation: "Primary and secondary actions have similar emphasis.",
      impact: "Users may hesitate before continuing.",
      recommendation: "Increase visual distinction of the primary action.",
      confidence: "high",
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_AUDIT_MODEL;
});

describe("OpenAIAuditProvider", () => {
  it("returns a validated audit from a server-side response", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_text: JSON.stringify(payload) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new OpenAIAuditProvider().review(input);
    expect(result.findings).toHaveLength(1);

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(request.headers).toMatchObject({ Authorization: "Bearer test-key" });
    const body = JSON.parse(String(request.body));
    expect(body.store).toBe(false);
    expect(body.input[0].content[1].image_url).toContain("data:image/png;base64,AQID");
  });

  it("maps provider timeout to a recoverable 504 error", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));

    await expect(new OpenAIAuditProvider().review(input)).rejects.toMatchObject({
      code: "PROVIDER_TIMEOUT",
      status: 504,
    });
  });

  it("does not log upstream response bodies on provider failure", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("sensitive-upstream-detail", { status: 500 })));

    await expect(new OpenAIAuditProvider().review(input)).rejects.toMatchObject({ code: "PROVIDER_ERROR" });
    expect(errorSpy).toHaveBeenCalledWith("OpenAI audit request failed", { status: 500 });
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("sensitive-upstream-detail");
  });
});
