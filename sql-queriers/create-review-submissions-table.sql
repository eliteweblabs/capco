-- Review submissions table for storing customer reviews (from public form)
-- Reviews can be approved and displayed via GoogleReviewsBlock or TestimonialBlock

CREATE TABLE IF NOT EXISTS "reviewSubmissions" (
  id SERIAL PRIMARY KEY,
  "authorName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  "reviewText" TEXT NOT NULL,
  company VARCHAR(255),
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_reviewSubmissions_email" ON "reviewSubmissions"(email);
CREATE INDEX IF NOT EXISTS "idx_reviewSubmissions_submittedAt" ON "reviewSubmissions"("submittedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_reviewSubmissions_status" ON "reviewSubmissions"(status);

ALTER TABLE "reviewSubmissions" ENABLE ROW LEVEL SECURITY;

-- Admins can view, update, delete all submissions
CREATE POLICY "Admins can view review submissions" ON "reviewSubmissions"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can update review submissions" ON "reviewSubmissions"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can delete review submissions" ON "reviewSubmissions"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Staff')
    )
  );

-- Anyone can insert (public form)
CREATE POLICY "Anyone can insert review submissions" ON "reviewSubmissions"
  FOR INSERT WITH CHECK (true);

-- Trigger for updatedAt
CREATE OR REPLACE FUNCTION update_review_submissions_updatedat()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_update_reviewSubmissions_updatedAt" ON "reviewSubmissions";
CREATE TRIGGER "trigger_update_reviewSubmissions_updatedAt"
  BEFORE UPDATE ON "reviewSubmissions"
  FOR EACH ROW
  EXECUTE FUNCTION update_review_submissions_updatedat();

COMMENT ON TABLE "reviewSubmissions" IS 'Stores customer reviews from the public review form';
COMMENT ON COLUMN "reviewSubmissions"."authorName" IS 'Display name of the reviewer';
COMMENT ON COLUMN "reviewSubmissions"."reviewText" IS 'The review content';
COMMENT ON COLUMN "reviewSubmissions"."rating" IS 'Star rating 1-5';
COMMENT ON COLUMN "reviewSubmissions"."status" IS 'pending, approved, rejected';
