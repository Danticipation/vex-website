import { test, expect } from "@playwright/test";

test("hero exposes Apex data attribute for smoke + analytics hooks", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#universe");
  await expect(hero).toBeVisible();
  await expect(hero).toHaveAttribute("data-apex-hero", /^(on|off)$/);
});

test("configure route has garage-save CTA and exploded toggle", async ({ page }) => {
  await page.goto("/configure");
  await expect(page.locator('[data-save-garage="1"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /exploded view/i })).toBeVisible();
});
