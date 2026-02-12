# Pages Without Layout Wrapper

Pages that use `<App>` directly with ad-hoc content structure instead of a layout component (LayoutDefault, LayoutFullWidth, LayoutCentered, LayoutFullscreen, LayoutTwoColumn).

**Reference:** LayoutDefault provides `mx-auto min-h-[calc(100dvh-8rem)] w-full max-w-7xl px-8 py-16 sm:px-16` + prose styling. CMS templates use `template` prop values: default | fullwidth | minimal | centered | fullscreen.

---

## Admin pages (no layout wrapper)

| Page | Current structure | Suggested layout |
|------|-------------------|------------------|
| `admin/banner-alerts.astro` | App > Hero + raw divs | LayoutDefault |
| `admin/cms.astro` | App > mx-auto max-w-7xl py-6 (custom) | LayoutDefault |
| `admin/update-test.astro` | App > min-h-screen py-8 (custom) | LayoutDefault |
| `admin/settings.astro` | App > mx-auto max-w-7xl px-4 py-8 (custom) | LayoutDefault |
| `admin/pdf-certify.astro` | App > mx-auto max-w-4xl p-6 (custom) | LayoutDefault |
| `admin/notifications.astro` | App > Hero + raw content | LayoutDefault |
| `admin/icons.astro` | App > raw content | LayoutDefault |
| `admin/global-functions.astro` | App > mx-auto max-w-5xl px-4 py-8 (custom) | LayoutDefault |
| `admin/design/placeholders.astro` | App > raw content | LayoutDefault |
| `admin/design.astro` | App > raw content | LayoutDefault |
| `admin/calendar.astro` | App > raw content | LayoutDefault |
| `admin/analytics.astro` | App > raw content | LayoutDefault |
| `admin/media.astro` | App > raw content | LayoutDefault |
| `admin/newsletters.astro` | App > Hero + raw content | LayoutDefault |
| `admin/users.astro` | App > raw content | LayoutDefault |
| `admin/finance.astro` | App > Hero + raw content | LayoutDefault |
| `admin/global-activity.astro` | App > raw content | LayoutDefault |
| `admin/discussions.astro` | App > raw content | LayoutDefault |
| `admin/pdf-system.astro` | App > PDFSystem directly | LayoutFullWidth or keep custom (full-width app) |

**N/A:** `admin/index.astro` – redirect only, no layout.

---

## Project pages (no layout wrapper)

| Page | Current structure | Suggested layout |
|------|-------------------|------------------|
| `project/[id].astro` | App > HeroProject + SlidingTabs + tab panels | LayoutFullWidth (or keep; project detail has custom structure) |
| `project/settings.astro` | App > custom container | LayoutDefault |
| `project/new.astro` | App > Hero + ProjectForm | LayoutDefault |
| `project/[id]/generate-pdf.astro` | App > custom container | LayoutDefault |
| `project/__dashboard.astro` | App > HeroDashboard + content | LayoutFullWidth |
| `project/new-inline.astro` | App > Hero + MultiStepProjectForm | LayoutDefault |

**Has layout:** `project/dashboard.astro` – uses LayoutFullWidth ✓

---

## Auth pages (no layout wrapper)

| Page | Current structure | Suggested layout |
|------|-------------------|------------------|
| `auth/_login.astro` | App > grid max-w-7xl (custom) | LayoutTwoColumn or LayoutCentered |
| `auth/reset.astro` | App > MultiStepForm | LayoutCentered |
| `auth/otp-login.astro` | App > OTPForm | LayoutCentered |
| `auth/register-json.astro` | App layout="centered" > MultiStepForm | LayoutCentered |

**Have layout:**
- `auth/login.astro` – LayoutTwoColumn ✓
- `auth/register.astro` – LayoutTwoColumn ✓
- `auth/callback.astro` – LayoutFullScreen ✓

---

## Summary counts

- **Admin:** 19 pages without layout wrapper
- **Project:** 6 pages without layout wrapper
- **Auth:** 4 pages without layout wrapper
- **Total:** 29 pages to update

---

## Layout components

- **LayoutDefault** – Standard content: `max-w-7xl`, prose, padding. Use for most admin/content pages.
- **LayoutFullWidth** – Full width. Use for dashboards, project detail, PDF system.
- **LayoutCentered** – Centered content. Use for auth forms, reset, OTP.
- **LayoutTwoColumn** – Split layout. Use for login/register.
- **LayoutFullscreen** – Full viewport, scrollable. Use for callback/loading.
- **LayoutMinimal** – Minimal chrome. Use when full app chrome is not needed.
