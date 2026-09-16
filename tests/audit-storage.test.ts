import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { archiveAudit, createAudit, getAudit, listAudits } from "@/lib/audit/storage";

const context = {
  reviewerId: "11111111-1111-1111-1111-111111111111",
  sessionId: "22222222-2222-2222-2222-222222222222",
  productKey: "ai-ux-audit" as const,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

const row = {
  id: "33333333-3333-3333-3333-333333333333",
  reviewer_id: context.reviewerId,
  title: "Checkout audit",
  scope_type: "user-flow",
  status: "draft",
  target_user: null,
  product_context: null,
  task_description: null,
  business_objective: null,
  expected_outcome: null,
  archived_at: null,
  finalized_at: null,
  created_at: "2026-09-16T00:00:00.000Z",
  updated_at: "2026-09-16T00:00:00.000Z",
};

describe("audit storage", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.unstubAllGlobals();
  });

  it("derives reviewer ownership from the trusted context on create", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([row]), { status: 201, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const audit = await createAudit(context, { title: "Checkout audit", scopeType: "user-flow" });
    expect(audit.reviewerId).toBe(context.reviewerId);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.reviewer_id).toBe(context.reviewerId);
    expect(body).not.toHaveProperty("session_id");
  });

  it("scopes reads by reviewer id and audit id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([row]), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getAudit(context, row.id);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("reviewer_id=eq.");
    expect(url).toContain("id=eq.");
  });

  it("scopes listing to the reviewer and excludes archived records by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([row]), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listAudits(context);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("reviewer_id=eq.");
    expect(url).toContain("status=neq.archived");
  });

  it("rejects an expired or wrong-product context before storage access", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listAudits({ ...context, expiresAt: "2020-01-01T00:00:00.000Z" }),
    ).rejects.toThrow("expired");

    await expect(
      listAudits({ ...context, productKey: "design-system-studio" as never }),
    ).rejects.toThrow("Audit product access is required");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("archives only a reviewer-owned non-archived audit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ ...row, status: "archived", archived_at: "2026-09-16T01:00:00.000Z" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await archiveAudit(context, row.id);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("reviewer_id=eq.");
    expect(url).toContain("status=neq.archived");
  });
});
