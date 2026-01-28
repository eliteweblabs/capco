# Punchlist Count System - Complete Summary

## Overview
Changed from **calculated counts** to **stored columns** with automatic sync via PostgreSQL triggers.

---

## Database Structure

### Projects Table Columns
```sql
punchlistComplete INT  -- Number of completed punchlist items
punchlistCount    INT  -- Total number of punchlist items
```

### Automatic Updates via Triggers
The counts are automatically maintained by PostgreSQL triggers that fire on:
- `INSERT` into punchlist → Increment `punchlistCount`
- `UPDATE` on punchlist → Adjust `punchlistComplete` if `markCompleted` changed
- `DELETE` from punchlist → Decrement counts

---

## Frontend Implementation

### Editable Inputs (ProjectItem.astro)
```astro
<input
  type="number"
  value={project.punchlistComplete || 0}
  data-refresh="true"
  data-project-id={project.id}
  data-meta="punchlistComplete"
  data-meta-value={project.punchlistComplete || 0}
  onchange="updateProjectField(this, parseInt(this.value))"
  class="relative w-12 text-center border rounded p-1"
/>
/
<input
  type="number"
  value={project.punchlistCount || 0}
  data-refresh="true"
  data-project-id={project.id}
  data-meta="punchlistCount"
  data-meta-value={project.punchlistCount || 0}
  onchange="updateProjectField(this, parseInt(this.value))"
  class="relative w-12 text-center border rounded p-1"
/>
```

### Generic Update Function
Uses `updateProjectField()` which:
- ✅ Debounces saves (500ms)
- ✅ Shows inline save indicators (disk → checkmark)
- ✅ Protects from polling interference
- ✅ Handles any field with data attributes

---

## Backend Changes

### 1. Removed Calculation Logic
**File**: `src/lib/api/_projects.ts`

**Before** (Calculated):
```typescript
const { data: punchlistData } = await supabase
  .from("punchlist")
  .select("projectId, markCompleted")
  .in("projectId", projectIds);

// Count items...
stats[projectId].total++;
if (item.markCompleted) stats[projectId].completed++;
```

**After** (Read columns):
```typescript
const { data: projects } = await supabase
  .from("projects")
  .select("id, punchlistComplete, punchlistCount")
  .in("id", projectIds);

stats[project.id] = {
  completed: project.punchlistComplete || 0,
  total: project.punchlistCount || 0,
};
```

### 2. Refresh API Returns Columns
**File**: `src/pages/api/projects/refresh.ts`

```typescript
.select("id, updatedAt, status, dueDate, assignedToId, punchlistComplete, punchlistCount")
```

### 3. No Manual Updates Needed
**Files that DON'T need changes**:
- `src/pages/api/punchlist/upsert.ts` - Just updates punchlist items
- `src/lib/apply-project-templates.ts` - Just inserts punchlist items
- Triggers handle all counting automatically

---

## SQL Scripts

### 1. Create Triggers
**File**: `sql-queriers/auto-update-punchlist-counts.sql`

Creates 3 triggers:
```sql
CREATE TRIGGER update_punchlist_counts_insert
    AFTER INSERT ON punchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_project_punchlist_counts();
```

### 2. Initial Sync
Included in the same script:
```sql
UPDATE projects p
SET 
    "punchlistComplete" = COALESCE(stats.completed, 0),
    "punchlistCount" = COALESCE(stats.total, 0)
FROM (
    SELECT 
        "projectId",
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "markCompleted" = true) AS completed
    FROM punchlist
    GROUP BY "projectId"
) AS stats
WHERE p.id = stats."projectId";
```

---

## Refresh System Protection

### Null Handling
**File**: `src/lib/project-refresh-manager.ts`

```typescript
// For number inputs, convert null to 0
const isNumberInput = element.type === 'number';
if (isNumberInput && (newValue === null || newValue === '')) {
  newValue = 0;
}
```

### Editing Protection
```typescript
// Don't update if element is being saved
if (element.classList.contains('saving') || element.classList.contains('saved')) {
  console.log('Skipping update - element is being saved');
  return false;
}
```

---

## Data Flow

### When User Edits Values
1. User types in input → Shows disk icon
2. 500ms passes → Saves to `projects.punchlistComplete` or `projects.punchlistCount`
3. Shows checkmark → Fades after 3s
4. Polling is blocked during save
5. After save completes → Manual refresh updates other users

### When Punchlist Items Change
1. Punchlist item inserted/updated/deleted
2. PostgreSQL trigger fires automatically
3. Updates `projects.punchlistComplete` and `projects.punchlistCount`
4. Next polling cycle → All users see updated counts
5. Slide animation shows the change

### When Creating New Projects
1. `applyProjectTemplates()` inserts punchlist items
2. Triggers automatically update counts
3. No manual calculation needed

---

## Migration Checklist

- [x] Add `punchlistComplete` and `punchlistCount` columns to projects table
- [x] Create PostgreSQL triggers for auto-updates
- [x] Run initial sync script to populate existing data
- [x] Update `fetchPunchlistStats()` to read columns instead of calculate
- [x] Update refresh API to include new columns
- [x] Update ProjectItem.astro with editable inputs
- [x] Add null handling in refresh manager
- [x] Test manual edits with save indicators
- [x] Test automatic updates from punchlist changes
- [x] Verify polling doesn't interfere with edits

---

## Benefits

✅ **Performance** - No joins or aggregations needed  
✅ **Manual Override** - Can edit counts directly if needed  
✅ **Real-time** - Triggers keep counts accurate  
✅ **Simple** - Read columns instead of calculate  
✅ **Flexible** - Can adjust counts without touching punchlist table  
✅ **Visual Feedback** - Inline save indicators  
✅ **Multi-user Safe** - Polling system respects active edits  

---

## Testing

1. **Initial State**: Run SQL sync script → Verify all counts match punchlist table
2. **Manual Edit**: Change a count → See disk icon → See checkmark → Verify saved
3. **Punchlist Toggle**: Mark item complete → Verify count updates automatically
4. **Punchlist Create**: Add new item → Verify count increments
5. **Punchlist Delete**: Remove item → Verify count decrements
6. **Multi-user**: Edit on one browser → Watch count update on another
7. **Rapid Changes**: Click +/- quickly → Verify debouncing works

---

**Date**: January 27, 2026  
**Status**: Production Ready - All systems migrated to column-based counts
