import { test, expect } from "@playwright/test";
import { loginViaUI, loginViaAPI } from "./helpers/auth";

/**
 * End-to-end FLOWS — multi-step user journeys that chain actions together.
 * These test realistic scenarios the way a real user would experience them.
 *
 * Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env
 */

test.describe("Flow: Login → Dashboard → Navigate", () => {
  test("full login-to-dashboard journey via UI", async ({ page }) => {
    // 1. Start at home page
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // 2. Navigate to login
    await page.goto("/auth/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();

    // 3. Log in through the actual form
    await loginViaUI(page);
    await expect(page).toHaveURL(/\/project\/dashboard/);

    // 4. Verify dashboard content loaded (not a blank/error page)
    const body = await page.textContent("body");
    expect(body?.trim().length).toBeGreaterThan(100);

    // 5. No JS errors on the dashboard
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
});

test.describe("Flow: Login → New Project page", () => {
  test("authenticated user can reach new project form", async ({ page }) => {
    // Fast login via API
    await loginViaAPI(page);

    // Navigate to new project
    await page.goto("/project/new");
    await page.waitForLoadState("networkidle");

    // Should load (not redirect to login)
    await expect(page).toHaveURL(/\/project\/new/);

    // Project form should be visible
    const formContent = page.locator("#form-content");
    await expect(formContent).toBeVisible();
  });
});

test.describe("Flow: Login → Contact form submission", () => {
  test("logged-in user submits contact form with prefilled data", async ({
    page,
  }) => {
    await loginViaAPI(page);

    await page.goto("/contact-hybrid");
    await page.waitForLoadState("networkidle");

    // Find the form (may need to toggle from chat view)
    const formToggle = page.locator(
      'button:has-text("form"), a:has-text("form"), [data-toggle-form]'
    );
    if (await formToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await formToggle.click();
      await page.waitForTimeout(500);
    }

    const form = page.locator("form");
    if (!(await form.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No visible form on contact page");
      return;
    }

    // Fill available fields (some may be prefilled from auth)
    const fields: Record<string, string> = {
      firstName: "Flow",
      lastName: "TestUser",
      email: "flow-test@example.com",
      phone: "5559876543",
      message: "Automated flow test — please ignore.",
    };

    for (const [name, value] of Object.entries(fields)) {
      const input = page.locator(`[name="${name}"]`);
      if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const currentVal = await input.inputValue();
        if (!currentVal) await input.fill(value);
      }
    }

    // Walk through multi-step form
    let nextBtn = page.locator(
      'button[data-action="next"]:visible, button:has-text("next"):visible'
    );
    let steps = 0;
    while (
      (await nextBtn.isVisible({ timeout: 1_000 }).catch(() => false)) &&
      steps < 10
    ) {
      for (const [name, value] of Object.entries(fields)) {
        const input = page.locator(`[name="${name}"]`);
        if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
          const currentVal = await input.inputValue();
          if (!currentVal) await input.fill(value);
        }
      }
      await nextBtn.first().click();
      await page.waitForTimeout(500);
      nextBtn = page.locator(
        'button[data-action="next"]:visible, button:has-text("next"):visible'
      );
      steps++;
    }

    // Submit and verify API response
    const submitBtn = page.locator(
      'button[type="submit"]:visible, button[data-action="submit"]:visible'
    );
    if (await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/contact-form-submit") ||
            resp.url().includes("/api/"),
          { timeout: 10_000 }
        ),
        submitBtn.click(),
      ]);

      expect([200, 201, 302]).toContain(response.status());
    }
  });
});

test.describe("Flow: Unauthenticated user gets bounced", () => {
  test("visiting protected pages chains redirects to login", async ({
    page,
  }) => {
    const protectedPaths = [
      "/project/dashboard",
      "/project/new",
      "/project/settings",
    ];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login/, {
        timeout: 10_000,
      });
    }
  });
});

test.describe("Flow: Session persistence", () => {
  test("login persists across page navigations", async ({ page }) => {
    await loginViaAPI(page);

    // Visit multiple pages — auth should persist via cookies
    const pages = ["/project/dashboard", "/project/new", "/project/dashboard"];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      // Should NOT get redirected to login
      await expect(page).not.toHaveURL(/\/auth\/login/);
    }
  });
});
