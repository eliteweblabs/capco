# Verification: Templates Only Applied to NEW Projects

This guide helps you verify that templates are only applied when creating new projects, not when updating existing ones.

## 🔒 How the Safeguards Work

### 1. **Route Separation**
- **POST `/api/projects/upsert`** → Creates new projects → Templates applied ✅
- **PUT `/api/projects/upsert`** → Updates existing projects → Templates NOT applied ❌

### 2. **Duplicate Prevention**
Before applying templates, the system checks:
```typescript
// Check if project already has punchlist items
const existingPunchlist = await supabaseAdmin
  .from("punchlist")
  .select("id")
  .eq("projectId", projectId)
  .limit(1);

// If items exist, skip template application
if (existingPunchlist && existingPunchlist.length > 0) {
  console.log("⚠️ Templates already applied, skipping");
  return result;
}
```

### 3. **Location in Code**
Template application is ONLY in:
```typescript
// src/pages/api/projects/upsert.ts - Line ~311-326
export const POST: APIRoute = async ({ request, cookies }) => {
  // ... project creation code ...
  
  // ✅ Templates applied HERE (after project created)
  await applyProjectTemplates(project.id, project);
  
  // ... return response ...
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  // ... project update code ...
  
  // ❌ NO template application here
  
  // ... return response ...
};
```

## 🧪 Test Scenarios

### Test 1: Create New Project
**Expected**: Templates ARE applied

```bash
# Create a new project
curl -X POST http://localhost:4321/api/projects/upsert \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Test Project",
    "address": "123 Test St",
    "authorId": "user-id-here"
  }'

# Check server logs for:
# ✅ [CREATE-PROJECT] Applying templates to project X
# ✅ [CREATE-PROJECT] Applied N punchlist and M discussion templates
```

**Verify in Database:**
```sql
-- Get the project ID from the response, then check:
SELECT COUNT(*) as punchlist_count 
FROM punchlist 
WHERE project_id = YOUR_PROJECT_ID;
-- Should return: 11 (default punchlist templates)

SELECT COUNT(*) as discussion_count 
FROM discussion 
WHERE project_id = YOUR_PROJECT_ID;
-- Should return: 4 (default discussion templates)
```

### Test 2: Update Existing Project
**Expected**: Templates are NOT applied again

```bash
# Update the same project
curl -X PUT http://localhost:4321/api/projects/upsert \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "id": YOUR_PROJECT_ID,
    "title": "Updated Test Project",
    "address": "456 Updated St"
  }'

# Check server logs for:
# 🔧 [UPDATE-PROJECT] ... (update logs)
# ❌ NO template application logs
```

**Verify in Database:**
```sql
-- Item counts should remain the same
SELECT COUNT(*) as punchlist_count 
FROM punchlist 
WHERE project_id = YOUR_PROJECT_ID;
-- Should still return: 11 (no duplicates)

SELECT COUNT(*) as discussion_count 
FROM discussion 
WHERE project_id = YOUR_PROJECT_ID;
-- Should still return: 4 (no duplicates)
```

### Test 3: Attempt to Re-apply Templates (Edge Case)
**Expected**: Templates are skipped due to safeguard

```sql
-- Manually call the apply function (for testing only)
-- In reality, this should never happen, but if it does:

-- Before manual call:
SELECT COUNT(*) FROM punchlist WHERE project_id = YOUR_PROJECT_ID;
-- Returns: 11

-- If you were to manually call applyProjectTemplates(projectId):
-- Server logs would show:
-- ⚠️ [apply-project-templates] Project X already has punchlist items, skipping

-- After "manual call":
SELECT COUNT(*) FROM punchlist WHERE project_id = YOUR_PROJECT_ID;
-- Still returns: 11 (no duplicates created!)
```

## 📋 Verification Checklist

Use this checklist to verify the system is working correctly:

- [ ] **Create Test Project**: Templates applied (11 punchlist + 4 discussion)
- [ ] **Update Test Project**: No new templates added
- [ ] **Check Server Logs**: See template application only on POST
- [ ] **Query Database**: Confirm item counts don't change on updates
- [ ] **Create Another Project**: Templates applied again for the new project
- [ ] **Disable a Template**: Create new project, verify disabled template not applied

## 🔍 Server Log Examples

### Creating New Project (Templates Applied)
```
📝 [CREATE-PROJECT] API route called!
📝 [CREATE-PROJECT] Database insert successful
📝 [CREATE-PROJECT] Applying templates to project 42
✅ [apply-project-templates] Project 42 has no existing items, applying templates
✅ [CREATE-PROJECT] Applied 11 punchlist and 4 discussion templates
📝 [CREATE-PROJECT] Project created successfully
```

### Updating Existing Project (Templates NOT Applied)
```
🔧 [UPSERT-PROJECT] API called
🔧 [UPSERT-PROJECT] Project ID found, treating as update: 42
🔧 [UPDATE-PROJECT] Updating project data
🔧 [UPDATE-PROJECT] Update successful
(NO template application logs)
```

### Attempting Duplicate Application (Safeguard)
```
📝 [CREATE-PROJECT] Applying templates to project 42
⚠️ [apply-project-templates] Project 42 already has punchlist items, skipping template application
⚠️ [CREATE-PROJECT] Template errors: ["Templates already applied to this project"]
(No items created)
```

## 🛡️ What Protects Against Duplicates?

1. **Code Structure**: POST creates, PUT updates - templates only in POST
2. **Existence Check**: Function checks for existing items before proceeding
3. **Early Return**: If items exist, function returns immediately
4. **Logging**: All actions are logged for audit trail

## 🎯 Summary

Templates are applied **ONLY** when:
- ✅ Creating a NEW project via POST
- ✅ Project has NO existing punchlist/discussion items
- ✅ Templates are ENABLED in the database

Templates are **NEVER** applied when:
- ❌ Updating an existing project via PUT
- ❌ Project already has punchlist/discussion items
- ❌ Templates are disabled

## 📞 Quick Verification Command

Run this after creating a project to verify it worked correctly:

```sql
-- Replace YOUR_PROJECT_ID with the actual project ID
WITH counts AS (
  SELECT 
    p.id,
    p.title,
    p.created_at,
    COUNT(DISTINCT pl.id) as punchlist_items,
    COUNT(DISTINCT d.id) as discussion_items
  FROM projects p
  LEFT JOIN punchlist pl ON pl.project_id = p.id
  LEFT JOIN discussion d ON d.project_id = p.id
  WHERE p.id = YOUR_PROJECT_ID
  GROUP BY p.id, p.title, p.created_at
)
SELECT 
  *,
  CASE 
    WHEN punchlist_items = 11 AND discussion_items = 4 THEN '✅ Templates Applied Correctly'
    WHEN punchlist_items = 0 AND discussion_items = 0 THEN '⚠️ No Templates Applied'
    ELSE '❌ Unexpected Count'
  END as status
FROM counts;
```

Expected output for a new project:
```
id  | title        | punchlist_items | discussion_items | status
----|--------------|-----------------|------------------|---------------------------
42  | Test Project | 11              | 4                | ✅ Templates Applied Correctly
```

---

**Need Help?** Check the logs at `/var/log/your-app/` or server console for detailed template application information.
