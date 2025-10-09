-- Insert Demo Invoices and Line Items
-- This script creates sample invoices and line items for testing

-- First, let's get some existing project IDs to work with
-- We'll create invoices for the first few projects

-- Demo Invoice 1: Fire Sprinkler Design Proposal
INSERT INTO public.invoices (
  project_id,
  subject,
  status,
  invoice_date,
  due_date,
  subtotal,
  tax_rate,
  tax_amount,
  discount_amount,
  total_amount,
  payment_terms,
  notes
) VALUES (
  (SELECT id FROM projects LIMIT 1 OFFSET 0), -- First project
  'Tier I Fire Sprinkler Design and Fire Alarm Design',
  'proposal',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  2500.00,
  0.0625, -- 6.25% tax rate
  156.25,
  0.00,
  2656.25,
  'Net 30',
  'Initial proposal for fire protection system design services.'
);

-- Demo Invoice 2: Fire Alarm System Installation
INSERT INTO public.invoices (
  project_id,
  subject,
  status,
  invoice_date,
  due_date,
  subtotal,
  tax_rate,
  tax_amount,
  discount_amount,
  total_amount,
  payment_terms,
  notes
) VALUES (
  (SELECT id FROM projects LIMIT 1 OFFSET 1), -- Second project (if exists)
  'Fire Alarm System Installation and Testing',
  'draft',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  4750.00,
  0.0625,
  296.88,
  250.00, -- $250 discount
  4796.88,
  'Net 30',
  'Installation and commissioning of fire alarm system components.'
);

-- Demo Invoice 3: Sprinkler System Maintenance
INSERT INTO public.invoices (
  project_id,
  subject,
  status,
  invoice_date,
  due_date,
  sent_at,
  subtotal,
  tax_rate,
  tax_amount,
  discount_amount,
  total_amount,
  payment_terms,
  notes
) VALUES (
  (SELECT id FROM projects LIMIT 1 OFFSET 0), -- Reuse first project
  'Annual Sprinkler System Inspection and Maintenance',
  'sent',
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '20 days',
  CURRENT_DATE - INTERVAL '8 days',
  1850.00,
  0.0625,
  115.63,
  0.00,
  1965.63,
  'Net 30',
  'Annual inspection and maintenance services as per NFPA standards.'
);

-- Now let's add line items for these invoices

-- Line items for Invoice 1 (Fire Sprinkler Design)
INSERT INTO public.invoice_line_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  total_price,
  sortOrder,
  notes
) VALUES 
-- Get the first invoice ID
((SELECT id FROM invoices WHERE subject LIKE '%Tier I Fire Sprinkler Design%' LIMIT 1), 
 'Fire Sprinkler Design - Tier I', 1.000, 1200.00, 1200.00, 1, 
 'Complete fire sprinkler system design including layout and specifications'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Tier I Fire Sprinkler Design%' LIMIT 1),
 'Hydraulic Calculations', 1.000, 450.00, 450.00, 2,
 'Detailed hydraulic calculations for sprinkler system performance'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Tier I Fire Sprinkler Design%' LIMIT 1),
 'Fire Alarm Design - Tier I', 1.000, 650.00, 650.00, 3,
 'Fire alarm system design and device layout'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Tier I Fire Sprinkler Design%' LIMIT 1),
 'Project Narrative and Documentation', 1.000, 200.00, 200.00, 4,
 'Technical documentation and project narrative');

-- Line items for Invoice 2 (Fire Alarm Installation)
INSERT INTO public.invoice_line_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  total_price,
  sortOrder,
  notes
) VALUES
((SELECT id FROM invoices WHERE subject LIKE '%Fire Alarm System Installation%' LIMIT 1),
 'Fire Alarm Control Panel Installation', 1.000, 1800.00, 1800.00, 1,
 'Installation and programming of main fire alarm control panel'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Fire Alarm System Installation%' LIMIT 1),
 'Smoke Detectors', 12.000, 85.00, 1020.00, 2,
 'Installation of photoelectric smoke detectors'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Fire Alarm System Installation%' LIMIT 1),
 'Heat Detectors', 6.000, 95.00, 570.00, 3,
 'Installation of fixed temperature heat detectors'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Fire Alarm System Installation%' LIMIT 1),
 'Manual Pull Stations', 4.000, 120.00, 480.00, 4,
 'Installation of manual fire alarm pull stations'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Fire Alarm System Installation%' LIMIT 1),
 'System Testing and Commissioning', 1.000, 880.00, 880.00, 5,
 'Complete system testing and commissioning per NFPA 72');

