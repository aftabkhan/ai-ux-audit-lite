import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { persistAuditRun } from "@/lib/audit/run-storage";
import type { AuditResult } from "@/src/types/audit";

const context = {
  reviewerId: "11111111-1111-1111-1111-111111111111",
  sessionId: "22222222-2222-2222-2222-222222222222",
  productKey: "ai-ux-audit" as const,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

const auditId = "33333333-3333-3333-3333-333333333333";
const result: AuditResult = {
  version: "1.0",
  generatedAt: "2026-09-16T12:00:00.000Z",
  context: { screenTitle: "Checkout", scopeType: "user-flow" },
  summary: {
    overview: "Checkout flow review.",
    strengths: ["Clear structure"],
    priorityActions: ["Clarify primary action"],
  },
  findings: [
    {
      id: "primary-action",
      title: "Primary action needs emphasis",
      severity: "medium",
      category: "clarity-of-actions",
      observation: "The action hierarchy is ambiguous.",
      impact: "Users may hesitate.",
      recommendation: "Increase primary-action prominence.",
      confidence: "high",
      evidenceRefs: [1, 2],
    },
  ],
  disclaimer: "AI-assisted first-pass review only.",
};

describe("audit run persistence", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.unstubAllGlobals();
  });

  it("maps ordered reviewer-owned evidence and normalizes legacy dimensions before the atomic RPC", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", sequence_index: 0 },
            { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", sequence_index: 1 },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify("cccccccc-cccc-cccc-cccc-cccccccccccc"), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const runId = await persistAuditRun(context, {
      auditId,
      provider: "gemini",
      model: "gemini-test",
      result,
    });

    expect(runId).toBe("cccccccc-cccc-cccc-cccc-cccccccccccc");
    const [evidenceUrl] = fetchMock.mock.calls[0] as [string];
    expect(evidenceUrl).toContain(`reviewer_id=eq.${context.reviewerId}`);
    expect(evidenceUrl).toContain(`audit_id=eq.${auditId}`);

    const [rpcUrl, rpcInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(rpcUrl).toContain("/rpc/persist_ai_ux_audit_run");
    const body = JSON.parse(String(rpcInit.body));
    expect(body.p_reviewer_id).toBe(context.reviewerId);
    expect(body.p_findings[0].dimension).toBe("interaction-design");
    expect(body.p_findings[0].evidenceIds).toEqual([
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    ]);
  });

  it("rejects unavailable evidence before the RPC is called", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", sequence_index: 0 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      persistAuditRun(context, { auditId, provider: "gemini", result }),
    ).rejects.toThrow("unavailable evidence 2");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects expired Product Lab context before storage access", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      persistAuditRun({ ...context, expiresAt: "2020-01-01T00:00:00.000Z" }, { auditId, provider: "gemini", result }),
    ).rejects.toThrow("expired");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
