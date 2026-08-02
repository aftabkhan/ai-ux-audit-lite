export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type ScreenshotValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export function validateScreenshot(file: File): ScreenshotValidationResult {
  if (!ACCEPTED_SCREENSHOT_TYPES.includes(file.type as (typeof ACCEPTED_SCREENSHOT_TYPES)[number])) {
    return { valid: false, message: "Choose a PNG, JPEG, or WebP screenshot." };
  }

  if (file.size > MAX_SCREENSHOT_BYTES) {
    return { valid: false, message: "The screenshot must be 5 MB or smaller." };
  }

  return { valid: true };
}
