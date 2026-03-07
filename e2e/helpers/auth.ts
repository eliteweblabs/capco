import { type Page, expect } from "@playwright/test";

/**
 * Log in via the UI using email/password.
 * Credentials come from E2E_TEST_EMAIL / E2E_TEST_PASSWORD env vars.
 */
export async function loginViaUI(
  page: Page,
  opts?: { email?: string; password?: string; expectedRedirect?: string }
) {
  const email = opts?.email ?? process.env.E2E_TEST_EMAIL;
  const password = opts?.password ?? process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing test credentials. Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env"
    );
  }

  await page.goto("/auth/login");
  await page.waitForLoadState("networkidle");

  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await emailInput.waitFor({ state: "visible", timeout: 10_000 });
  await emailInput.fill(email);

  // Login form may be multi-step — click next/continue if password isn't visible yet
  if (!(await passwordInput.isVisible())) {
    const nextBtn = page.locator(
      'button[data-action="next"], button[type="submit"]'
    );
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await passwordInput.waitFor({ state: "visible", timeout: 5_000 });
    }
  }

  await passwordInput.fill(password);

  const submitBtn = page.locator(
    'button[type="submit"], button[data-action="submit"]'
  );
  await submitBtn.click();

  // Wait for redirect away from login
  const target = opts?.expectedRedirect ?? "/project/dashboard";
  await page.waitForURL(`**${target}*`, { timeout: 15_000 });
}

/**
 * Log in via API (faster, no UI overhead). Sets auth cookies directly.
 */
export async function loginViaAPI(
  page: Page,
  opts?: { email?: string; password?: string }
) {
  const email = opts?.email ?? process.env.E2E_TEST_EMAIL;
  const password = opts?.password ?? process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing test credentials. Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env"
    );
  }

  const baseURL =
    (page.context() as any)._options?.baseURL ?? "http://localhost:4321";

  const response = await page.request.post(`${baseURL}/api/auth/signin`, {
    form: { email, password },
    headers: { accept: "application/json" },
  });

  const body = await response.json();
  expect(body.success, `API login failed: ${body.error}`).toBe(true);
}
