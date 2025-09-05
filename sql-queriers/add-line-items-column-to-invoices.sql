-- Add line_items JSON column to invoices table
-- This allows storing line items directly in the invoice record

-- Add the line_items column as JSONB for better performance
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;

-- Add an index on the line_items column for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_line_items ON invoices USING GIN (line_items);

-- Add a comment to document the column
COMMENT ON COLUMN invoices.line_items IS 'JSON array of line items for this invoice/proposal';

-- Update the recalculate_invoice_totals function to work with JSON line items
CREATE OR REPLACE FUNCTION recalculate_invoice_totals_from_json()
RETURNS TRIGGER AS $$
DECLARE
    line_items_total DECIMAL(10,2) := 0;
    item_total DECIMAL(10,2);
    line_item JSONB;
BEGIN
    -- Calculate total from JSON line items
    IF NEW.line_items IS NOT NULL THEN
        FOR line_item IN SELECT * FROM jsonb_array_elements(NEW.line_items)
        LOOP
            item_total := COALESCE((line_item->>'quantity')::DECIMAL, 0) * 
                         COALESCE((line_item->>'unit_price')::DECIMAL, 0);
            line_items_total := line_items_total + item_total;
        END LOOP;
    END IF;
    
    -- Update invoice totals
    UPDATE invoices 
    SET 
        subtotal = line_items_total,
        tax_amount = ROUND(line_items_total * COALESCE(NEW.tax_rate, 0), 2),
        total_amount = ROUND(line_items_total * (1 + COALESCE(NEW.tax_rate, 0)) - COALESCE(NEW.discount_amount, 0), 2),
        updated_at = now()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-recalculate totals when line_items JSON is updated
DROP TRIGGER IF EXISTS recalculate_totals_on_line_items_json ON invoices;
CREATE TRIGGER recalculate_totals_on_line_items_json
    AFTER UPDATE OF line_items ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_invoice_totals_from_json();
