import { auditContextSchema } from "@/lib/audit/schema";
import type { AuditContext } from "@/src/types/audit";

export function parseAuditContextFromFormData(formData: FormData): AuditContext | null {
  const parsed = auditContextSchema.safeParse({
    screenTitle: optionalText(formData.get("screenTitle")),
    scopeType: optionalText(formData.get("scopeType")),
    productContext: optionalText(formData.get("productContext")),
    targetUser: optionalText(formData.get("targetUser")),
    taskDescription: optionalText(formData.get("taskDescription")),
    businessObjective: optionalText(formData.get("businessObjective")),
    expectedOutcome: optionalText(formData.get("expectedOutcome")),
  });

  return parsed.success ? parsed.data : null;
}

function optionalText(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
