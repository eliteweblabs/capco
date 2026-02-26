# Email: Gmail Logo, Dark Mode, and DKIM/SPF

## 1. Why Gmail doesn’t show the logo (Proton does)

**Cause:** Gmail does **not** support:

- **Data URIs** (`data:image/svg+xml;base64,...`) – blocked for security; images go through Gmail’s proxy, which doesn’t handle data URIs.
- **SVG images** – Gmail’s proxy does not support SVG (no plans to).

Proton and other clients can show the logo because they allow data URIs and/or SVG.

**What we did:**

- The primary logo in the email template now uses **`{{GLOBAL_COMPANY_LOGO_DARK_SRC}}`**, which is set to:
  - A **hosted URL** when available (so Gmail can load it), or
  - The same base64 data URI as before for clients that support it.
- Hosted URL is chosen in this order:
  1. **Admin setting `emailLogoUrl`** (globalSettings) if set.
  2. Otherwise **`{baseUrl}/img/email-logo.png`** (e.g. `https://rothcollc.com/img/email-logo.png`).

**What you need to do for Gmail to show the logo:**

- **Option A:** Add a PNG logo at **`public/img/email-logo.png`** (so it’s served at `/img/email-logo.png`). Export your logo as PNG (e.g. 2x for sharpness).
- **Option B:** In Admin → Design/Settings, set **`emailLogoUrl`** to a full URL of your logo image (e.g. `https://yoursite.com/img/logo.png`). Use a PNG (or JPEG); avoid SVG for Gmail.

---

## 2. Why light/dark colors aren’t respected in Gmail

**Cause:** Gmail does **not** support:

- **`@media (prefers-color-scheme: dark)`** in HTML emails. It ignores this.
- Your custom dark background/text colors. Gmail does its own “dark mode” by **inverting** colors (e.g. white → dark, dark text → light) and can override your CSS.

So the template’s light/dark theme works in Proton and similar clients, but in Gmail you cannot fully control dark mode; the client may invert the email anyway.

**What we did:**

- Added **`<meta name="color-scheme" content="light dark" />`** in the email template so clients that support it get a hint. Gmail may still ignore it.
- **`{{GLOBAL_BACKGROUND_COLOR}}`** is now replaced (it was missing before); light background and **`{{GLOBAL_BACKGROUND_COLOR_DARK}}`** are both applied for clients that honor `prefers-color-scheme`.

**Practical approach:** Design the email so it stays readable when Gmail inverts it (e.g. contrast that works on both light and dark).

---

## 3. DKIM / SPF / DMARC from your headers

From the headers you shared, the message was:

1. **Sent** from Resend → Amazon SES (From: rothcollc.com, Return-Path: send.rothcollc.com).
2. **Received** at Google (e.g. teast@eliteweblabs.com) – **first hop.**
3. Then **forwarded** (e.g. to sen@eliteweblabs.com) – **second hop.**

**First hop (direct delivery):**

- **DKIM:** `pass` (both `@rothcollc.com` and `@amazonses.com`).
- **SPF:** `pass` (SES IP 54.240.9.114 permitted for send.rothcollc.com).
- **DMARC:** `pass`.

So for the **original recipient**, authentication is correct; Resend/SES and your domain are set up properly.

**Second hop (after Gmail forwarding):**

- **DKIM:** `fail` – Forwarding can change headers/body; re-verification at the final destination often fails.
- **SPF:** `softfail` – The visible sender is now Gmail (209.85.220.69), not SES. SPF asks “who can send as send.rothcollc.com?” – only your SES IPs are allowed, so when Gmail forwards, SPF fails.
- **DMARC:** `fail` – Because SPF/DKIM fail on the forwarded path.

**Conclusion:** There’s nothing wrong with your **DKIM/SPF/DMARC configuration** for sending. The failures appear on the **forwarded** copy. Recipients who get the message **directly** (no forwarding) see pass. If you want forwards to authenticate better, that would require things like SRS or the receiving side trusting ARC; for normal “send to one inbox, they forward to another” flows, this behavior is common and not a config bug on your side.

---

## Summary of code changes

- **Placeholder utils:**  
  - Replace **`{{GLOBAL_BACKGROUND_COLOR}}`** with the light background color.  
  - **`{{GLOBAL_COMPANY_LOGO_DARK_SRC}}`** = hosted logo URL (for Gmail) or base64 SVG (for others).  
  - **`emailLogoUrl`** from global company data; fallback `{baseUrl}/img/email-logo.png`.
- **Email template:**  
  - Primary logo uses **`{{GLOBAL_COMPANY_LOGO_DARK_SRC}}`**.  
  - **`<meta name="color-scheme" content="light dark" />`** added.
- **Global company data:**  
  - New optional **`emailLogoUrl`** (from globalSettings) for a custom logo URL in email.
