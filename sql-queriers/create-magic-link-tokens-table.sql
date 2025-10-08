-- Create magicLinkTokens table for custom magic link system
CREATE TABLE IF NOT EXISTS magicLinkTokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  redirectTo VARCHAR(500),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usedAt TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_magicLinkTokens_token ON magicLinkTokens(token);
CREATE INDEX IF NOT EXISTS idx_magicLinkTokens_email ON magicLinkTokens(email);
CREATE INDEX IF NOT EXISTS idx_magicLinkTokens_expiresAt ON magicLinkTokens(expiresAt);

-- Add RLS policy (only admins can access)
ALTER TABLE magicLinkTokens ENABLE ROW LEVEL SECURITY;

-- Policy for admins to access all tokens
CREATE POLICY "Admins can access all magic link tokens" ON magicLinkTokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Clean up expired tokens (run this periodically)
-- DELETE FROM magic_link_tokens WHERE expires_at < NOW();
