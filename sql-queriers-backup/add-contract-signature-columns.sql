-- Add contract signature columns to projects table
-- Run this in Supabase SQL Editor if the columns don't exist

-- Add proposal_signature column (stores base64 signature data)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS proposal_signature TEXT;

-- Add signed_at column (stores timestamp when contract was signed)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- Add contract_pdf_url column (stores URL to generated contract PDF)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS contract_pdf_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN projects.proposal_signature IS 'Base64 encoded digital signature data';
COMMENT ON COLUMN projects.signed_at IS 'Timestamp when the contract was signed';
COMMENT ON COLUMN projects.contract_pdf_url IS 'URL to the generated contract PDF file';
