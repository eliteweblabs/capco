# Convert CSV Export to SQL Import

You've exported your schema as CSV from Supabase SQL Editor. Now convert it to executable SQL statements.

## Quick Start

### Option 1: Node.js Script (Recommended)

```bash
# Single CSV file
node scripts/csv-to-sql.js your-export.csv

# Multiple CSV files (if you exported parts separately)
node scripts/csv-to-sql.js tables.csv functions.csv triggers.csv policies.csv
```

### Option 2: Simple Shell Script

```bash
# Single or multiple CSV files
./scripts/csv-to-sql-simple.sh your-export.csv
./scripts/csv-to-sql-simple.sh tables.csv functions.csv triggers.csv
```

### Option 3: Manual Conversion

If the scripts don't work, manually:

1. **Open your CSV file** in a text editor
2. **Find the column with CREATE statements** (usually first column)
3. **Copy all CREATE/ALTER statements**
4. **Remove CSV quotes** (`"` at start/end of lines)
5. **Ensure each statement ends with `;`**
6. **Save as `.sql` file**

## CSV Format

Supabase SQL Editor exports CSV in this format:
```csv
create_statement
"CREATE TABLE IF NOT EXISTS projects (...);"
"CREATE TABLE IF NOT EXISTS files (...);"
```

Or with headers:
```csv
create_statement,other_column
"CREATE TABLE projects (...);",value
```

## What the Scripts Do

1. ✅ **Read CSV files** - Processes one or more CSV files
2. ✅ **Extract SQL statements** - Finds CREATE/ALTER statements
3. ✅ **Remove CSV formatting** - Strips quotes and escapes
4. ✅ **Clean up SQL** - Ensures proper semicolons
5. ✅ **Generate SQL file** - Creates ready-to-import SQL file

## Output

The script creates: `schema-import-[timestamp].sql`

This file contains all CREATE statements ready to paste into your target project SQL Editor.

## Import to Target Project

1. **Open the generated SQL file**
2. **Copy all contents**
3. **Go to target project SQL Editor:**
   - https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql
4. **Paste and run**

## Troubleshooting

### Error: "No SQL statements found"

**Solution:** Check your CSV format. The script looks for lines containing:
- `CREATE`
- `ALTER`
- `--` (comments)

Make sure your CSV has CREATE statements in the first column.

### Error: "File not found"

**Solution:** Use full path or make sure you're in the right directory:
```bash
node scripts/csv-to-sql.js /full/path/to/your-export.csv
```

### SQL statements have extra quotes

**Solution:** The script should handle this, but if not:
1. Open the generated SQL file
2. Find and replace: `""` with `"`
3. Remove leading/trailing quotes from CREATE statements

### Missing semicolons

**Solution:** The script adds semicolons automatically, but verify:
- Each CREATE statement should end with `;`
- Each ALTER statement should end with `;`

## Example Workflow

```bash
# 1. Export from source project (got CSV files)
# 2. Convert CSV to SQL
node scripts/csv-to-sql.js tables-export.csv functions-export.csv

# 3. Review generated file
cat schema-import-*.sql

# 4. Import to target project SQL Editor
# (Copy/paste from schema-import-*.sql)
```

## Files Created

- `scripts/csv-to-sql.js` - Node.js converter (handles complex CSV)
- `scripts/csv-to-sql-simple.sh` - Shell script converter (simple CSV)
- `CSV_TO_SQL_GUIDE.md` - This guide
