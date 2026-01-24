-- Create newsletters table for managing recurring email campaigns
-- Similar structure to bannerAlerts but for email delivery

CREATE TABLE IF NOT EXISTS newsletters (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL, -- Admin reference title
  subject TEXT NOT NULL, -- Email subject line
  content TEXT NOT NULL, -- Email body content (supports markdown/html)
  
  -- Recipient targeting
  recipientType TEXT NOT NULL DEFAULT 'all', -- 'all', 'staff', 'client', 'admin', 'custom'
  customRecipients TEXT[], -- Array of user IDs for custom targeting
  
  -- Status & scheduling
  isActive BOOLEAN DEFAULT true,
  isDraft BOOLEAN DEFAULT true, -- True = draft, False = can be sent
  scheduledFor TIMESTAMP WITH TIME ZONE, -- When to send (NULL = send immediately)
  isScheduled BOOLEAN DEFAULT false, -- True if scheduled for future send
  
  -- Delivery options
  deliverViaEmail BOOLEAN DEFAULT true,
  deliverViaSms BOOLEAN DEFAULT false,
  
  -- Metadata
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lastSentAt TIMESTAMP WITH TIME ZONE,
  sentCount INTEGER DEFAULT 0
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_newsletters_active ON newsletters(isActive);
CREATE INDEX IF NOT EXISTS idx_newsletters_recipient_type ON newsletters(recipientType);
CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled ON newsletters(isScheduled, scheduledFor) WHERE isScheduled = true;

-- Enable RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view/manage newsletters
CREATE POLICY "Admins can manage newsletters"
  ON newsletters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );
