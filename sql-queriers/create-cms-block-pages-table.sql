-- CMS Block Pages Table
-- Block-based pages: each page has N sections; each section is fullwidth or contained + 12-col layout.
-- Independent of the existing cmsPages (template-based) system. Use block pages for flexible layouts.
-- When a slug has a row in cmsBlockPages, that page is rendered as block-based; otherwise existing CMS applies.

CREATE TABLE IF NOT EXISTS "public"."cmsBlockPages" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "slug" text NOT NULL,
  "title" text,
  "description" text,
  "sections" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "clientId" text,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  CONSTRAINT "cms_block_pages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "unique_block_page_slug_per_client" UNIQUE ("slug", "clientId")
);

CREATE INDEX IF NOT EXISTS "idx_cmsBlockPages_slug" ON "public"."cmsBlockPages" ("slug");
CREATE INDEX IF NOT EXISTS "idx_cmsBlockPages_clientId" ON "public"."cmsBlockPages" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_cmsBlockPages_active" ON "public"."cmsBlockPages" ("isActive") WHERE ("isActive" = true);

ALTER TABLE "public"."cmsBlockPages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active CMS block pages"
  ON "public"."cmsBlockPages"
  FOR SELECT
  USING ("isActive" = true);

CREATE OR REPLACE FUNCTION "public"."update_cms_block_pages_updatedAt"()
RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "update_cms_block_pages_timestamp"
  BEFORE UPDATE ON "public"."cmsBlockPages"
  FOR EACH ROW
  EXECUTE PROCEDURE "public"."update_cms_block_pages_updatedAt"();

COMMENT ON TABLE "public"."cmsBlockPages" IS 'Block-based CMS pages: sections array with width (fullwidth|contained) and blocks or column layout (e.g. 6-6)';
COMMENT ON COLUMN "public"."cmsBlockPages"."sections" IS 'Array of { width: "fullwidth"|"contained", block?: { type, props }, columns?: [6,6]|[], blocks?: [{ type, props }] }';
