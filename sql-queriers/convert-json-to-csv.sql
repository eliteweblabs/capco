-- =====================================================
-- CONVERT JSON TO CSV FOR IMPORT
-- =====================================================
-- Run this query in PRODUCTION to generate CSV
-- Copy the result and import into DEV database

WITH json_data AS (
  SELECT 
    (data->0->'json_agg')::jsonb AS statuses_array
  FROM (
    SELECT '[
  {
    "json_agg": [
      {
        "id": 0,
        "statusCode": 0,
        "adminStatusName": "New Project",
        "clientEmailContent": "",
        "estTime": null,
        "createdAt": "2025-08-28T00:19:01.082515+00:00",
        "updatedAt": "2025-08-28T00:19:01.082515+00:00",
        "buttonText": null,
        "clientEmailSubject": "New Project Started → {{CLIENT_NAME}}",
        "modalAdmin": null,
        "modalClient": null,
        "buttonLink": "/dashboard",
        "clientStatusAction": null,
        "modalAutoRedirectClient": "",
        "adminEmailContent": "",
        "adminEmailSubject": "",
        "modalAutoRedirectAdmin": "",
        "clientStatusName": "New Project",
        "statusColor": null,
        "adminStatusAction": null,
        "status": "In Progress",
        "emailToRoles": null,
        "nagEmailClient": null,
        "adminStatusTab": "project",
        "clientStatusTab": null
      }
      -- ... rest of your JSON data ...
    ]
  }
]'::jsonb AS data
  ) AS raw_data
),
expanded_rows AS (
  SELECT jsonb_array_elements(statuses_array) AS row_data
  FROM json_data
)
SELECT 
  (row_data->>'statusCode')::text AS "statusCode",
  COALESCE(row_data->>'status', '') AS status,
  COALESCE(row_data->>'statusColor', '') AS "statusColor",
  COALESCE(row_data->>'adminStatusName', '') AS "adminStatusName",
  COALESCE(row_data->>'adminStatusSlug', '') AS "adminStatusSlug",
  COALESCE(row_data->>'adminStatusTab', '') AS "adminStatusTab",
  COALESCE(row_data->>'adminStatusAction', '') AS "adminStatusAction",
  COALESCE(row_data->>'adminEmailSubject', '') AS "adminEmailSubject",
  COALESCE(row_data->>'adminEmailContent', '') AS "adminEmailContent",
  COALESCE(row_data->>'clientStatusName', '') AS "clientStatusName",
  COALESCE(row_data->>'clientStatusSlug', '') AS "clientStatusSlug",
  COALESCE(row_data->>'clientStatusTab', '') AS "clientStatusTab",
  COALESCE(row_data->>'clientStatusAction', '') AS "clientStatusAction",
  COALESCE(row_data->>'clientEmailSubject', '') AS "clientEmailSubject",
  COALESCE(row_data->>'clientEmailContent', '') AS "clientEmailContent",
  COALESCE(row_data->>'emailToRoles', '[]') AS "emailToRoles",
  COALESCE((row_data->>'adminVisible')::text, 'true') AS "adminVisible",
  COALESCE((row_data->>'clientVisible')::text, 'true') AS "clientVisible",
  COALESCE(row_data->>'estTime', '') AS "estTime",
  COALESCE(row_data->>'buttonText', '') AS "buttonText",
  COALESCE(row_data->>'buttonLink', '') AS "buttonLink",
  COALESCE(row_data->>'modalAdmin', '') AS "modalAdmin",
  COALESCE(row_data->>'modalClient', '') AS "modalClient",
  COALESCE(row_data->>'modalAutoRedirectAdmin', '') AS "modalAutoRedirectAdmin",
  COALESCE(row_data->>'modalAutoRedirectClient', '') AS "modalAutoRedirectClient",
  COALESCE(row_data->>'createdAt', '') AS "createdAt",
  COALESCE(row_data->>'updatedAt', '') AS "updatedAt"
FROM expanded_rows
ORDER BY (row_data->>'statusCode')::integer;
