import type { AuditContext, AuditResult } from "@/src/types/audit";

export interface AuditProviderInput {
  image: {
    bytes: Uint8Array;
    mimeType: "image/png" | "image/jpeg" | "image/webp";
    fileName: string;
  };
  context: AuditContext;
}

export interface AuditProvider {
  readonly name: string;
  review(input: AuditProviderInput): Promise<AuditResult>;
}
