import type { AuditCategory } from "@/src/types/audit";
import type { AuditDimension } from "@/src/types/audit-lifecycle";

const legacyDimensionMap: Partial<Record<AuditCategory, AuditDimension>> = {
  "navigation-orientation": "navigation",
  "clarity-of-actions": "interaction-design",
  readability: "content-clarity",
  "accessibility-basics": "accessibility",
};

export function toCanonicalAuditDimension(category: AuditCategory): AuditDimension {
  return (legacyDimensionMap[category] ?? category) as AuditDimension;
}
