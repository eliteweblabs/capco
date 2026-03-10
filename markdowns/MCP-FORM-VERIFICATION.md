# MCP Form Verification

**Loading checks (200 OK on /, /contact, etc.) are NOT acceptable for form verification.** They only prove the page loads, not that the form submits.

## Required: Use MCP Browser (cursor-ide-browser)

When verifying forms work, use **cursor-ide-browser** MCP to:

1. **Navigate** to the form URL (e.g. `http://localhost:4321/contact?mcp=1`)
2. **Fill** each step with dummy data (no need for correct/real data)
3. **Click** next/submit through all steps
4. **Verify** the form attempts to submit: POST to `/api/contact-form-submit` (contact) or the form's API endpoint

## Contact Form – Dummy Data

| Step | Field      | Dummy Value          |
|------|------------|----------------------|
| 1    | Email      | `mcp-test@example.com` |
| 2    | Name       | `MCP Test User`      |
| 3    | Phone      | `555-123-4567`       |
| 4    | SMS opt-in | Skip or No           |
| 5    | Company    | `Test Co`            |
| 6    | Message    | `MCP verification test` |

## Faster MCP Testing: `?mcp=1`

Add `?mcp=1` to the URL to disable typewriter/cascade animations. Buttons and inputs are visible immediately so MCP can fill and advance without waiting.

- With `?mcp=1`: no wait between steps
- Without: wait ~3 seconds after each step for typewriter to finish

## Verification Success Criteria

- Form advances through all steps (Next works)
- Submit button triggers POST to form API
- No console errors during fill/submit
- Success toast or inline message appears (or API returns 200)

## Do NOT Use

- `scripts/check-site-loading.sh` – only checks HTTP 200, not form behavior
- Assuming "build succeeded" = form works
- Declaring "fixed" without MCP browser verification
