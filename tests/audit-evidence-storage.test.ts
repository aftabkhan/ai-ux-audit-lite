import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { removeEvidenceObjects, uploadAuditEvidence } from "@/lib/audit/evidence-storage";

const context = {
  reviewerId: "11111111-1111-1111-1111-111111111111",
  sessionId: "22222222-2222-2222-2222-222222222222",
  productKey: "ai-ux-audit" as const,
  expiresAt: "2099-01-01T00:00:00.000Z",
};
const auditId = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
  vi.spyOn(crypto, "randomUUID").mockReturnValue("44444444-4444-4444-8444-444444444444");
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("audit evidence storage", () => {
  it("checks ownership, uploads to a generated private key, then writes metadata", async () => {
    const metadataRow = {
      id: "55555555-5555-5555-5555-555555555555",
      audit_id: auditId,
      reviewer_id: context.reviewerId,
      evidence_type: "screenshot",
      label: "Checkout step 1",
      sequence_index: 0,
      object_key: `${context.reviewerId}/${auditId}/44444444-4444-4444-8444-444444444444.png`,
      mime_type: "image/png",
      byte_size: 3,
      created_at: "2026-09-16T00:00:00.000Z",
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: auditId }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ Key: metadataRow.object_key }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([metadataRow]), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadAuditEvidence(context, auditId, {
      label: "Checkout step 1",
      sequenceIndex: 0,
      mimeType: "image/png",
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(result.objectKey).toBe(metadataRow.object_key);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain(`reviewer_id=eq.${context.reviewerId}`);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/storage/v1/object/ai-ux-audit-evidence/");
    expect(String(fetchMock.mock.calls[1][0])).not.toContain("Checkout step 1");
    const metadataBody = JSON.parse(String((fetchMock.mock.calls[2][1] as RequestInit).body));
    expect(metadataBody.reviewer_id).toBe(context.reviewerId);
    expect(metadataBody.audit_id).toBe(auditId);
  });

  it("fails before upload when the audit is not owned by the reviewer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadAuditEvidence(context, auditId, {
      label: "Checkout",
      sequenceIndex: 0,
      mimeType: "image/png",
      bytes: new Uint8Array([1]),
    })).rejects.toThrow("access denied");

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("deletes evidence through the Storage API using explicit object keys", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await removeEvidenceObjects([`${context.reviewerId}/${auditId}/one.png`]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.supabase.co/storage/v1/object/ai-ux-audit-evidence");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toEqual({
      prefixes: [`${context.reviewerId}/${auditId}/one.png`],
    });
  });
});
