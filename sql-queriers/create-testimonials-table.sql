-- Testimonials table for customer testimonials
-- Fields: title, testimonial (quote), name, company, image (URL), displayOrder
-- Applied via Supabase MCP migration: create_testimonials_table

CREATE TABLE IF NOT EXISTS public."testimonials" (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title text,
  testimonial text NOT NULL,
  "name" text,
  company text,
  image text,
  "displayOrder" smallint DEFAULT 0,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE public."testimonials" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read testimonials"
  ON public."testimonials" FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert testimonials"
  ON public."testimonials" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Admins can update testimonials"
  ON public."testimonials" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete testimonials"
  ON public."testimonials" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
  );
