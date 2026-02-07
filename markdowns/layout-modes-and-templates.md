# Layout Modes and Page Templates

Single source of truth for page layout: **App.astro** `layout` prop and CMS **template** use the same values.

## Layout modes (App.astro `layout` prop)

| Value       | Behavior |
|------------|----------|
| `default`  | Standard page; preloader mask on frontend. |
| `fullwidth`| No max-width container; no preloader mask (landing/marketing). |
| `minimal`  | Narrow container; same chrome as default. |
| `centered` | Content centered vertically and horizontally (auth, 404, forms). |
| `fullscreen` | 100dvh, main scrolls, footer at bottom (dashboards, long forms). |

## Usage

- **Pages:** Prefer `layout="centered"` over `centerContent={true}`, `layout="fullscreen"` over `fullscreenScroll={true}`, `layout="fullwidth"` over `fullWidthPage={true}`.
- **Layout components:** `LayoutCentered`, `LayoutFullscreen`, `LayoutFullWidth` pass the corresponding `layout` to App.
- **CMS (MarkdownPage / content.ts):** Page `template` must be one of: `default`, `fullwidth`, `minimal`, `centered`, `fullscreen`. DB and env values are normalized (e.g. "Full Width" → `fullwidth`, "full screen" → `fullscreen`, "center" → `centered`).

## Files

- **App.astro** – Defines and derives layout behavior from `layout` or legacy booleans.
- **Layout components** – `src/components/layouts/Layout*.astro` – Pass `layout="..."` to App.
- **MarkdownPage.astro** – Maps `template` to layout component (default, fullwidth, minimal, centered, fullscreen).
- **content.ts** – Normalizes CMS/DB template strings to the five values above.