-- Line items for Invoice 3 (Maintenance)
INSERT INTO public.invoice_line_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  total_price,
  sortOrder,
  notes
) VALUES
((SELECT id FROM invoices WHERE subject LIKE '%Annual Sprinkler System Inspection%' LIMIT 1),
 'Annual Sprinkler System Inspection', 1.000, 650.00, 650.00, 1,
 'Complete visual inspection of sprinkler system components'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Annual Sprinkler System Inspection%' LIMIT 1),
 'Sprinkler Head Testing', 25.000, 18.00, 450.00, 2,
 'Testing of individual sprinkler heads for proper operation'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Annual Sprinkler System Inspection%' LIMIT 1),
 'Main Drain Test', 1.000, 200.00, 200.00, 3,
 'Main drain flow test and pressure verification'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Annual Sprinkler System Inspection%' LIMIT 1),
 'Valve Inspection and Testing', 8.000, 35.00, 280.00, 4,
 'Inspection and operational testing of control valves'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Annual Sprinkler System Inspection%' LIMIT 1),
 'System Documentation Update', 1.000, 270.00, 270.00, 5,
 'Update system documentation and compliance records');

-- Additional demo invoice for a different scenario
INSERT INTO public.invoices (
  project_id,
  subject,
  status,
  invoice_date,
  due_date,
  sent_at,
  subtotal,
  tax_rate,
  tax_amount,
  discount_amount,
  total_amount,
  payment_terms,
  notes
) VALUES (
  (SELECT id FROM projects LIMIT 1 OFFSET 0), -- First project again
  'Emergency Repairs - Fire Pump System',
  'paid',
  CURRENT_DATE - INTERVAL '45 days',
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE - INTERVAL '43 days',
  3200.00,
  0.0625,
  200.00,
  0.00,
  3400.00,
  'Net 30',
  'Emergency repair services completed. Payment received.'
);

-- Line items for Emergency Repair Invoice
INSERT INTO public.invoice_line_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  total_price,
  sortOrder,
  notes
) VALUES
((SELECT id FROM invoices WHERE subject LIKE '%Emergency Repairs - Fire Pump%' LIMIT 1),
 'Emergency Service Call', 1.000, 250.00, 250.00, 1,
 'After-hours emergency service call'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Emergency Repairs - Fire Pump%' LIMIT 1),
 'Fire Pump Motor Replacement', 1.000, 1800.00, 1800.00, 2,
 'Replacement of damaged fire pump motor'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Emergency Repairs - Fire Pump%' LIMIT 1),
 'Electrical Connection Repair', 1.000, 450.00, 450.00, 3,
 'Repair of damaged electrical connections'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Emergency Repairs - Fire Pump%' LIMIT 1),
 'System Testing and Certification', 1.000, 700.00, 700.00, 4,
 'Complete system testing and certification after repairs');

-- Create one more proposal-type invoice with different services
INSERT INTO public.invoices (
  project_id,
  subject,
  status,
  invoice_date,
  due_date,
  subtotal,
  tax_rate,
  tax_amount,
  discount_amount,
  total_amount,
  payment_terms,
  notes
) VALUES (
  (SELECT id FROM projects LIMIT 1 OFFSET 1), -- Second project if available
  'Kitchen Hood Suppression System Design',
  'proposal',
  CURRENT_DATE + INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '32 days',
  1850.00,
  0.0625,
  115.63,
  100.00, -- Early bird discount
  1865.63,
  'Net 30',
  'Commercial kitchen fire suppression system design and installation proposal.'
);

-- Line items for Kitchen Hood Suppression
INSERT INTO public.invoice_line_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  total_price,
  sortOrder,
  notes
) VALUES
((SELECT id FROM invoices WHERE subject LIKE '%Kitchen Hood Suppression%' LIMIT 1),
 'Hood Suppression System Design', 1.000, 750.00, 750.00, 1,
 'Design of kitchen hood fire suppression system'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Kitchen Hood Suppression%' LIMIT 1),
 'ANSUL System Components', 1.000, 900.00, 900.00, 2,
 'ANSUL R-102 restaurant fire suppression system components'),
 
((SELECT id FROM invoices WHERE subject LIKE '%Kitchen Hood Suppression%' LIMIT 1),
 'Installation and Testing', 1.000, 200.00, 200.00, 3,
 'Professional installation and system commissioning');

-- Display summary of what was created
SELECT 
  'Demo Data Summary' as info,
  COUNT(*) as total_invoices
FROM invoices 
WHERE subject IN (
  'Tier I Fire Sprinkler Design and Fire Alarm Design',
  'Fire Alarm System Installation and Testing', 
  'Annual Sprinkler System Inspection and Maintenance',
  'Emergency Repairs - Fire Pump System',
  'Kitchen Hood Suppression System Design'
);

SELECT 
  'Line Items Created' as info,
  COUNT(*) as total_line_items
FROM invoice_line_items 
WHERE invoice_id IN (
  SELECT id FROM invoices 
  WHERE subject IN (
    'Tier I Fire Sprinkler Design and Fire Alarm Design',
    'Fire Alarm System Installation and Testing', 
    'Annual Sprinkler System Inspection and Maintenance',
    'Emergency Repairs - Fire Pump System',
    'Kitchen Hood Suppression System Design'
  )
);
