-- Gmail OAuth Tokens Table
CREATE TABLE IF NOT EXISTS gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT[] NOT NULL,
  email_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Email Preferences Table
CREATE TABLE IF NOT EXISTS email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vip_senders TEXT[] DEFAULT '{}',
  blocked_senders TEXT[] DEFAULT '{}',
  announce_all BOOLEAN DEFAULT FALSE,
  urgent_keywords TEXT[] DEFAULT ARRAY['urgent', 'asap', 'important', 'critical', 'immediate'],
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Check History (for tracking last check time)
CREATE TABLE IF NOT EXISTS email_check_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emails_found INTEGER DEFAULT 0,
  important_emails_found INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON gmail_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_check_history_user_id ON email_check_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_check_history_last_check ON email_check_history(last_check_at);

-- RLS Policies
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_check_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "Users can view own gmail tokens" ON gmail_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gmail tokens" ON gmail_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gmail tokens" ON gmail_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gmail tokens" ON gmail_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Users can manage their own preferences
CREATE POLICY "Users can view own email preferences" ON email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences" ON email_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences" ON email_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own check history
CREATE POLICY "Users can view own check history" ON email_check_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check history" ON email_check_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE gmail_tokens IS 'Stores Gmail OAuth tokens for each user';
COMMENT ON TABLE email_preferences IS 'User preferences for email notifications and filtering';
COMMENT ON TABLE email_check_history IS 'History of email checks for tracking last check timestamp';
