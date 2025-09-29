-- Add catalog_line_items column to invoices table
-- This stores complete line item information (ID, quantity, unit_price) to preserve pricing
-- when catalog prices change

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS catalog_line_items JSONB DEFAULT '[]'::JSONB;

-- Add GIN index for efficient querying of JSONB data
CREATE INDEX IF NOT EXISTS idx_invoices_catalog_line_items 
ON public.invoices USING GIN (catalog_line_items);

-- Add comment explaining the column
COMMENT ON COLUMN public.invoices.catalog_line_items IS 'Stores complete line item data including catalog_item_id, quantity, unit_price, description, and details to preserve pricing when catalog prices change';
