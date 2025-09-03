-- Insert Demo Line Items Catalog
-- This script creates reusable line items in the catalog for fire protection services

-- Fire Sprinkler Design Services
INSERT INTO public.line_items_catalog (
  name,
  description,
  unit_price,
  category,
  is_active
) VALUES
('Fire Sprinkler Design - Tier I', 'Complete fire sprinkler system design including layout, specifications, and NFPA compliance documentation', 1200.00, 'Design Services', true),
('Fire Sprinkler Design - Tier II', 'Advanced fire sprinkler system design for complex buildings with multiple zones and special hazards', 1800.00, 'Design Services', true),
('Hydraulic Calculations', 'Detailed hydraulic calculations for sprinkler system performance verification and code compliance', 450.00, 'Design Services', true),
('NFPA 241 Construction Plan', 'Fire protection plan for construction activities per NFPA 241 standards', 350.00, 'Design Services', true);

-- Fire Alarm Design Services  
INSERT INTO public.line_items_catalog (
  name,
  description,
  unit_price,
  category,
  is_active
) VALUES
('Fire Alarm Design - Tier I', 'Fire alarm system design and device layout for standard commercial buildings', 650.00, 'Design Services', true),
('Fire Alarm Design - Tier II', 'Advanced fire alarm system design for high-rise buildings and complex occupancies', 950.00, 'Design Services', true),
('Fire Alarm Narrative', 'Technical documentation and system operation narrative per NFPA 72', 200.00, 'Design Services', true),
('Mass Notification System Design', 'Emergency mass notification system design and integration', 800.00, 'Design Services', true);

-- Installation Services
INSERT INTO public.line_items_catalog (
  name,
  description,
  unit_price,
  category,
  is_active
) VALUES
('Fire Alarm Control Panel Installation', 'Installation and programming of fire alarm control panel', 1800.00, 'Installation', true),
('Smoke Detector Installation', 'Installation of photoelectric smoke detectors (per unit)', 85.00, 'Installation', true),
('Heat Detector Installation', 'Installation of fixed temperature heat detectors (per unit)', 95.00, 'Installation', true),
('Manual Pull Station Installation', 'Installation of manual fire alarm pull stations (per unit)', 120.00, 'Installation', true),
('Sprinkler Head Installation', 'Installation of fire sprinkler heads (per unit)', 45.00, 'Installation', true);

-- Testing and Commissioning
INSERT INTO public.line_items_catalog (
  name,
  description,
  unit_price,
  category,
  is_active
) VALUES
('System Testing and Commissioning', 'Complete system testing and commissioning per NFPA standards', 880.00, 'Testing', true),
('Fire Pump Testing', 'Annual fire pump flow test and performance verification', 450.00, 'Testing', true),
('Main Drain Test', 'Main drain flow test and pressure verification', 200.00, 'Testing', true),
('Sprinkler Head Testing', 'Individual sprinkler head testing and verification (per unit)', 18.00, 'Testing', true);

-- Maintenance Services
INSERT INTO public.line_items_catalog (
  name,
  description,
  unit_price,
  category,
  is_active
) VALUES
('Annual Sprinkler System Inspection', 'Complete visual inspection of sprinkler system components per NFPA 25', 650.00, 'Maintenance', true),
('Quarterly Fire Alarm Testing', 'Quarterly fire alarm system testing and documentation', 320.00, 'Maintenance', true),
('Valve Inspection and Testing', 'Inspection and operational testing of control valves (per valve)', 35.00, 'Maintenance', true),
('Emergency Service Call', 'After-hours emergency service call', 250.00, 'Emergency', true);

-- Equipment and Components
INSERT INTO public.line_items_catalog (
  name,
  description,
  unit_price,
  category,
  is_active
) VALUES
('Fire Pump Motor Replacement', 'Replacement of fire pump motor with installation', 1800.00, 'Equipment', true),
('ANSUL R-102 System', 'ANSUL R-102 restaurant fire suppression system components', 900.00, 'Equipment', true),
('Fire Alarm Control Panel', 'Addressable fire alarm control panel (equipment only)', 2200.00, 'Equipment', true),
('Kitchen Hood Suppression System', 'Complete kitchen hood fire suppression system', 1500.00, 'Equipment', true);

-- Specialty Services
INSERT INTO public.line_items_catalog (
  name,
  description,
  unit_price,
  category,
  is_active
) VALUES
('Hood Suppression System Design', 'Commercial kitchen hood fire suppression system design', 750.00, 'Design Services', true),
('Clean Agent System Design', 'Clean agent fire suppression system design for server rooms and archives', 1200.00, 'Design Services', true),
('Fire Pump Room Design', 'Fire pump room layout and equipment specifications', 600.00, 'Design Services', true),
('System Documentation Update', 'Update system documentation and compliance records', 270.00, 'Documentation', true);

-- Consultation and Project Management
INSERT INTO public.line_items_catalog (
  name,
  description,
  unit_price,
  category,
  is_active
) VALUES
('Fire Protection Consultation', 'Fire protection engineering consultation (per hour)', 150.00, 'Consultation', true),
('Project Management', 'Project management and coordination services (per hour)', 125.00, 'Project Management', true),
('Code Review and Analysis', 'Building code review and fire protection requirements analysis', 400.00, 'Consultation', true),
('Construction Administration', 'Construction administration and inspection services', 180.00, 'Project Management', true);

-- Display summary
SELECT 
  category,
  COUNT(*) as item_count,
  AVG(unit_price) as avg_price,
  MIN(unit_price) as min_price,
  MAX(unit_price) as max_price
FROM line_items_catalog 
WHERE is_active = true
GROUP BY category
ORDER BY category;
