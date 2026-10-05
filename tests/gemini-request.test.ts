// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestGeminiJson } from "@/lib/ai/gemini-request";

const options = { apiKey: "private-key", model: "gemini-3.6-flash", operation: "audit" as const, body: { private: "submitted-content" }, timeoutMs: 60_000 };
const success = () => new Response(JSON.stringify({ candidates: [] }), { status: 200 });
const failure = (status: number, headers?: HeadersInit) => new Response(JSON.stringify({ error: { status: status === 429 ? "RESOURCE_EXHAUSTED" : "UNAVAILABLE", message: "sensitive-upstream-detail" } }), { status, headers });

beforeEach(() => { vi.useFakeTimers(); vi.spyOn(console, "error").mockImplementation(() => undefined); vi.spyOn(Math, "random").mockReturnValue(0); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Gemini transport", () => {
  it("returns successful JSON without retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success()); vi.stubGlobal("fetch", fetchMock);
    await expect(requestGeminiJson(options)).resolves.toEqual({ candidates: [] });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("recovers from 503 twice, with exponential backoff", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(failure(503)).mockResolvedValueOnce(failure(503)).mockResolvedValue(success());
    vi.stubGlobal("fetch", fetchMock);
    const result = requestGeminiJson(options);
    await vi.advanceTimersByTimeAsync(999); expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1999); expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({ candidates: [] }); expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([429, 500, 502, 503, 504])("bounds retries for persistent %s", async (status) => {
    const fetchMock = vi.fn().mockImplementation(async () => failure(status)); vi.stubGlobal("fetch", fetchMock);
    const assertion = expect(requestGeminiJson(options)).rejects.toMatchObject({ status: status === 429 ? 429 : 503, code: status === 429 ? "AI_PROVIDER_RATE_LIMITED" : "AI_PROVIDER_UNAVAILABLE" });
    await vi.advanceTimersByTimeAsync(7_000); await assertion; expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(/private-key|submitted-content|sensitive-upstream-detail/);
    expect(console.error).toHaveBeenCalledWith("Gemini request failed", expect.objectContaining({ operation: "audit", upstreamStatus: status, attempt: 4 }));
  });

  it.each([401, 403, 400, 404])("does not retry configuration or request error %s", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(failure(status)); vi.stubGlobal("fetch", fetchMock);
    await expect(requestGeminiJson(options)).rejects.toMatchObject({ status: 503, code: "AI_PROVIDER_UNAVAILABLE" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each(["3", "http-date"])("respects Retry-After %s", async (value) => {
    const retryAfter = value === "http-date" ? new Date(Date.now() + 3000).toUTCString() : value;
    const delay = value === "http-date" ? Date.parse(retryAfter) - Date.now() : 3000;
    const fetchMock = vi.fn().mockResolvedValueOnce(failure(429, { "Retry-After": retryAfter })).mockResolvedValue(success()); vi.stubGlobal("fetch", fetchMock);
    const result = requestGeminiJson(options);
    await vi.advanceTimersByTimeAsync(delay - 1); expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); await expect(result).resolves.toEqual({ candidates: [] });
  });

  it("does not ignore Retry-After beyond the total deadline", async () => {
    const fetchMock = vi.fn().mockResolvedValue(failure(429, { "Retry-After": "120" })); vi.stubGlobal("fetch", fetchMock);
    await expect(requestGeminiJson(options)).rejects.toMatchObject({ status: 429 }); expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("applies jitter to backoff", async () => {
    vi.mocked(Math.random).mockReturnValue(0.5);
    const fetchMock = vi.fn().mockResolvedValueOnce(failure(503)).mockResolvedValue(success()); vi.stubGlobal("fetch", fetchMock);
    const result = requestGeminiJson(options);
    await vi.advanceTimersByTimeAsync(1124); expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); await result; expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps timeout without retry or leaking the exception", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new DOMException("private-key", "TimeoutError")); vi.stubGlobal("fetch", fetchMock);
    await expect(requestGeminiJson(options)).rejects.toMatchObject({ status: 504, code: "PROVIDER_TIMEOUT" });
    expect(fetchMock).toHaveBeenCalledOnce(); expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private-key");
  });

  it("maps a network failure to sanitized unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private-key")));
    await expect(requestGeminiJson(options)).rejects.toMatchObject({ status: 503, code: "AI_PROVIDER_UNAVAILABLE" });
  });

  it("rejects malformed envelope JSON deterministically without retries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not json")); vi.stubGlobal("fetch", fetchMock);
    await expect(requestGeminiJson(options)).rejects.toMatchObject({ status: 502, code: "INVALID_RESPONSE" }); expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("bounds response-body reading with the same deadline", async () => {
    const controller = new AbortController(); vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => { controller.abort(); throw new Error("body timeout"); } }));
    await expect(requestGeminiJson(options)).rejects.toMatchObject({ status: 504, code: "PROVIDER_TIMEOUT" });
  });

  it("stops backoff when the total deadline aborts", async () => {
    const controller = new AbortController(); vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    const fetchMock = vi.fn().mockImplementation(async () => failure(503)); vi.stubGlobal("fetch", fetchMock);
    const assertion = expect(requestGeminiJson(options)).rejects.toMatchObject({ status: 504 });
    await vi.advanceTimersByTimeAsync(500); controller.abort(); await assertion;
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("never logs an unrecognized provider code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { status: "private-key" } }), { status: 403 })));
    await expect(requestGeminiJson(options)).rejects.toMatchObject({ status: 503 });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private-key");
  });
});
