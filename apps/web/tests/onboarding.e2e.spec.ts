import { test, expect } from "@playwright/test";

test("self-serve onboarding happy path", async ({ page }) => {
  await page.goto("/onboard");
  await page.getByPlaceholder("Business email").fill(`pilot-${Date.now()}@example.com`);
  await page.getByPlaceholder("Dealer name").fill("Velocity Motors");
  await page.getByPlaceholder("Password").fill("StrongPass123!");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("combobox")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByPlaceholder("Custom domain (optional)")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Seed demo data (10 vehicles + 3 appraisals).")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/magic link/i)).toBeVisible();
});
