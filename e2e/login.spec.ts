import { test, expect } from "@playwright/test";
import { loginViaUI, loginViaAPI } from "./helpers/auth";

test.describe("Login flow", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[name="email"]');
    await emailInput.waitFor({ state: "visible", timeout: 10_000 });
    await emailInput.fill("fake-user@example.com");

    const passwordInput = page.locator('input[name="password"]');

    // Handle multi-step: advance if password isn't visible yet
    if (!(await passwordInput.isVisible())) {
      const nextBtn = page.locator(
        'button[data-action="next"], button[type="submit"]'
      );
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await passwordInput.waitFor({ state: "visible", timeout: 5_000 });
      }
    }

    await passwordInput.fill("wrongpassword123");

    const submitBtn = page.locator(
      'button[type="submit"], button[data-action="submit"]'
    );
    await submitBtn.click();

    // Should stay on login page or show an error — NOT redirect to dashboard
    await page.waitForTimeout(3_000);
    await expect(page).not.toHaveURL(/\/project\/dashboard/);
  });

  test("logs in with valid credentials (UI)", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL(/\/project\/dashboard/);
  });

  test("logs in with valid credentials (API)", async ({ page }) => {
    await loginViaAPI(page);

    // After API login, cookies are set — navigate to a protected page
    await page.goto("/project/dashboard");
    await expect(page).toHaveURL(/\/project\/dashboard/);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("redirects authenticated user away from login page", async ({
    page,
  }) => {
    await loginViaAPI(page);
    await page.goto("/auth/login");

    // Should redirect to dashboard since already authenticated
    await page.waitForURL("**/project/dashboard*", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/project\/dashboard/);
  });
});
