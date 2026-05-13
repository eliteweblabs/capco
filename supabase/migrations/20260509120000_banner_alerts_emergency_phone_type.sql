-- Add emergency-phone banner type (high-visibility amber phone banner for urgent call notices)
ALTER TABLE "public"."bannerAlerts" DROP CONSTRAINT IF EXISTS "bannerAlerts_type_check";
ALTER TABLE "public"."bannerAlerts" ADD CONSTRAINT "bannerAlerts_type_check" CHECK (
  "type" = ANY (
    ARRAY[
      'info'::text,
      'success'::text,
      'warning'::text,
      'error'::text,
      'emergency-phone'::text
    ]
  )
);

COMMENT ON COLUMN "public"."bannerAlerts"."type" IS 'Alert type: info, success, warning, error, or emergency-phone';
