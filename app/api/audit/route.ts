import { NextResponse } from "next/server";
import { getAuditProvider } from "@/lib/ai/provider-factory";
import { AuditServiceError, toAuditError } from "@/lib/audit/errors";
import { findingsReferenceSubmittedEvidence } from "@/lib/audit/evidence-refs";
import { parseAuditContextFromFormData } from "@/lib/audit/request-context";
import { auditResultSchema } from "@/lib/audit/schema";
import { getProductLabIdentity, productLabProtectionEnabled } from "@/lib/product-lab/auth";
import { checkAuditRateLimit } from "@/lib/security/rate-limit";
import { ACCEPTED_SCREENSHOT_TYPES, MAX_SCREENSHOT_BYTES } from "@/lib/validation/file";

export const runtime = "nodejs";

const MAX_SCREENSHOTS_PER_AUDIT = 8;
const MAX_COMBINED_SCREENSHOT_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (productLabProtectionEnabled()) {
      const identity = await getProductLabIdentity();
      if (!identity) {
        return NextResponse.json(
          {
            code: "ACCESS_REQUIRED",
            message: "A valid Product Lab invitation is required.",
            recovery: "Return to the private Product Lab and open AI UX Audit from your assigned products.",
          },
          {
            status: 401,
            headers: { "Cache-Control": "no-store" },
          },
        );
      }
    }

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
    const screenshots = formData.getAll("screenshot").filter((value): value is File => value instanceof File);

    if (screenshots.length === 0) {
      throw new AuditServiceError(
        "INVALID_REQUEST",
        "At least one screenshot is required.",
        400,
        "Choose one or more PNG, JPEG, or WebP screenshots and submit the audit again.",
      );
    }

    if (screenshots.length > MAX_SCREENSHOTS_PER_AUDIT) {
      throw new AuditServiceError(
        "INVALID_REQUEST",
        `A maximum of ${MAX_SCREENSHOTS_PER_AUDIT} screenshots can be analyzed in one audit.`,
        400,
        "Remove extra screenshots and submit the audit again.",
      );
    }

    let combinedBytes = 0;
    for (const screenshot of screenshots) {
      if (!ACCEPTED_SCREENSHOT_TYPES.includes(screenshot.type as (typeof ACCEPTED_SCREENSHOT_TYPES)[number])) {
        throw new AuditServiceError(
          "INVALID_FILE",
          "One or more screenshot formats are not supported.",
          415,
          "Use only PNG, JPEG, or WebP images.",
        );
      }

      if (screenshot.size > MAX_SCREENSHOT_BYTES) {
        throw new AuditServiceError(
          "FILE_TOO_LARGE",
          "One or more screenshots are larger than 5 MB.",
          413,
          "Compress the image or choose a smaller screenshot.",
        );
      }

      combinedBytes += screenshot.size;
    }

    if (combinedBytes > MAX_COMBINED_SCREENSHOT_BYTES) {
      throw new AuditServiceError(
        "FILE_TOO_LARGE",
        "The combined screenshot evidence is larger than 20 MB.",
        413,
        "Compress or remove screenshots and submit the audit again.",
      );
    }

    const parsedContext = parseAuditContextFromFormData(formData);
    if (!parsedContext) {
      throw new AuditServiceError(
        "INVALID_REQUEST",
        "The supplied audit definition is invalid.",
        400,
        "Shorten or correct the audit-definition fields and submit the audit again.",
      );
    }

    const provider = getAuditProvider();
    const images = await Promise.all(
      screenshots.map(async (screenshot, sequenceIndex) => ({
        bytes: new Uint8Array(await screenshot.arrayBuffer()),
        mimeType: screenshot.type as "image/png" | "image/jpeg" | "image/webp",
        fileName: screenshot.name,
        sequenceIndex,
      })),
    );

    const rawResult = await provider.review({ images, context: parsedContext });

    const result = auditResultSchema.safeParse(rawResult);
    if (!result.success || !findingsReferenceSubmittedEvidence(result.success ? result.data.findings : [], screenshots.length)) {
      throw new AuditServiceError(
        "INVALID_RESPONSE",
        "The audit provider returned an invalid or ungrounded response.",
        502,
        "Retry the audit. If the problem continues, review the provider configuration.",
      );
    }

    return NextResponse.json(result.data, {
      status: 200,
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

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local-anonymous";
}
