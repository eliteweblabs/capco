-- Insert Demo Bookings for Testing
-- This script creates sample demo bookings to populate the system

-- Demo Booking 1: Fire Alarm System Demo
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Sarah Johnson',
  'sarah.johnson@techcorp.com',
  'TechCorp Solutions',
  '(555) 123-4567',
  'We are looking to upgrade our fire alarm system for our new office building. We need a comprehensive solution that can handle 50+ devices and integrate with our building management system.',
  CURRENT_DATE + INTERVAL '3 days',
  '10:00 AM',
  'pending',
  CURRENT_DATE - INTERVAL '2 days',
  'High priority - new building construction'
);

-- Demo Booking 2: Sprinkler System Consultation
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Michael Rodriguez',
  'mrodriguez@manufacturingplus.com',
  'Manufacturing Plus Inc',
  '(555) 234-5678',
  'Our current sprinkler system is outdated and we need to ensure compliance with new NFPA standards. Looking for a complete system redesign.',
  CURRENT_DATE + INTERVAL '5 days',
  '2:00 PM',
  'confirmed',
  CURRENT_DATE - INTERVAL '1 day',
  'Confirmed for 2:00 PM - large industrial facility'
);

-- Demo Booking 3: Emergency Systems Demo
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Jennifer Chen',
  'j.chen@healthcaregroup.org',
  'Healthcare Group',
  '(555) 345-6789',
  'We are building a new medical facility and need emergency lighting and fire protection systems that meet healthcare facility requirements.',
  CURRENT_DATE + INTERVAL '7 days',
  '9:30 AM',
  'pending',
  CURRENT_DATE - INTERVAL '3 hours',
  'Healthcare facility - special requirements'
);

-- Demo Booking 4: Restaurant Fire Suppression
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'David Thompson',
  'david@thompsonrestaurants.com',
  'Thompson Restaurant Group',
  '(555) 456-7890',
  'Opening a new restaurant location and need kitchen hood suppression system. Also interested in general fire protection for the dining area.',
  CURRENT_DATE + INTERVAL '10 days',
  '11:00 AM',
  'pending',
  CURRENT_DATE - INTERVAL '1 day',
  'Restaurant chain - multiple locations'
);

-- Demo Booking 5: Warehouse Fire Protection
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Lisa Wang',
  'lisa.wang@logisticspro.com',
  'Logistics Pro',
  '(555) 567-8901',
  'We have a 100,000 sq ft warehouse that needs comprehensive fire protection. Current system is inadequate for our storage requirements.',
  CURRENT_DATE + INTERVAL '12 days',
  '1:30 PM',
  'confirmed',
  CURRENT_DATE - INTERVAL '4 days',
  'Large warehouse - high-value inventory'
);

-- Demo Booking 6: Office Building Retrofit
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Robert Martinez',
  'robert@metroproperties.com',
  'Metro Properties',
  '(555) 678-9012',
  'We own several office buildings and need to retrofit fire alarm systems to meet current code requirements. Looking for a scalable solution.',
  CURRENT_DATE + INTERVAL '14 days',
  '3:00 PM',
  'pending',
  CURRENT_DATE - INTERVAL '2 days',
  'Property management company'
);

-- Demo Booking 7: School District Project
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Amanda Foster',
  'afoster@schools.edu',
  'Riverside School District',
  '(555) 789-0123',
  'Our school district is planning to upgrade fire protection systems across 8 buildings. Need a comprehensive solution that meets educational facility standards.',
  CURRENT_DATE + INTERVAL '16 days',
  '10:30 AM',
  'pending',
  CURRENT_DATE - INTERVAL '1 day',
  'School district - multiple buildings'
);

-- Demo Booking 8: Hotel Fire Safety
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'James Wilson',
  'jwilson@grandhotel.com',
  'Grand Hotel Group',
  '(555) 890-1234',
  'We are renovating our historic hotel and need to upgrade the fire protection system while maintaining the building''s architectural integrity.',
  CURRENT_DATE + INTERVAL '18 days',
  '2:30 PM',
  'confirmed',
  CURRENT_DATE - INTERVAL '3 days',
  'Historic hotel - preservation requirements'
);

-- Demo Booking 9: Data Center Protection
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Patricia Lee',
  'patricia@datacentertech.com',
  'Data Center Technologies',
  '(555) 901-2345',
  'Our data center requires specialized fire suppression systems that won''t damage sensitive equipment. Need clean agent systems and early detection.',
  CURRENT_DATE + INTERVAL '20 days',
  '9:00 AM',
  'pending',
  CURRENT_DATE - INTERVAL '5 hours',
  'Data center - clean agent systems required'
);

-- Demo Booking 10: Retail Chain Upgrade
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Christopher Brown',
  'cbrown@retailchain.com',
  'Metro Retail Chain',
  '(555) 012-3456',
  'We have 15 retail locations that need fire alarm system upgrades. Looking for a standardized solution that can be deployed across all locations.',
  CURRENT_DATE + INTERVAL '22 days',
  '11:30 AM',
  'pending',
  CURRENT_DATE - INTERVAL '1 day',
  'Retail chain - standardized solution needed'
);

-- Demo Booking 11: Completed Demo (for testing)
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  confirmed_at,
  completed_at,
  notes
) VALUES (
  'Maria Garcia',
  'maria@constructionfirm.com',
  'Garcia Construction',
  '(555) 123-9876',
  'Demo completed successfully. Customer was very interested in our fire alarm solutions for their new construction project.',
  CURRENT_DATE - INTERVAL '5 days',
  '10:00 AM',
  'completed',
  CURRENT_DATE - INTERVAL '8 days',
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE - INTERVAL '5 days',
  'Demo completed - follow up scheduled'
);

-- Demo Booking 12: Cancelled Demo
INSERT INTO public.demo_bookings (
  name,
  email,
  company,
  phone,
  message,
  preferred_date,
  preferred_time,
  status,
  created_at,
  notes
) VALUES (
  'Thomas Anderson',
  'tanderson@oldcompany.com',
  'Old Company LLC',
  '(555) 987-6543',
  'Customer cancelled due to budget constraints. May reschedule in Q2.',
  CURRENT_DATE - INTERVAL '3 days',
  '2:00 PM',
  'cancelled',
  CURRENT_DATE - INTERVAL '7 days',
  'Cancelled - budget issues'
);

-- Display summary of demo bookings created
SELECT 
  'Demo Bookings Summary' as info,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
FROM demo_bookings;

-- Show upcoming bookings
SELECT 
  'Upcoming Bookings' as info,
  name,
  company,
  preferred_date,
  preferred_time,
  status
FROM demo_bookings 
WHERE preferred_date >= CURRENT_DATE 
  AND status IN ('pending', 'confirmed')
ORDER BY preferred_date, preferred_time;
