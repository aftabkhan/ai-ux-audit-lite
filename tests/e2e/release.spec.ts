import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n5sAAAAASUVORK5CYII=",
  "base64",
);

async function uploadScreenshot(page: import("@playwright/test").Page, name = "checkout.png") {
  await page.getByLabel(/^Choose screenshots/).setInputFiles({
    name,
    mimeType: "image/png",
    buffer: onePixelPng,
  });
}

test("landing page has no horizontal overflow and no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const accessibility = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();

  expect(accessibility.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

test("ordered evidence can be previewed, selectively removed, and selected again without losing context", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Audit title").fill("Checkout payment flow");
  await page.getByLabel("Target user").fill("First-time customer");
  await page.getByLabel("Product context").fill("Customer moves from cart to payment confirmation.");

  await page.getByLabel(/^Choose screenshots/).setInputFiles([
    { name: "cart.png", mimeType: "image/png", buffer: onePixelPng },
    { name: "checkout.png", mimeType: "image/png", buffer: onePixelPng },
  ]);

  await expect(page.getByAltText("Preview of evidence 1: cart.png")).toBeVisible();
  await expect(page.getByAltText("Preview of evidence 2: checkout.png")).toBeVisible();
  await expect(page.getByText("Replace evidence")).toBeVisible();

  await page.getByRole("button", { name: "Remove evidence 1" }).click();
  await expect(page.getByRole("status")).toContainText("Screenshot removed");
  await expect(page.getByText("Evidence 1 · checkout.png")).toBeVisible();
  await expect(page.getByLabel("Audit title")).toHaveValue("Checkout payment flow");
  await expect(page.getByLabel("Target user")).toHaveValue("First-time customer");
  await expect(page.getByLabel("Product context")).toHaveValue("Customer moves from cart to payment confirmation.");
  await expect(page.getByLabel(/^Choose screenshots/)).toBeFocused();

  await uploadScreenshot(page, "checkout-again.png");
  await expect(page.getByAltText("Preview of evidence 1: checkout-again.png")).toBeVisible();
});

test("unsupported and oversized files provide recoverable validation", async ({ page }) => {
  await page.goto("/");
  const fieldError = page.locator(".field-error");

  await page.getByLabel(/^Choose screenshots/).setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(fieldError).toContainText(/PNG|JPEG|WebP/i);

  await page.getByLabel(/^Choose screenshots/).setInputFiles({
    name: "large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(fieldError).toContainText(/5 MB/i);
});

test("fixture audit completes from multiple evidence items, focuses results, filters findings, and resets", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Run the rate-limited fixture audit once; the remaining projects validate the client flow.");
  test.slow();
  await page.goto("/");
  await page.getByLabel(/^Choose screenshots/).setInputFiles([
    { name: "cart.png", mimeType: "image/png", buffer: onePixelPng },
    { name: "checkout.png", mimeType: "image/png", buffer: onePixelPng },
  ]);
  await page.getByLabel("Audit title").fill("Checkout flow");
  await page.getByRole("button", { name: "Run UX audit" }).click();

  const resultsHeading = page.getByRole("heading", { name: "UX review results" });
  await expect(resultsHeading).toBeVisible({ timeout: 30_000 });
  await expect(resultsHeading).toBeFocused();
  await expect(page.getByRole("status").first()).toContainText("Audit complete");

  const search = page.getByRole("searchbox");
  if (await search.count()) {
    await search.fill("unlikely-search-term-with-no-match");
    await expect(page.getByText(/no findings/i)).toBeVisible();
  }

  await page.getByRole("button", { name: /new review/i }).click();
  await expect(page.getByRole("heading", { name: "Add interface evidence" })).toBeVisible();
  await expect(page.getByLabel("Audit title")).toHaveValue("");
  await expect(page.getByLabel(/^Choose screenshots/)).toBeFocused();
});
