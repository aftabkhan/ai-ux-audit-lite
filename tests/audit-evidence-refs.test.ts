import { describe, expect, it } from "vitest";
import { findingsReferenceSubmittedEvidence } from "@/lib/audit/evidence-refs";
import type { AuditFinding } from "@/src/types/audit";

const finding: AuditFinding = {
  id: "finding-1",
  title: "Primary action needs stronger emphasis",
  severity: "medium",
  category: "clarity-of-actions",
  observation: "The primary and secondary actions have similar visual weight.",
  impact: "Users may hesitate before continuing.",
  recommendation: "Increase the visual distinction of the primary action.",
  confidence: "high",
  evidenceRefs: [1],
};

describe("evidence reference validation", () => {
  it("accepts findings grounded in submitted evidence", () => {
    expect(findingsReferenceSubmittedEvidence([finding, { ...finding, id: "finding-2", evidenceRefs: [1, 2] }], 2)).toBe(true);
  });

  it("rejects missing, empty, or out-of-range evidence references", () => {
    expect(findingsReferenceSubmittedEvidence([{ ...finding, evidenceRefs: undefined }], 2)).toBe(false);
    expect(findingsReferenceSubmittedEvidence([{ ...finding, evidenceRefs: [] }], 2)).toBe(false);
    expect(findingsReferenceSubmittedEvidence([{ ...finding, evidenceRefs: [3] }], 2)).toBe(false);
  });
});
