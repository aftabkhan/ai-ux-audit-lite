import { describe, expect, it } from "vitest";
import { productLabProtectionEnabled } from "@/lib/product-lab/auth";

describe("temporary public AI UX Audit showcase", () => {
  it("keeps the Product Lab invitation wall disabled", () => {
    expect(productLabProtectionEnabled()).toBe(false);
  });
});
