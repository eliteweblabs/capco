-- =====================================================
-- LINE ITEMS CATALOG SETUP
-- Creates a reusable catalog of line items for invoices and proposals
-- =====================================================

-- Create line_items_catalog table for reusable line items
CREATE TABLE IF NOT EXISTS line_items_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_line_items_catalog_name ON line_items_catalog(name);
CREATE INDEX IF NOT EXISTS idx_line_items_catalog_category ON line_items_catalog(category);
CREATE INDEX IF NOT EXISTS idx_line_items_catalog_active ON line_items_catalog(is_active);

-- Enable RLS on line_items_catalog
ALTER TABLE line_items_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for line_items_catalog
-- Allow all authenticated users to read active catalog items
CREATE POLICY "Users can view active catalog items" ON line_items_catalog
FOR SELECT USING (
  auth.uid() IS NOT NULL AND is_active = true
);

-- Allow admins to manage all catalog items
CREATE POLICY "Admins can manage catalog items" ON line_items_catalog
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow users to create catalog items (they become available for everyone)
CREATE POLICY "Users can create catalog items" ON line_items_catalog
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Insert some default line items
INSERT INTO line_items_catalog (name, description, unit_price, category) VALUES
('Fire Alarm System Design', 'Complete fire alarm system design and engineering for commercial building', 2500.00, 'Design Services'),
('Sprinkler System Design', 'Automatic sprinkler system design and hydraulic calculations', 3500.00, 'Design Services'),
('Fire Pump Design', 'Fire pump sizing, specification, and installation design', 1500.00, 'Design Services'),
('Code Compliance Review', 'Building code compliance review and analysis', 800.00, 'Consulting'),
('Plan Review Services', 'Architectural plan review for fire protection compliance', 600.00, 'Consulting'),
('Site Inspection', 'On-site fire protection system inspection and testing', 400.00, 'Inspection'),
('System Testing', 'Fire protection system commissioning and testing', 750.00, 'Testing'),
('Emergency Lighting Design', 'Emergency and exit lighting system design', 900.00, 'Design Services'),
('Fire Extinguisher Plan', 'Portable fire extinguisher location and specification plan', 300.00, 'Safety Equipment'),
('Knox Box Installation', 'Knox box specification and installation coordination', 200.00, 'Safety Equipment')
ON CONFLICT DO NOTHING;

-- Add a reference field to track catalog source in existing invoice_line_items
-- This allows us to track which items came from the catalog
ALTER TABLE invoice_line_items 
ADD COLUMN IF NOT EXISTS catalog_item_id INTEGER REFERENCES line_items_catalog(id);

-- Create an index on the new foreign key
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_catalog_id ON invoice_line_items(catalog_item_id);

-- Create a view for frequently used catalog items
CREATE OR REPLACE VIEW popular_catalog_items AS
SELECT 
  c.*,
  COUNT(ili.id) as usage_count
FROM line_items_catalog c
LEFT JOIN invoice_line_items ili ON c.id = ili.catalog_item_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.description, c.unit_price, c.category, c.is_active, c.created_at, c.updated_at, c.created_by
ORDER BY usage_count DESC, c.name ASC;

-- Function to create line item from catalog
CREATE OR REPLACE FUNCTION create_line_item_from_catalog(
  p_invoice_id INTEGER,
  p_catalog_item_id INTEGER,
  p_quantity DECIMAL DEFAULT 1.0,
  p_custom_description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_catalog_item line_items_catalog%ROWTYPE;
  v_line_item_id INTEGER;
  v_description TEXT;
  v_total_price DECIMAL;
BEGIN
  -- Get catalog item
  SELECT * INTO v_catalog_item
  FROM line_items_catalog
  WHERE id = p_catalog_item_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catalog item not found or inactive';
  END IF;
  
  -- Use custom description if provided, otherwise use catalog description
  v_description := COALESCE(p_custom_description, v_catalog_item.description);
  v_total_price := p_quantity * v_catalog_item.unit_price;
  
  -- Create line item
  INSERT INTO invoice_line_items (
    invoice_id,
    description,
    quantity,
    unit_price,
    total_price,
    catalog_item_id,
    sortOrder
  )
  VALUES (
    p_invoice_id,
    v_description,
    p_quantity,
    v_catalog_item.unit_price,
    v_total_price,
    p_catalog_item_id,
    (SELECT COALESCE(MAX(sortOrder), 0) + 1 FROM invoice_line_items WHERE invoice_id = p_invoice_id)
  )
  RETURNING id INTO v_line_item_id;
  
  RETURN v_line_item_id;
END;
$$;

-- Function to search catalog items
CREATE OR REPLACE FUNCTION search_catalog_items(
  p_search_term TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id INTEGER,
  name VARCHAR(255),
  description TEXT,
  unit_price DECIMAL(10,2),
  category VARCHAR(100),
  usage_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.unit_price,
    c.category,
    COUNT(ili.id) as usage_count
  FROM line_items_catalog c
  LEFT JOIN invoice_line_items ili ON c.id = ili.catalog_item_id
  WHERE 
    c.is_active = true
    AND (p_search_term IS NULL OR 
         c.name ILIKE '%' || p_search_term || '%' OR 
         c.description ILIKE '%' || p_search_term || '%')
    AND (p_category IS NULL OR c.category = p_category)
  GROUP BY c.id, c.name, c.description, c.unit_price, c.category
  ORDER BY usage_count DESC, c.name ASC
  LIMIT p_limit;
END;
$$;

-- Update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_line_items_catalog_updated_at 
  BEFORE UPDATE ON line_items_catalog 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT 'Line items catalog setup complete!' as status;

-- Show available categories
SELECT DISTINCT category FROM line_items_catalog WHERE is_active = true ORDER BY category;

-- Show sample catalog items
SELECT id, name, unit_price, category FROM line_items_catalog WHERE is_active = true ORDER BY category, name LIMIT 10;
