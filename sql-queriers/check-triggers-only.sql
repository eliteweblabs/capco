-- Check triggers only
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name ILIKE '%projectid%' OR trigger_name ILIKE '%project_id%';
