import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compareAuditVersions, createAuditVersion, type PersistedAuditVersion } from "@/lib/audit/versioning";

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
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  vi.unstubAllGlobals();
});

describe("audit versioning", () => {
  it("builds the snapshot from reviewer-owned server state instead of accepting a client snapshot", async () => {
    const auditRow = {
      id: auditId,
      reviewer_id: context.reviewerId,
      title: "Checkout audit",
      scope_type: "user-flow",
      status: "in-review",
      target_user: null,
      product_context: null,
      task_description: null,
      business_objective: null,
      expected_outcome: null,
      archived_at: null,
      finalized_at: null,
      created_at: "2026-09-16T00:00:00.000Z",
      updated_at: "2026-09-16T01:00:00.000Z",
    };
    const findingId = "44444444-4444-4444-4444-444444444444";
    const calls = [
      new Response(JSON.stringify([auditRow]), { status: 200 }),
      new Response(JSON.stringify([]), { status: 200 }),
      new Response(JSON.stringify([{ id: "run-1" }]), { status: 200 }),
      new Response(JSON.stringify([{
        id: findingId,
        source_finding_id: "primary-action",
        dimension: "interaction-design",
        ai_severity: "medium",
      }]), { status: 200 }),
      new Response(JSON.stringify([{
        finding_id: findingId,
        status: "accepted",
        severity_override: "high",
        reviewer_note: "Confirmed",
        approved_recommendation: "Strengthen the primary action",
      }]), { status: 200 }),
      new Response(JSON.stringify([{ version_number: 2 }]), { status: 200 }),
      new Response(JSON.stringify([{
        id: "version-3",
        audit_id: auditId,
        reviewer_id: context.reviewerId,
        version_number: 3,
        label: "Review complete",
        snapshot: {},
        created_at: "2026-09-16T02:00:00.000Z",
      }]), { status: 201 }),
    ];
    const fetchMock = vi.fn();
    calls.forEach((response) => fetchMock.mockResolvedValueOnce(response));
    vi.stubGlobal("fetch", fetchMock);

    const version = await createAuditVersion(context, auditId, "Review complete");
    expect(version.versionNumber).toBe(3);

    const [, insert] = fetchMock.mock.calls[6] as [string, RequestInit];
    const body = JSON.parse(String(insert.body));
    expect(body.reviewer_id).toBe(context.reviewerId);
    expect(body.snapshot.audit.id).toBe(auditId);
    expect(body.snapshot.findings[0]).toMatchObject({
      findingId,
      reviewStatus: "accepted",
      aiSeverity: "medium",
      severityOverride: "high",
    });
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
        findingId: "finding-1",
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
