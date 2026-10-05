// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GeminiAuditProvider } from "@/lib/ai/gemini-provider";
import { POST } from "@/app/api/audit/route";
vi.mock("@/lib/product-lab/auth", () => ({ productLabProtectionEnabled: () => false, getProductLabIdentity: vi.fn() }));
vi.mock("@/lib/ai/provider-factory", () => ({ getAuditProvider: () => new GeminiAuditProvider() }));
let requestId = 0;
async function request(model?: string) {
  const body = new FormData();
  body.append("screenshot", new File([new Uint8Array([1, 2, 3])], "generic.png", { type: "image/png" }));
  if (model) body.set("model", model);
  const req = new Request("https://example.test/api/audit", { method: "POST", headers: { "x-forwarded-for": `test-${++requestId}` }, body });
  const parsed = await req.formData();
  vi.spyOn(req, "formData").mockResolvedValue(parsed);
  return req;
}
const payload = { overview: "A generic example interface with clear structure.", strengths: ["The title is prominent."], priorityActions: ["Clarify the primary action."], findings: [{ id: "primary-action", title: "Primary action needs emphasis", severity: "medium", category: "interaction-design", observation: "Primary and secondary actions have similar emphasis.", impact: "Users may take longer to identify the next step.", recommendation: "Increase the distinction of the primary action.", confidence: "high", evidenceRefs: [1] }] };
const success = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }));
beforeEach(() => { process.env.GEMINI_API_KEY = "test-key"; vi.useFakeTimers(); vi.spyOn(console, "error").mockImplementation(() => undefined); });
afterEach(() => { delete process.env.GEMINI_API_KEY; vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("returns a validated audit from Gemini", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(success())); const result = await POST(await request()); expect(result.status).toBe(200); expect((await result.json()).findings).toHaveLength(1); expect(result.headers.get("X-Audit-Provider")).toBe("gemini"); });
it("sends the selected Gemini model and gives model-specific recovery guidance", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("unavailable", { status: 404 }));
  vi.stubGlobal("fetch", fetchMock);
  const result = await POST(await request("gemini-3.7-flash"));
  const body = await result.json();
  expect(new URL(fetchMock.mock.calls[0][0]).pathname).toContain("/models/gemini-3.7-flash:");
  expect(body.model).toBe("gemini-3.7-flash");
  expect(body.canChangeModel).toBe(true);
  expect(body.message).toContain("not available");
  expect(body.recovery).toContain("Choose another model");
});
it("rejects malformed model IDs before calling Gemini", async () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  const result = await POST(await request("https://example.test"));
  expect(result.status).toBe(400);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("recovers from 503 twice through the HTTP boundary", async () => { const fetchMock = vi.fn().mockResolvedValueOnce(new Response("busy", { status: 503 })).mockResolvedValueOnce(new Response("busy", { status: 503 })).mockResolvedValue(success()); vi.stubGlobal("fetch", fetchMock); const pending = POST(await request()); await vi.runAllTimersAsync(); const result = await pending; expect(result.status).toBe(200); expect(fetchMock).toHaveBeenCalledTimes(3); });
it.each([429, 503, 401, 403])("preserves sanitized provider error %s", async (status) => { vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("private-provider-detail", { status }))); const pending = POST(await request()); await vi.runAllTimersAsync(); const result = await pending; expect(result.status).toBe(status === 429 ? 429 : 503); const body = await result.json(); expect(body.code).toBe(status === 429 ? "AI_PROVIDER_RATE_LIMITED" : "AI_PROVIDER_UNAVAILABLE"); expect(JSON.stringify(body)).not.toMatch(/private-provider-detail|test-key/); expect(result.headers.get("Cache-Control")).toBe("no-store"); });
it("maps a timeout to 504", async () => { vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("private", "TimeoutError"))); const result = await POST(await request()); expect(result.status).toBe(504); expect((await result.json()).code).toBe("PROVIDER_TIMEOUT"); });
it("maps malformed JSON to deterministic 502", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json"))); const result = await POST(await request()); expect(result.status).toBe(502); expect((await result.json()).code).toBe("INVALID_RESPONSE"); });
