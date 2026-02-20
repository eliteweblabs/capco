# CMS / Database Content Breaking Layout or Scripts

If **rolling back at Railway doesn’t fix** the issue, the problem is likely **runtime data**—content coming from the **database via the CMS**, not from the deployed code.

## How it can break the page

These values are injected into the layout with `set:html` or raw injection:

| Source | Key / Field | Where it’s used | Risk |
|--------|-------------|------------------|------|
| **globalSettings** | `customCss` | App.astro: `<style is:inline set:html={customCss}>` | If the value contains `</style>` (or `</style><script>...`), it closes the style tag and can break the rest of the document or inject script. |
| **globalSettings** | `customFooterHtml` | Footer.astro: `set:html={customFooterHtml}` | Unclosed tags or script can break layout or run unintended code. |
| **globalSettings** | `plausibleTrackingScript` | App.astro (currently commented out) | If enabled, raw HTML/script from DB. |
| **Navigation** | built from features + pages | Navbar: `set:html={desktopNavigationHTML}` | Labels/URLs with `</div>`, `</ul>`, etc. can close the nav early and break structure. |
| **cmsPages** | page `content` / markdown | Rendered in MarkdownPage / ContentBlock | Bad HTML or unescaped content in a page can break that page or layout. |

Most likely culprits for “scripts missing” or “theme toggle / components not working” after a **recent edit**:

1. **customCss** – e.g. someone added a closing `</style>` or pasted something that isn’t pure CSS.
2. **customFooterHtml** – e.g. a snippet with unclosed tags or a script.
3. **Navigation** – a new or edited nav item whose label/URL contains HTML-like characters that get interpreted as tags.

## How to find recent edits

1. **Admin → Settings**  
   Check “Custom CSS” and “Custom Footer HTML”. Look for `</style>`, `<script`, or obvious typos.

2. **Database**  
   Use the SQL below to:
   - List **recently updated** `globalSettings` (by `updatedAt`).
   - Inspect **current** `customCss` and `customFooterHtml` for dangerous patterns.

3. **Temporary test**  
   Clear or shorten the suspicious field in Admin Settings (or via SQL). Reload the live site (no redeploy). If the issue goes away, that edit was the cause.

## Reverting safely

- **Custom CSS**: In Admin → Settings, clear the Custom CSS field (or remove the last few lines you added) and save.
- **Custom Footer HTML**: Same—clear or revert in Settings.
- **Navigation**: Remove or fix the last-added nav item or feature that might contain `<`, `>`, or `</…>`.

If you need to revert in the DB directly, use the SQL in `sql-queriers/inspect-and-revert-cms-breaking-content.sql`.
