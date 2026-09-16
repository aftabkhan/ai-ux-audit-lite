import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compareAuditVersions, createAuditVersion, type PersistedAuditVersion } from "@/lib/audit/versioning";

const context = {
  reviewerId: "11111111-1111-1111-1111-111111111111",
  sessionId: "22222222-2222-2222-2222-222222222222",
  productKey: "ai-ux-audit" as const,
  expiresAt: "2099-01-01T00:00:00.000Z",
};
const auditId = "33333333-3333-3333-3333-333333333333";
const findingId = "44444444-4444-4444-4444-444444444444";
const runId = "55555555-5555-5555-5555-555555555555";
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

describe("audit versioning", () => {
  it("creates a version through one reviewer-scoped atomic RPC and validates its snapshot", async () => {
    const snapshot = {
      audit: {
        id: auditId,
        reviewerId: context.reviewerId,
        title: "Checkout audit",
        scopeType: "user-flow",
        status: "in-review",
        createdAt: "2026-09-16T00:00:00.000Z",
        updatedAt: "2026-09-16T01:00:00.000Z",
      },
      evidence: [],
      runId,
      findings: [{
        findingId,
        sourceFindingId: "primary-action",
        dimension: "interaction-design",
        aiSeverity: "medium",
        reviewStatus: "accepted",
        severityOverride: "high",
        reviewerNote: "Confirmed",
        approvedRecommendation: "Strengthen the primary action",
      }],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{
        id: versionId,
        audit_id: auditId,
        reviewer_id: context.reviewerId,
        version_number: 3,
        label: "Review complete",
        snapshot,
        created_at: "2026-09-16T02:00:00.000Z",
      }]), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const version = await createAuditVersion(context, auditId, "Review complete");
    expect(version.versionNumber).toBe(3);
    expect(version.snapshot.runId).toBe(runId);
    expect(version.snapshot.findings).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/rpc/create_ai_ux_audit_version");
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      p_audit_id: auditId,
      p_reviewer_id: context.reviewerId,
      p_label: "Review complete",
    });
  });

  it("rejects malformed persisted snapshots instead of trusting storage output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{
        id: versionId,
        audit_id: auditId,
        reviewer_id: context.reviewerId,
        version_number: 1,
        label: "Broken",
        snapshot: { findings: "not-an-array" },
        created_at: "2026-09-16T02:00:00.000Z",
      }]), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createAuditVersion(context, auditId, "Broken")).rejects.toThrow();
  });

  it("compares human decisions without mutating either snapshot", () => {
    const baseSnapshot = {
      audit: {
        id: auditId,
        reviewerId: context.reviewerId,
        title: "Audit",
        scopeType: "single-screen" as const,
        status: "in-review" as const,
        createdAt: "2026-09-16T00:00:00.000Z",
        updatedAt: "2026-09-16T00:00:00.000Z",
      },
      evidence: [],
      findings: [{
        findingId,
        sourceFindingId: "finding-1",
        dimension: "usability" as const,
        aiSeverity: "medium" as const,
        reviewStatus: "unreviewed" as const,
      }],
    };
    const from: PersistedAuditVersion = {
      id: "v1",
      auditId,
      reviewerId: context.reviewerId,
      versionNumber: 1,
      label: "Initial",
      snapshot: structuredClone(baseSnapshot),
      createdAt: "2026-09-16T00:00:00.000Z",
    };
    const to: PersistedAuditVersion = {
      ...from,
      id: "v2",
      versionNumber: 2,
      label: "Reviewed",
      snapshot: {
        ...structuredClone(baseSnapshot),
        findings: [{
          ...baseSnapshot.findings[0],
          reviewStatus: "accepted",
          severityOverride: "high",
          reviewerNote: "Confirmed",
        }],
      },
    };

    const comparison = compareAuditVersions(from, to);
    expect(comparison).toMatchObject({
      reviewStatusChanges: 1,
      severityChanges: 1,
      reviewerNoteChanges: 1,
      addedFindings: 0,
      removedFindings: 0,
    });
    expect(from.snapshot.findings[0].reviewStatus).toBe("unreviewed");
  });
});
