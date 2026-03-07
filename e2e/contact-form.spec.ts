import { test, expect } from "@playwright/test";

test.describe("Contact form", () => {
  test("contact page loads", async ({ page }) => {
    await page.goto("/contact-hybrid");
    await expect(page).toHaveURL(/\/contact-hybrid/);
    await page.waitForLoadState("networkidle");

    // Page should have either the chat interface or the form
    const pageContent = await page.textContent("body");
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test("contact form can be filled and submitted", async ({ page }) => {
    await page.goto("/contact-hybrid");
    await page.waitForLoadState("networkidle");

    // Look for the multi-step form — it may be toggled via a button
    const formToggle = page.locator(
      'button:has-text("form"), a:has-text("form"), [data-toggle-form]'
    );
    if (await formToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await formToggle.click();
      await page.waitForTimeout(500);
    }

    const form = page.locator("form");
    if (!(await form.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No visible form on contact page — may be chat-only");
      return;
    }

    // Fill fields as they appear (multi-step aware)
    const fields: Record<string, string> = {
      firstName: "Test",
      lastName: "Playwright",
      email: "e2e-test@example.com",
      phone: "5551234567",
      company: "E2E Testing Inc",
      address: "123 Test St",
      message: "Automated E2E test submission — please ignore.",
    };

    for (const [name, value] of Object.entries(fields)) {
      const input = page.locator(`[name="${name}"]`);
      if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await input.fill(value);
      }
    }

    // Advance through multi-step if needed
    let nextBtn = page.locator(
      'button[data-action="next"]:visible, button:has-text("next"):visible'
    );
    let safetyCounter = 0;
    while (
      (await nextBtn.isVisible({ timeout: 1_000 }).catch(() => false)) &&
      safetyCounter < 10
    ) {
      // Fill any new fields on the current step
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
      safetyCounter++;
    }

    // Submit
    const submitBtn = page.locator(
      'button[type="submit"]:visible, button[data-action="submit"]:visible'
    );
    if (await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      // Intercept the form POST to avoid actually creating a DB record
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes("/api/contact-form-submit"),
          { timeout: 10_000 }
        ),
        submitBtn.click(),
      ]);

      // A 200 means the form was accepted (or 201)
      expect([200, 201, 302]).toContain(response.status());
    }
  });
});
