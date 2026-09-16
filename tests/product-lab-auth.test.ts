import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  protected: vi.fn<() => boolean>(),
  identity: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@/lib/product-lab/auth", () => ({
  productLabProtectionEnabled: auth.protected,
  getProductLabIdentity: auth.identity,
}));

import { POST } from "@/app/api/audit/route";

describe("Product Lab audit API boundary", () => {
  beforeEach(() => {
    auth.protected.mockReset();
    auth.identity.mockReset();
  });

  it("denies audit requests when protected mode has no valid reviewer session", async () => {
    auth.protected.mockReturnValue(true);
    auth.identity.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/audit", { method: "POST" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: "ACCESS_REQUIRED" });
  });

  it("preserves the existing multipart validation path when protection is disabled", async () => {
    auth.protected.mockReturnValue(false);
    const formData = new FormData();

    const response = await POST(
      new Request("http://localhost/api/audit", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: "INVALID_REQUEST" });
    expect(auth.identity).not.toHaveBeenCalled();
  });
});
