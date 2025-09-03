# EST_TIME Placeholder Example

## Overview

The `{{EST_TIME}}` placeholder allows you to dynamically include the project's estimated time from the database in toast notifications. This provides personalized time estimates for each project.

## How It Works

### 1. Database Column

The `est_time` column in the `projects` table stores the estimated time for each project:

```sql
-- Example project with est_time
UPDATE projects
SET est_time = '3-5 business days'
WHERE id = 123;
```

### 2. Toast Message with Placeholder

In the `project_statuses` table, you can use the `{{EST_TIME}}` placeholder:

```sql
-- Status 20: Documents submitted
UPDATE project_statuses
SET
  toast_client = 'We have received your project documents and will begin preparing a proposal of services. We will notify you at {{CLIENT_EMAIL}} in {{EST_TIME}}.'
WHERE code = 20;
```

### 3. System Processing

When a status change occurs:

1. **Data Collection**: The system reads the project's `est_time` value
2. **Placeholder Replacement**: `{{EST_TIME}}` is replaced with the actual value
3. **Message Display**: The final message is shown to the user

## Example Scenarios

### Scenario 1: Quick Project

```sql
-- Project with short timeline
UPDATE projects SET est_time = '1-2 business days' WHERE id = 456;
```

**Result**:

- Toast message: "We have received your project documents and will begin preparing a proposal of services. We will notify you at client@example.com in 1-2 business days."

### Scenario 2: Complex Project

```sql
-- Project with longer timeline
UPDATE projects SET est_time = '5-7 business days' WHERE id = 789;
```

**Result**:

- Toast message: "We have received your project documents and will begin preparing a proposal of services. We will notify you at client@example.com in 5-7 business days."

### Scenario 3: No EST_TIME Set

```sql
-- Project without est_time (uses default)
UPDATE projects SET est_time = NULL WHERE id = 999;
```

**Result**:

- Toast message: "We have received your project documents and will begin preparing a proposal of services. We will notify you at client@example.com in 2-3 business days." (default fallback)

## Implementation Details

### Component Updates

The system automatically passes the `est_time` through the component chain:

1. **Project Page** → **Hero Component** → **ProjectStatusDropdown**
2. **Data Attribute**: `data-est-time="3-5 business days"`
3. **Placeholder Replacement**: `{{EST_TIME}}` → `3-5 business days`

### Code Flow

```javascript
// In ProjectStatusDropdown.astro
const estTime = dropdownButton.getAttribute("data-est-time") || "2-3 business days";

// Replace placeholder
toastMessage = toastMessage.replace(/{{EST_TIME}}/g, estTime);
```

## Database Schema

### Projects Table

```sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS est_time TEXT DEFAULT '2-3 business days';

-- Add comment for documentation
COMMENT ON COLUMN projects.est_time IS 'Estimated time for project completion (e.g., "3-5 business days")';
```

### Project Statuses Table

```sql
-- Example status with EST_TIME placeholder
UPDATE project_statuses
SET
  toast_admin = 'Generating proposal for {{PROJECT_TITLE}} - estimated completion in {{EST_TIME}}',
  toast_client = 'We are preparing your proposal and expect to complete it in {{EST_TIME}}.'
WHERE code = 20;
```

## Best Practices

### 1. Consistent Formatting

Use consistent time formats across your database:

- ✅ "2-3 business days"
- ✅ "1 week"
- ✅ "3-5 business days"
- ❌ "2-3 days" (inconsistent)
- ❌ "1-2 weeks" (inconsistent)

### 2. Realistic Estimates

Set realistic `est_time` values based on project complexity:

```sql
-- Simple project
UPDATE projects SET est_time = '1-2 business days' WHERE complexity = 'simple';

-- Complex project
UPDATE projects SET est_time = '5-7 business days' WHERE complexity = 'complex';
```

### 3. Fallback Values

Always provide sensible defaults:

```javascript
const estTime = project?.est_time ?? "2-3 business days";
```

## Testing

### Test Different Scenarios

1. **Project with EST_TIME**: Verify placeholder replacement
2. **Project without EST_TIME**: Verify default fallback
3. **Null EST_TIME**: Verify graceful handling
4. **Empty EST_TIME**: Verify default fallback

### Example Test Cases

```sql
-- Test case 1: Project with specific time
UPDATE projects SET est_time = '1 week' WHERE id = 1;

-- Test case 2: Project with null time
UPDATE projects SET est_time = NULL WHERE id = 2;

-- Test case 3: Project with empty time
UPDATE projects SET est_time = '' WHERE id = 3;
```

## Benefits

1. **Personalized Messages**: Each project gets its own time estimate
2. **Dynamic Content**: No hardcoded time values in messages
3. **Consistent Formatting**: Centralized time format management
4. **Flexible Updates**: Easy to change time estimates per project
5. **Fallback Support**: Graceful handling of missing data

## Migration Guide

To add EST_TIME support to existing projects:

```sql
-- 1. Add the column if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS est_time TEXT;

-- 2. Set default values for existing projects
UPDATE projects SET est_time = '2-3 business days' WHERE est_time IS NULL;

-- 3. Update toast messages to use the placeholder
UPDATE project_statuses
SET toast_client = 'We will notify you at {{CLIENT_EMAIL}} in {{EST_TIME}}.'
WHERE code = 20;
```
