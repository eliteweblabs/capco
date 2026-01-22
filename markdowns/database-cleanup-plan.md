# Database Cleanup Plan - camelCase Enforcement

## Date: January 22, 2026

## Problems Identified

### 1. Duplicate/Redundant File Tables
- `files` (24 columns, project-related files)
- `filesGlobal` (9 columns, global/admin media) ❌ **UNNECESSARY**

### 2. Non-camelCase Table Names
- `filesGlobal` ❌ (should be merged into `files`)
- Any snake_case tables remaining

## Proposed Solution

### Phase 1: Consolidate File Storage

**Merge `filesGlobal` into `files` table:**

The `files` table already has all the functionality needed:
- `projectId` is nullable (supports non-project files)
- `targetLocation` field handles different contexts ("global", "project", "discussions", etc.)
- Rich metadata support (versions, checkout, privacy, etc.)

**Migration Steps:**

1. **Migrate any existing `filesGlobal` data to `files`:**
   ```sql
   INSERT INTO files (
     fileName, filePath, fileSize, fileType, status,
     targetLocation, bucketName, uploadedAt
   )
   SELECT 
     fileName, filePath, fileSize, fileType, status,
     'global' as targetLocation,
     'project-media' as bucketName,
     uploadedAt
   FROM "filesGlobal"
   WHERE EXISTS (SELECT 1 FROM "filesGlobal");
   ```

2. **Update API endpoint to use `files` table:**
   - File: `src/pages/api/admin/media.ts`
   - Change all `filesGlobal` references to `files`
   - Add filter: `.eq("targetLocation", "global")` for global files

3. **Drop `filesGlobal` table:**
   ```sql
   DROP TABLE IF EXISTS "filesGlobal" CASCADE;
   DROP SEQUENCE IF EXISTS files_global_id_seq;
   ```

### Phase 2: Verify camelCase Consistency

**Check all table names:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND (
  table_name ~ '_' OR  -- Contains underscore
  table_name != lower(table_name) OR  -- Not all lowercase
  table_name ~ '[A-Z]' = false  -- No uppercase letters
)
ORDER BY table_name;
```

### Phase 3: Update .cursorrules

The `.cursorrules` already states:
```
- database tables and columns are always camelCase
```

**Add enforcement note:**
```
⚠️ CRITICAL: ALL database table and column names MUST be camelCase.
Examples:
- ✅ files, globalSettings, bannerAlerts
- ❌ files_global, demo_bookings, global_settings

When creating tables:
- Use camelCase for table names
- Use camelCase for column names
- NO underscores except in very specific technical cases
```

## Benefits of Consolidation

1. **Simpler codebase** - One file system to maintain
2. **Unified API** - Single media library handles all files
3. **Better features** - Global files get versioning, checkout, privacy features
4. **Consistency** - All files follow same patterns
5. **RLS friendly** - One set of policies to manage

## Files to Update

### API Files
- `/src/pages/api/admin/media.ts` - Change `filesGlobal` to `files` with filter
- `/src/lib/media.ts` - Already uses `files` correctly ✅

### Admin Pages
- `/src/pages/admin/media.astro` - Verify it uses correct API

## Testing Checklist

- [ ] Migrate any existing `filesGlobal` data
- [ ] Update `/api/admin/media` endpoint
- [ ] Test admin media upload
- [ ] Test admin media list/view
- [ ] Test admin media delete
- [ ] Verify no broken references
- [ ] Drop `filesGlobal` table
- [ ] Update markdown documentation

## Risk Assessment

**Low Risk** because:
- `filesGlobal` table currently has 0 rows
- No data to migrate
- API is isolated to admin section
- Can rollback easily if needed

## Implementation Order

1. ✅ Fix `filesGlobal` sequence (already done)
2. Update `/api/admin/media` to use `files` table
3. Test thoroughly
4. Drop `filesGlobal` table once confirmed working
5. Document changes
