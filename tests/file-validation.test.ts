import { describe, expect, it } from "vitest";
import { MAX_SCREENSHOT_BYTES, validateScreenshot } from "@/lib/validation/file";

function makeFile(type: string, size: number): File {
  return new File([new Uint8Array(size)], "screen", { type });
}

describe("validateScreenshot", () => {
  it("accepts supported image types within the limit", () => {
    expect(validateScreenshot(makeFile("image/png", 1024))).toEqual({ valid: true });
  });

  it("rejects unsupported types", () => {
    expect(validateScreenshot(makeFile("image/gif", 1024))).toEqual({
      valid: false,
      message: "Choose a PNG, JPEG, or WebP screenshot.",
    });
  });

  it("rejects files above 5 MB", () => {
    expect(validateScreenshot(makeFile("image/jpeg", MAX_SCREENSHOT_BYTES + 1))).toEqual({
      valid: false,
      message: "The screenshot must be 5 MB or smaller.",
    });
  });
});
