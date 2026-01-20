-- =====================================================
-- SIMPLE EXPORT: Copy ALL projectStatuses rows
-- =====================================================
-- Run this in PRODUCTION database, copy the result, paste into DEV database
-- Handles ALL columns automatically (camelCase)

-- Option 1: Get all data as JSON (easiest to copy)
SELECT json_agg(row_to_json(t)) 
FROM (
  SELECT * FROM "projectStatuses" WHERE "statusCode" IS NOT NULL ORDER BY "statusCode"
) t;

-- Option 2: Generate INSERT statements (paste directly into dev)
SELECT 
  'INSERT INTO "projectStatuses" SELECT ' ||
  string_agg(
    format(
      '%s, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L',
      "statusCode",
      status,
      "statusColor",
      "adminStatusName",
      "adminStatusSlug",
      "adminStatusTab",
      "adminStatusAction",
      "adminEmailSubject",
      "adminEmailContent",
      "clientStatusName",
      "clientStatusSlug",
      "clientStatusTab",
      "clientStatusAction",
      "clientEmailSubject",
      "clientEmailContent",
      COALESCE("emailToRoles"::text, 'NULL'),
      "adminVisible",
      "clientVisible",
      "estTime",
      "buttonText",
      "buttonLink",
      "modalAdmin",
      "modalClient",
      "modalAutoRedirectAdmin",
      "modalAutoRedirectClient",
      "createdAt",
      "updatedAt"
    ),
    E' UNION ALL SELECT '
    ORDER BY "statusCode"
  ) || 
  E' ON CONFLICT ("statusCode") DO UPDATE SET\n' ||
  'status = EXCLUDED.status, ' ||
  '"statusColor" = EXCLUDED."statusColor", ' ||
  '"adminStatusName" = EXCLUDED."adminStatusName", ' ||
  '"adminStatusSlug" = EXCLUDED."adminStatusSlug", ' ||
  '"adminStatusTab" = EXCLUDED."adminStatusTab", ' ||
  '"adminStatusAction" = EXCLUDED."adminStatusAction", ' ||
  '"adminEmailSubject" = EXCLUDED."adminEmailSubject", ' ||
  '"adminEmailContent" = EXCLUDED."adminEmailContent", ' ||
  '"clientStatusName" = EXCLUDED."clientStatusName", ' ||
  '"clientStatusSlug" = EXCLUDED."clientStatusSlug", ' ||
  '"clientStatusTab" = EXCLUDED."clientStatusTab", ' ||
  '"clientStatusAction" = EXCLUDED."clientStatusAction", ' ||
  '"clientEmailSubject" = EXCLUDED."clientEmailSubject", ' ||
  '"clientEmailContent" = EXCLUDED."clientEmailContent", ' ||
  '"emailToRoles" = EXCLUDED."emailToRoles", ' ||
  '"adminVisible" = EXCLUDED."adminVisible", ' ||
  '"clientVisible" = EXCLUDED."clientVisible", ' ||
  '"estTime" = EXCLUDED."estTime", ' ||
  '"buttonText" = EXCLUDED."buttonText", ' ||
  '"buttonLink" = EXCLUDED."buttonLink", ' ||
  '"modalAdmin" = EXCLUDED."modalAdmin", ' ||
  '"modalClient" = EXCLUDED."modalClient", ' ||
  '"modalAutoRedirectAdmin" = EXCLUDED."modalAutoRedirectAdmin", ' ||
  '"modalAutoRedirectClient" = EXCLUDED."modalAutoRedirectClient", ' ||
  '"createdAt" = EXCLUDED."createdAt", ' ||
  '"updatedAt" = EXCLUDED."updatedAt";' AS export_sql
FROM "projectStatuses"
WHERE "statusCode" IS NOT NULL;
