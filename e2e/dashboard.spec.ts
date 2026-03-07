import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./helpers/auth";

test.describe("Dashboard (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test("dashboard loads after login", async ({ page }) => {
    await page.goto("/project/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/project\/dashboard/);

    const body = await page.textContent("body");
    expect(body?.trim().length).toBeGreaterThan(50);
  });

  test("no console errors on dashboard", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/project/dashboard");
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
  });
});
