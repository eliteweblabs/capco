-- Add emergency-phone value to bannerAlerts.type CHECK (matches supabase migration 20260509120000)
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
