# Solution: Status Change Time Display

## Understanding the Current Setup

Based on the existing SQL trigger in `auto-update-updatedAt-trigger.sql`, the `updatedAt` column **already only updates when status changes**:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updatedAt if status has changed
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW."updatedAt" = NOW();
    END IF;
    RETURN NEW;
END;
$$
```

So `updatedAt` = "Time Since Last Status Change" (already correct in database)

## The Solution

### Option 1: Keep Column Name, Fix Display Label (RECOMMENDED)

The database is already correct - `updatedAt` tracks status changes only. We just need to:

1. **Update the UI label** to clarify what it means
2. **Keep the live client-side updates** (already implemented)
3. **Keep it excluded from polling** (already implemented)

**Changes needed:**

```astro
<!-- In ProjectItem.astro, update the table header -->
<th>Status Changed</th>
<!-- or -->
<th>Last Status Update</th>
```

### Option 2: Add a New Column (If You Want Both)

If you want to track BOTH:

- Time since last status change (`updatedAt`)
- Time since any activity (new column)

**Create new column:**

```sql
-- Add a general activity timestamp column
ALTER TABLE projects
ADD COLUMN "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to update on ANY change
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW."lastActivityAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger fires on any update
CREATE TRIGGER update_projects_last_activity
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_last_activity();
```

Then you'd have:

- `updatedAt` = Status changes only (existing column)
- `lastActivityAt` = Any field changes (new column)

## Recommendation

**Use Option 1** - the database is already correct. Just update the display:

### Current Display:

```
| Last Updated |
| 3 minutes ago |
```

### Proposed Display:

```
| Status Changed |
| 3 minutes ago  |
```

Or even better, make it contextual:

```
| Status: [Pending Review] |
| Changed 3 minutes ago    |
```

## What We Already Fixed

✅ `updatedAt` only updates on status changes (trigger already in place)
✅ Client-side live updates working (ticks every second)
✅ No server polling needed (excluded from RefreshManager)
✅ Zero performance overhead

## Implementation: Just Change the Label

```astro
<!-- In src/components/project/ProjectList.astro (table header) -->
<th>
  <Tooltip text="Time since last status change">
    <SimpleIcon name="clock-history" /> Status Changed
  </Tooltip>
</th>
```

That's it! The data is correct, the performance is optimized, just need a clearer label.
