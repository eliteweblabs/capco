# Block-Based CMS Pages

Block-based pages are an alternative to the template-based CMS. They are **not** tied to page-level templates (default, fullwidth, minimal, etc.). Every block page uses **LayoutFullWidth**; layout control is per-section.

## When to use

- You want a full-width hero **and** contained content below without the whole page bleeding to the edges.
- You want 12-column rows (e.g. 6/6, 4-4-4, 8/4) with each section either fullwidth or contained.
- You prefer composing pages from blocks instead of one markdown blob + template.

## How it works

1. **Routing**: `[...slug].astro` only renders **block pages** from `cmsBlockPages`. If no row exists for the slug, the request redirects to 404. The old template CMS is not used by this route.
2. **Table**: `cmsBlockPages` (see `sql-queriers/create-cms-block-pages-table.sql`). Columns: `slug`, `title`, `description`, `sections` (JSONB), `clientId`, `isActive`, etc.
3. **Sections**: Each page has an array of sections. **Preferred format**: use `items` so each section has multiple blocks and each block has its own width:
   - **items**: `[{ width: "fullwidth"|"contained", block: { type, props } }, ...]` — multiple blocks per section, each with a **Full width** or **Contained** toggle.
   - **Legacy**: single `block`, or `columns` + `blocks` (one row, section-level width).

4. **Admin builder**: In **Admin → CMS → Block pages**, use the visual builder: add sections, add blocks to each section, and set **Width** per block (Full width / Contained). No raw JSON required.

5. **Rendering**: `BlockPageView` → `LayoutFullWidth` → for each section, `BlockSection`:
   - **Fullwidth**: row is edge-to-edge (no max-width container).
   - **Contained**: row is wrapped in `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

## Section shape (JSON)

**Preferred — multiple blocks per section, each with its own width:**

```json
{
  "items": [
    { "width": "fullwidth", "block": { "type": "CTABlock", "props": { "title": "Hero" } } },
    { "width": "contained", "block": { "type": "ContentBlock", "props": { "title": "Intro", "content": "<p>...</p>" } } }
  ]
}
```

Legacy — single block:

```json
{
  "width": "contained",
  "block": {
    "type": "ContentBlock",
    "props": { "title": "Hello", "content": "<p>World</p>" }
  }
}
```

Legacy — multi-column (columns must sum to 12):

```json
{
  "width": "contained",
  "columns": [6, 6],
  "blocks": [
    { "type": "ContentBlock", "props": { "title": "Left" } },
    { "type": "ContentBlock", "props": { "title": "Right" } }
  ]
}
```

## Block types

Use the same types as `BlockRenderer` / `BlockRegistry`: e.g. `CTABlock`, `FeatureGridBlock`, `ContentBlock`, `TwoColumnFadeShowBlock`, `FAQBlock`, `StatsBlock`, etc. See `src/components/blocks/BlockRegistry.ts` and `BlockRenderer.astro`.

## Creating a block page

1. Run the SQL migration: `sql-queriers/create-cms-block-pages-table.sql` (in Supabase SQL editor or migration).
2. Insert a row into `cmsBlockPages`, e.g.:

```sql
INSERT INTO "public"."cmsBlockPages" ("slug", "title", "description", "sections", "isActive")
VALUES (
  'home',
  'Home',
  'Welcome',
  '[
    {"width":"fullwidth","block":{"type":"CTABlock","props":{"title":"Welcome","buttonText":"Contact","buttonHref":"/contact"}}},
    {"width":"contained","columns":[6,6],"blocks":[
      {"type":"ContentBlock","props":{"title":"Left","content":"<p>Left column</p>"}},
      {"type":"ContentBlock","props":{"title":"Right","content":"<p>Right column</p>"}}
    ]}
  ]'::jsonb,
  true
);
```

3. Visit `/` or `/home`. The block page is used because the slug exists in `cmsBlockPages`. The existing template-based home (from `cmsPages` or defaults) is only used when there is **no** block page for that slug.

## Relationship to the old template CMS

- The **catch-all route** (`[...slug].astro`) tries **block pages** first; if no block page exists for the slug, it falls back to the **template CMS** (`getPageContent` + MarkdownPage). Missing both → 404.
- Template pages (`cmsPages`) are listed and edited under **Admin → CMS → Pages**; block pages under **Block pages**.

## Files

- `src/lib/content-blocks.ts` – `getBlockPageContent(slug)`, types
- `src/components/cms/BlockSection.astro` – one row (fullwidth/contained + 12-col grid)
- `src/components/cms/BlockPageView.astro` – LayoutFullWidth + sections
- `src/pages/[...slug].astro` – try block page first, then template CMS
- `sql-queriers/create-cms-block-pages-table.sql` – table and RLS
