import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const PRODUCT_KEY = "ai-ux-audit" as const;
const COOKIE_NAME = "ai_ux_product_lab_session";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type ProductLabIdentity = {
  reviewerId: string;
  name: string;
  email: string;
  organization: string | null;
  roleTitle: string | null;
  productKey: typeof PRODUCT_KEY;
  expiresAt: string;
};

function hashToken(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function getConfig(): { baseUrl: string; serviceKey: string } | null {
  if (process.env.PRODUCT_LAB_PROTECTED !== "true") return null;

  const baseUrl = process.env.PRODUCT_LAB_BASE_URL?.trim().replace(/\/$/, "");
  const serviceKey = process.env.PRODUCT_LAB_INTERNAL_SERVICE_KEY?.trim();
  if (!baseUrl || !serviceKey) {
    throw new Error("Product Lab protection is enabled but not configured.");
  }

  return { baseUrl, serviceKey };
}

function parseIdentity(value: unknown): ProductLabIdentity | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.reviewerId !== "string" ||
    typeof record.name !== "string" ||
    typeof record.email !== "string" ||
    record.productKey !== PRODUCT_KEY ||
    typeof record.expiresAt !== "string"
  ) {
    return null;
  }

  return {
    reviewerId: record.reviewerId,
    name: record.name,
    email: record.email,
    organization: typeof record.organization === "string" ? record.organization : null,
    roleTitle: typeof record.roleTitle === "string" ? record.roleTitle : null,
    productKey: PRODUCT_KEY,
    expiresAt: record.expiresAt,
  };
}

async function callLab(path: string, body: Record<string, unknown>): Promise<ProductLabIdentity | null> {
  const config = getConfig();
  if (!config) return null;

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return parseIdentity(await response.json());
}

export function productLabProtectionEnabled(): boolean {
  return process.env.PRODUCT_LAB_PROTECTED === "true";
}

export function productLabPortalUrl(): string {
  return process.env.PRODUCT_LAB_BASE_URL?.trim().replace(/\/$/, "") || "https://lab.aftabkhan.net";
}

export async function consumeProductLabHandoff(rawCode: string): Promise<ProductLabIdentity | null> {
  if (!TOKEN_PATTERN.test(rawCode)) return null;
  if (!productLabProtectionEnabled()) return null;

  const rawSession = createToken();
  const identity = await callLab("/api/product-lab/internal/consume-handoff", {
    productKey: PRODUCT_KEY,
    handoffHash: hashToken(rawCode),
    productSessionHash: hashToken(rawSession),
  });

  if (!identity) return null;

  const expires = new Date(identity.expiresAt);
  if (!Number.isFinite(expires.getTime())) return null;

  const store = await cookies();
  store.set(COOKIE_NAME, rawSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });

  return identity;
}

export async function getProductLabIdentity(): Promise<ProductLabIdentity | null> {
  if (!productLabProtectionEnabled()) return null;

  const store = await cookies();
  const rawSession = store.get(COOKIE_NAME)?.value;
  if (!rawSession || !TOKEN_PATTERN.test(rawSession)) return null;

  return callLab("/api/product-lab/internal/validate-product-session", {
    productKey: PRODUCT_KEY,
    productSessionHash: hashToken(rawSession),
  });
}
