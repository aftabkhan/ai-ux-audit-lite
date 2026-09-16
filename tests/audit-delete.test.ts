import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAudit } from "@/lib/audit/storage";

const context = {
  reviewerId: "11111111-1111-1111-1111-111111111111",
  sessionId: "22222222-2222-2222-2222-222222222222",
  productKey: "ai-ux-audit" as const,
  expiresAt: "2099-01-01T00:00:00.000Z",
};
const auditId = "33333333-3333-3333-3333-333333333333";
const jobId = "44444444-4444-4444-4444-444444444444";
const objectKey = `${context.reviewerId}/${auditId}/evidence.png`;

beforeEach(() => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  vi.unstubAllGlobals();
});

describe("audit deletion", () => {
  it("prepares the DB deletion, removes evidence through Storage, then completes the cleanup job", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        deletion_job_id: jobId,
        object_keys: [objectKey],
      }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteAudit(context, auditId)).resolves.toBe(true);

    expect(String(fetchMock.mock.calls[0][0])).toContain("/rpc/prepare_ai_ux_audit_deletion");
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({
      p_audit_id: auditId,
      p_reviewer_id: context.reviewerId,
    });
    expect(String(fetchMock.mock.calls[1][0])).toContain("/storage/v1/object/ai-ux-audit-evidence");
    const completedBody = JSON.parse(String((fetchMock.mock.calls[2][1] as RequestInit).body));
    expect(completedBody.status).toBe("completed");
    expect(completedBody.failure_code).toBeNull();
  });

  it("marks the durable cleanup job failed when object deletion fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        deletion_job_id: jobId,
        object_keys: [objectKey],
      }]), { status: 200 }))
      .mockResolvedValueOnce(new Response("storage unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteAudit(context, auditId)).rejects.toThrow("evidence cleanup failed");

    const failedBody = JSON.parse(String((fetchMock.mock.calls[2][1] as RequestInit).body));
    expect(failedBody).toMatchObject({
      status: "failed",
      failure_code: "STORAGE_DELETE_FAILED",
      completed_at: null,
    });
  });
});
