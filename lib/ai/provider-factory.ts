import type { AuditProvider } from "@/lib/ai/provider";
import { FixtureAuditProvider } from "@/lib/ai/fixture-provider";
import { OpenAIAuditProvider } from "@/lib/ai/openai-provider";
import { AuditServiceError } from "@/lib/audit/errors";

export function getAuditProvider(): AuditProvider {
  const provider = process.env.AUDIT_PROVIDER ?? "fixture";

  if (provider === "fixture") return new FixtureAuditProvider();
  if (provider === "openai") return new OpenAIAuditProvider();

  throw new AuditServiceError(
    "PROVIDER_ERROR",
    `Unsupported audit provider: ${provider}`,
    503,
    "Set AUDIT_PROVIDER to fixture or openai and configure the required server credentials.",
  );
}
