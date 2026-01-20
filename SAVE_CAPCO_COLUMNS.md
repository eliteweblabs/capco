# Save Capco Columns JSON

The `capco-columns.json` file currently only has a sample. You need to save the **full JSON array** you provided.

## Quick Save Method

1. Copy the entire JSON array you provided (starting with `[` and ending with `]`)
2. Save it to `capco-columns.json` in the project root
3. Make sure it's valid JSON (can be minified or formatted)

## Verify It's Saved Correctly

```bash
node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync('capco-columns.json', 'utf8')); console.log('✅ Valid JSON with', data.length, 'columns');"
```

## Then Run Comparison

Once `capco-columns.json` has the full data:

```bash
node scripts/sync-rothco-to-capco-schema.js \
  --capco-tables capco-tables.json \
  --capco-columns capco-columns.json \
  --rothco-tables rothco-schema-tables.json \
  --rothco-columns rothco-schema-columns.json \
  --output sync-rothco-to-capco.sql
```

This will generate `sync-rothco-to-capco.sql` with all the migration SQL to make Rothco match Capco exactly.
