# Import Statuses from JSON Data

You have the JSON data from Option 1 export. Here's how to import it:

## Quick Steps

1. **Open the import script**: `sql-queriers/import-statuses-from-json.sql`

2. **Replace the placeholder JSON** in the script:
   - Find the line: `SELECT '[...]'::jsonb AS data`
   - Replace `[...]` with your actual JSON array from production

3. **Run the script** in your DEVELOPMENT Supabase SQL Editor

## Example

If your JSON looks like this:
```json
[
  {"statusCode": 10, "status": "Project Created", "statusColor": "#3b82f6", ...},
  {"statusCode": 20, "status": "Under Review", "statusColor": "#f59e0b", ...}
]
```

Replace this line in the script:
```sql
SELECT '[
  {"statusCode": 10, "status": "Project Created", "statusColor": "#3b82f6", ...},
  ...
]'::jsonb AS data
```

With your actual JSON:
```sql
SELECT '[{"statusCode": 10, "status": "Project Created", ...}, {"statusCode": 20, ...}]'::jsonb AS data
```

## Alternative: Use Node.js Script

If you prefer, I can create a Node.js script that reads your JSON file and generates the INSERT statements. Just let me know!

## Verify After Import

Run this to verify:
```sql
SELECT COUNT(*) FROM "projectStatuses";
SELECT "statusCode", status, "adminStatusName" FROM "projectStatuses" ORDER BY "statusCode";
```

You should see all your statuses imported!
