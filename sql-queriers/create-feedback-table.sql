-- Create feedback table for user feedback submissions
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  "userId" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'design', 'general')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  subject VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'in-progress', 'completed', 'dismissed')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "adminNotes" TEXT,
  "resolvedBy" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "resolvedAt" TIMESTAMP WITH TIME ZONE
);

-- Create index on userId for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback("userId");

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Create index on createdAt for sorting
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback("createdAt" DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (auth.uid() = "userId" OR anonymous = TRUE);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT
  USING (auth.uid() = "userId" OR anonymous = TRUE);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Policy: Admins can update all feedback
CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Policy: Admins can delete feedback
CREATE POLICY "Admins can delete feedback" ON feedback
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Add comment to table
COMMENT ON TABLE feedback IS 'User feedback submissions for bugs, features, improvements, and general comments';
