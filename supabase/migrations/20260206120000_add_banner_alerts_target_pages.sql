-- Add page targeting to banner alerts: show only on specific pages when set
-- targetPages: comma-separated slugs (e.g. 'cookie-preferences,privacy'). NULL or empty = show on all pages.
ALTER TABLE "public"."bannerAlerts"
  ADD COLUMN IF NOT EXISTS "targetPages" text;

COMMENT ON COLUMN "public"."bannerAlerts"."targetPages" IS 'Optional: comma-separated page slugs. Alert only shows on these pages. Empty/NULL = show on all pages.';
