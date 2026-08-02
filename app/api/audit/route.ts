import { NextResponse } from "next/server";
import { getAuditProvider } from "@/lib/ai/provider-factory";
import { AuditServiceError, toAuditError } from "@/lib/audit/errors";
import { auditContextSchema, auditResultSchema } from "@/lib/audit/schema";
import { checkAuditRateLimit } from "@/lib/security/rate-limit";
import { ACCEPTED_SCREENSHOT_TYPES, MAX_SCREENSHOT_BYTES } from "@/lib/validation/file";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimit = checkAuditRateLimit(identifier);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          message: "Too many audits were requested in a short period.",
          recovery: `Wait about ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s) before trying again.`,
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const formData = await request.formData();
    const screenshot = formData.get("screenshot");

    if (!(screenshot instanceof File)) {
      throw new AuditServiceError("INVALID_FILE", "Add a screenshot before starting the audit.", 400);
    }

    if (!ACCEPTED_SCREENSHOT_TYPES.includes(screenshot.type as (typeof ACCEPTED_SCREENSHOT_TYPES)[number])) {
      throw new AuditServiceError("INVALID_FILE", "Choose a PNG, JPEG, or WebP screenshot.", 400);
    }

    if (screenshot.size > MAX_SCREENSHOT_BYTES) {
      throw new AuditServiceError("FILE_TOO_LARGE", "The screenshot must be 5 MB or smaller.", 413);
    }

    const context = auditContextSchema.parse({
      screenTitle: optionalText(formData.get("screenTitle")),
      productContext: optionalText(formData.get("productContext")),
      targetUser: optionalText(formData.get("targetUser")),
    });

    const provider = getAuditProvider();
    const result = await provider.review({
      image: {
        bytes: new Uint8Array(await screenshot.arrayBuffer()),
        mimeType: screenshot.type as "image/png" | "image/jpeg" | "image/webp",
        fileName: screenshot.name,
      },
      context,
    });

    const validated = auditResultSchema.parse(result);
    return NextResponse.json(validated, {
      headers: {
        "Cache-Control": "no-store",
        "X-Audit-Provider": provider.name,
      },
    });
  } catch (error) {
    const mapped = toAuditError(error);
    return NextResponse.json(mapped.body, {
      status: mapped.status,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

function optionalText(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local-anonymous";
}
