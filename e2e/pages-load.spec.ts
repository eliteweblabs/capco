import { test, expect } from "@playwright/test";

/**
 * Smoke tests — verify critical pages return 200 and render content.
 * These run fast and catch deployment/config regressions.
 */

const PUBLIC_PAGES = [
  { path: "/", name: "Home" },
  { path: "/auth/login", name: "Login" },
  { path: "/contact-hybrid", name: "Contact" },
];

const PROTECTED_PAGES = [
  { path: "/project/dashboard", name: "Dashboard" },
];

test.describe("Public pages load", () => {
  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} (${path}) returns 200`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      // Basic content check — page isn't blank
      const body = await page.textContent("body");
      expect(body?.trim().length).toBeGreaterThan(50);

      // No uncaught JS errors
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }
});

test.describe("Protected pages redirect to login", () => {
  for (const { path, name } of PROTECTED_PAGES) {
    test(`${name} (${path}) redirects when unauthenticated`, async ({
      page,
    }) => {
      await page.goto(path);
      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  }
});
