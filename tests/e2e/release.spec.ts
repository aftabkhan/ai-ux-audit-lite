import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n5sAAAAASUVORK5CYII=",
  "base64",
);

async function uploadScreenshot(page: import("@playwright/test").Page, name = "checkout.png") {
  await page.getByLabel(/^Choose screenshot/).setInputFiles({
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

test("screenshot can be previewed, removed, and selected again without losing context", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Screen title").fill("Checkout payment step");
  await page.getByLabel("Target user").fill("First-time customer");
  await page.getByLabel("Product context").fill("Customer is selecting a payment method.");

  await uploadScreenshot(page);
  await expect(page.getByAltText("Preview of checkout.png")).toBeVisible();
  await expect(page.getByText("Replace screenshot")).toBeVisible();

  await page.getByRole("button", { name: "Remove screenshot" }).click();
  await expect(page.getByRole("status")).toContainText("Screenshot removed");
  await expect(page.getByLabel("Screen title")).toHaveValue("Checkout payment step");
  await expect(page.getByLabel("Target user")).toHaveValue("First-time customer");
  await expect(page.getByLabel("Product context")).toHaveValue("Customer is selecting a payment method.");
  await expect(page.getByLabel(/^Choose screenshot/)).toBeFocused();

  await uploadScreenshot(page, "checkout-again.png");
  await expect(page.getByAltText("Preview of checkout-again.png")).toBeVisible();
});

test("unsupported and oversized files provide recoverable validation", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel(/^Choose screenshot/).setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByRole("alert")).toContainText(/PNG|JPEG|WebP/i);

  await page.getByLabel(/^Choose screenshot/).setInputFiles({
    name: "large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("alert")).toContainText(/5 MB/i);
});

test("fixture audit completes, focuses results, filters findings, and resets", async ({ page }) => {
  test.slow();
  await page.goto("/");
  await uploadScreenshot(page);
  await page.getByLabel("Screen title").fill("Checkout");
  await page.getByRole("button", { name: "Run UX audit" }).click();

  const resultsHeading = page.getByRole("heading", { name: /audit results/i });
  await expect(resultsHeading).toBeVisible({ timeout: 30_000 });
  await expect(resultsHeading).toBeFocused();
  await expect(page.getByRole("status")).toContainText("Audit complete");

  const search = page.getByRole("searchbox");
  if (await search.count()) {
    await search.fill("unlikely-search-term-with-no-match");
    await expect(page.getByText(/no findings/i)).toBeVisible();
  }

  await page.getByRole("button", { name: /new review/i }).click();
  await expect(page.getByRole("heading", { name: "Upload an interface screenshot" })).toBeVisible();
  await expect(page.getByLabel("Screen title")).toHaveValue("");
  await expect(page.getByLabel(/^Choose screenshot/)).toBeFocused();
});
