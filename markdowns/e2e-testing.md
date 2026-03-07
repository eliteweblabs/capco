# E2E Testing with Playwright

Automated end-to-end tests that verify login, form submissions, and page loading in a real browser.

## Setup (one-time)

1. Install browsers (already done if you ran `npm install`):
   ```bash
   npx playwright install chromium
   ```

2. Add test credentials to `.env`:
   ```
   E2E_TEST_EMAIL=your-test-user@example.com
   E2E_TEST_PASSWORD=your-test-password
   E2E_BASE_URL=http://localhost:4321
   ```
   Use a real Supabase user — create a dedicated test account if you don't have one.

## Running Tests

**Start your dev server first** (or build + start):
```bash
npm run dev
# or
npm run build && npm run start
```

Then run tests:

| Command | What it does |
|---|---|
| `npm run test:e2e` | Run all tests (headless) |
| `npm run test:e2e:headed` | Run all tests (visible browser) |
| `npm run test:e2e:ui` | Open Playwright UI (interactive picker) |
| `npm run test:e2e:login` | Run only login tests |
| `npm run test:e2e:pages` | Run only page-loading smoke tests |
| `npm run test:e2e:contact` | Run only contact form tests |
| `npm run test:e2e:report` | Open the last HTML test report |

## Test Files

```
e2e/
├── helpers/
│   └── auth.ts          # loginViaUI() and loginViaAPI() helpers
├── login.spec.ts        # Login flow (valid/invalid creds, redirects)
├── contact-form.spec.ts # Contact form filling + submission
├── dashboard.spec.ts    # Authenticated dashboard access
└── pages-load.spec.ts   # Smoke tests — all critical pages return 200
```

## Writing New Tests

```typescript
import { test, expect } from "@playwright/test";
import { loginViaAPI } from "./helpers/auth";

test.describe("My feature", () => {
  // Use loginViaAPI for fast setup (sets cookies via API)
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test("does the thing", async ({ page }) => {
    await page.goto("/my-page");
    await expect(page.locator("h1")).toContainText("Expected Title");
  });
});
```

### Key patterns

- **`loginViaUI(page)`** — Fills the actual login form (tests the login UI itself)
- **`loginViaAPI(page)`** — Calls `/api/auth/signin` directly (faster, for tests that need auth but aren't testing login)
- **Multi-step forms** — The helpers auto-detect and advance through steps
- **`test.skip()`** — Use when a feature isn't available in the current config

## Debugging Failed Tests

- **Screenshots**: Saved to `test-results/` on failure
- **Traces**: Run with `--trace on` and view at `trace.playwright.dev`
- **Headed mode**: `npm run test:e2e:headed` to watch the browser
- **Single test**: `npx playwright test -g "test name"`

## CI Notes

The `playwright.config.ts` will auto-start the server (`npm run start`) if nothing is running on port 4321. Set `E2E_BASE_URL` to point at staging/production to test deployed sites.
