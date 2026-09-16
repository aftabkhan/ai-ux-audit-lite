import type { AuditFinding } from "@/src/types/audit";

export function findingsReferenceSubmittedEvidence(findings: AuditFinding[], evidenceCount: number): boolean {
  if (!Number.isInteger(evidenceCount) || evidenceCount < 1 || evidenceCount > 8) return false;

  return findings.every((finding) => {
    const refs = finding.evidenceRefs;
    if (!refs || refs.length === 0) return false;
    return refs.every((ref) => Number.isInteger(ref) && ref >= 1 && ref <= evidenceCount);
  });
}
