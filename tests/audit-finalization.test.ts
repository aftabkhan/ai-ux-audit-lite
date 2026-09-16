import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { finalizeAudit } from "@/lib/audit/versioning";

const context = {
  reviewerId: "11111111-1111-1111-1111-111111111111",
  sessionId: "22222222-2222-2222-2222-222222222222",
  productKey: "ai-ux-audit" as const,
  expiresAt: "2099-01-01T00:00:00.000Z",
};
const auditId = "33333333-3333-3333-3333-333333333333";
const versionId = "66666666-6666-6666-6666-666666666666";

beforeEach(() => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  vi.unstubAllGlobals();
});

describe("audit finalization", () => {
  it("uses the reviewer-scoped finalization RPC and requires a finalized immutable snapshot", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{
        id: versionId,
        audit_id: auditId,
        reviewer_id: context.reviewerId,
        version_number: 2,
        label: "Final reviewed audit",
        snapshot: {
          audit: {
            id: auditId,
            reviewerId: context.reviewerId,
            title: "Checkout audit",
            scopeType: "user-flow",
            status: "finalized",
            finalizedAt: "2026-09-16T12:00:00.000Z",
            createdAt: "2026-09-16T10:00:00.000Z",
            updatedAt: "2026-09-16T12:00:00.000Z",
          },
          evidence: [],
          findings: [],
        },
        created_at: "2026-09-16T12:00:00.000Z",
      }]), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const version = await finalizeAudit(context, auditId);
    expect(version.snapshot.audit.status).toBe("finalized");
    expect(version.snapshot.audit.finalizedAt).toBeDefined();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/rpc/finalize_ai_ux_audit");
    expect(JSON.parse(String(init.body))).toEqual({
      p_audit_id: auditId,
      p_reviewer_id: context.reviewerId,
      p_version_label: "Final reviewed audit",
    });
  });

  it("rejects a storage response that does not represent a finalized audit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{
        id: versionId,
        audit_id: auditId,
        reviewer_id: context.reviewerId,
        version_number: 2,
        label: "Final reviewed audit",
        snapshot: {
          audit: {
            id: auditId,
            reviewerId: context.reviewerId,
            title: "Checkout audit",
            scopeType: "user-flow",
            status: "in-review",
            createdAt: "2026-09-16T10:00:00.000Z",
            updatedAt: "2026-09-16T12:00:00.000Z",
          },
          evidence: [],
          findings: [],
        },
        created_at: "2026-09-16T12:00:00.000Z",
      }]), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(finalizeAudit(context, auditId)).rejects.toThrow("non-finalized snapshot");
  });
});
