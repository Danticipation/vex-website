import { test, expect } from "@playwright/test";

test("self-serve onboarding happy path", async ({ page }) => {
  await page.goto("/onboard");
  await page.getByPlaceholder("Business email").fill(`pilot-${Date.now()}@example.com`);
  await page.getByPlaceholder("Dealer name").fill("Velocity Motors");
  await page.getByPlaceholder("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Magic link")).toBeVisible();
});
