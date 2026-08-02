import type { AuditError } from "@/src/types/audit";

export class AuditServiceError extends Error {
  constructor(
    public readonly code: AuditError["code"],
    message: string,
    public readonly status: number,
    public readonly recovery?: string,
  ) {
    super(message);
    this.name = "AuditServiceError";
  }
}

export function toAuditError(error: unknown): { status: number; body: AuditError } {
  if (error instanceof AuditServiceError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message,
        recovery: error.recovery,
      },
    };
  }

  return {
    status: 500,
    body: {
      code: "UNKNOWN_ERROR",
      message: "The audit could not be completed.",
      recovery: "Try again with a different screenshot. If the problem continues, wait and retry later.",
    },
  };
}
