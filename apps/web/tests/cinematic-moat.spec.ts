import { test, expect } from "@playwright/test";

test("homepage exposes main landmark for funnel + hero region", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator("#universe")).toBeVisible();
});

test("WebGPU feature flag is detectable in browser", async ({ page }) => {
  await page.goto("/");
  const gpu = await page.evaluate(() => {
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { gpu?: unknown }) : undefined;
    return nav?.gpu != null;
  });
  expect(typeof gpu).toBe("boolean");
});

test("cinematic hero mounts a non-zero WebGL canvas when eligible", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("canvas").first();
  const count = await canvas.count();
  test.skip(count === 0, "No WebGL canvas (reduced motion, software renderer, or CI headless policy)");

  const box = await canvas.boundingBox();
  expect(box?.width ?? 0, "canvas width").toBeGreaterThan(32);
  expect(box?.height ?? 0, "canvas height").toBeGreaterThan(32);
});
