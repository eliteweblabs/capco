-- Create Ninja Invoice integration tables
-- This script sets up the necessary tables for Ninja Invoice integration

-- Table to store references to Ninja Invoice invoices
CREATE TABLE IF NOT EXISTS ninja_invoice_references (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ninja_invoice_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invoice_data JSONB,
    ninja_invoice_url TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(project_id, ninja_invoice_id),
    CHECK (status IN ('created', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'))
);

-- Table to store Ninja Invoice webhook events
CREATE TABLE IF NOT EXISTS ninja_invoice_webhooks (
    id SERIAL PRIMARY KEY,
    ninja_invoice_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Table to store Ninja Invoice settings
CREATE TABLE IF NOT EXISTS ninja_invoice_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO ninja_invoice_settings (setting_key, setting_value, description) VALUES
('api_url', 'https://ninja-invoice.com/api', 'Ninja Invoice API base URL'),
('webhook_url', '', 'Webhook URL for Ninja Invoice events'),
('default_currency', 'USD', 'Default currency for invoices'),
('default_tax_rate', '0.08', 'Default tax rate (8%)'),
('invoice_prefix', 'CAPCO-', 'Prefix for invoice numbers'),
('auto_send', 'false', 'Automatically send invoices when created')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ninja_invoice_refs_project_id ON ninja_invoice_references(project_id);
CREATE INDEX IF NOT EXISTS idx_ninja_invoice_refs_ninja_id ON ninja_invoice_references(ninja_invoice_id);
CREATE INDEX IF NOT EXISTS idx_ninja_invoice_refs_status ON ninja_invoice_references(status);
CREATE INDEX IF NOT EXISTS idx_ninja_invoice_webhooks_ninja_id ON ninja_invoice_webhooks(ninja_invoice_id);
CREATE INDEX IF NOT EXISTS idx_ninja_invoice_webhooks_processed ON ninja_invoice_webhooks(processed);

-- RLS Policies for ninja_invoice_references
ALTER TABLE ninja_invoice_references ENABLE ROW LEVEL SECURITY;

-- Admins can see all invoice references
CREATE POLICY "Admins can view all ninja invoice references" ON ninja_invoice_references
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Admin'
        )
    );

-- Users can see their own invoice references
CREATE POLICY "Users can view their own ninja invoice references" ON ninja_invoice_references
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = ninja_invoice_references.project_id 
            AND projects.author_id = auth.uid()
        )
    );

-- Only admins can insert/update/delete invoice references
CREATE POLICY "Admins can manage ninja invoice references" ON ninja_invoice_references
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Admin'
        )
    );

-- RLS Policies for ninja_invoice_webhooks
ALTER TABLE ninja_invoice_webhooks ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view ninja invoice webhooks" ON ninja_invoice_webhooks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Admin'
        )
    );

-- RLS Policies for ninja_invoice_settings
ALTER TABLE ninja_invoice_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage ninja invoice settings" ON ninja_invoice_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ninja_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ninja_invoice_references
CREATE TRIGGER update_ninja_invoice_references_updated_at
    BEFORE UPDATE ON ninja_invoice_references
    FOR EACH ROW
    EXECUTE FUNCTION update_ninja_invoice_updated_at();

-- Create trigger for ninja_invoice_settings
CREATE TRIGGER update_ninja_invoice_settings_updated_at
    BEFORE UPDATE ON ninja_invoice_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_ninja_invoice_updated_at();
