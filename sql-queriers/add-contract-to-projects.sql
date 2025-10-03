-- Add contract_html field to projects table
ALTER TABLE projects 
ADD COLUMN contract_html TEXT;

-- Note: No index on contract_html as it can be very large (HTML content)
-- We'll query by project ID instead, which is already indexed

-- Add comment for documentation
COMMENT ON COLUMN projects.contract_html IS 'Custom contract HTML content for this project. If NULL, uses default template.';
