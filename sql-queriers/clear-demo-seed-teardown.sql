-- =============================================================================
-- Teardown: finance-dashboard demo seed (test jobs + demo clients)
-- =============================================================================
-- Matches scripts/clear-demo-seed-data.mjs and finance-dashboard-demo-seed.sql
--
-- Jobs  → public.projects WHERE title LIKE '[DEMO SEED]%'
-- Clients → profiles + auth.users WHERE email LIKE 'demo-seed-client-%@demo-seed.local'
--
-- Run in Supabase SQL Editor on the target project only.
-- Prefer: node scripts/clear-demo-seed-data.mjs --execute (uses .env credentials)
-- =============================================================================

-- Preview
SELECT 'projects [DEMO SEED]' AS label, count(*)::text AS n
FROM public.projects WHERE title LIKE '[DEMO SEED]%'
UNION ALL
SELECT 'invoices [DEMO SEED]', count(*)::text FROM public.invoices WHERE subject LIKE '[DEMO SEED]%'
UNION ALL
SELECT 'demo clients', count(*)::text
FROM public.profiles WHERE role = 'Client' AND email LIKE 'demo-seed-client-%@demo-seed.local';

-- Uncomment block below to delete (FK-safe order)
/*
DELETE FROM public.payments
WHERE "invoiceId" IN (SELECT id FROM public.invoices WHERE subject LIKE '[DEMO SEED]%');

DELETE FROM public.invoices WHERE subject LIKE '[DEMO SEED]%';

DELETE FROM public.files
WHERE "projectId" IN (SELECT id FROM public.projects WHERE title LIKE '[DEMO SEED]%');

DELETE FROM public."timeEntries"
WHERE "projectId" IN (SELECT id FROM public.projects WHERE title LIKE '[DEMO SEED]%');

DELETE FROM public.punchlist
WHERE "projectId" IN (SELECT id FROM public.projects WHERE title LIKE '[DEMO SEED]%');

DELETE FROM public.discussion
WHERE "projectId" IN (SELECT id FROM public.projects WHERE title LIKE '[DEMO SEED]%');

DELETE FROM public.projects WHERE title LIKE '[DEMO SEED]%';

DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'demo-seed-client-%@demo-seed.local'
);

DELETE FROM auth.users WHERE email LIKE 'demo-seed-client-%@demo-seed.local';

DELETE FROM public.profiles
WHERE email LIKE 'demo-seed-client-%@demo-seed.local';
*/
