import type { AuditContext, AuditResult } from "@/src/types/audit";

export interface AuditProviderImage {
  bytes: Uint8Array;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  fileName: string;
  sequenceIndex: number;
}

export interface AuditProviderInput {
  images: AuditProviderImage[];
  context: AuditContext;
}

export interface AuditProvider {
  readonly name: string;
  review(input: AuditProviderInput): Promise<AuditResult>;
}
