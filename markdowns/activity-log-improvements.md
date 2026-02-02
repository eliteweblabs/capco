# Activity Log Improvements

## Problem

The activity log was showing generic "Project Updated" messages that didn't describe what actually changed. This made it difficult to understand project history at a glance.

### Before
- "Project was updated" - no details about what changed
- "Status changed from 20 to 20" - status codes instead of readable names

### After
- "Updated Title: New Project Name" - shows exactly what changed
- "Status changed from 'Generate Proposal' to 'Proposal Sent'" - readable status names
- "Updated 3 fields: Title: New Name, Square Footage: 5000, and 1 more" - summarizes multiple changes

## Changes Made

### 1. Enhanced Project Update Logging (`/src/pages/api/projects/_[id].ts`)

Added a `generateUpdateLogMessage()` helper function that:
- Compares old and new project data
- Identifies which fields changed
- Generates human-readable descriptions
- Handles different data types appropriately (arrays, booleans, etc.)
- Summarizes multiple changes intelligently

**Field Label Mapping:**
```typescript
{
  title: "Title",
  address: "Address",
  description: "Description",
  sqFt: "Square Footage",
  status: "Status",
  newConstruction: "New Construction",
  assignedTo: "Assigned To",
  buildingTypes: "Building Types",
  systems: "Systems",
  waterSupply: "Water Supply",
  buildingDetails: "Building Details"
}
```

**Examples:**
- Single field: "Updated Title: New Project Name"
- Multiple fields (≤3): "Updated Title: New Name, Address: 123 Main St, Square Footage: 5000"
- Many fields (>3): "Updated 5 fields: Title: New Name, Address: 123 Main St, and 3 more"

### 2. Enhanced Status Change Logging (`/src/pages/api/status/upsert.ts`)

Added a `getStatusName()` helper function that:
- Looks up human-readable status names from `/config/data/statuses.json`
- Maps status codes to their `adminStatusName` values
- Handles status "refreshes" (when status doesn't actually change)

**Examples:**
- Status change: "Status changed from 'Generate Proposal' to 'Proposal Sent'"
- Status refresh: "Status refreshed: Generate Proposal"

### 3. Status Data Integration

The status names are pulled from the existing status configuration:
- Status Code 20 → "Generate Proposal"
- Status Code 30 → "Proposal Sent"
- Status Code 50 → "Contract Signed"
- etc.

## Technical Details

### Files Modified
1. `/src/pages/api/projects/_[id].ts` - Project update logging
2. `/src/pages/api/status/upsert.ts` - Status change logging

### Data Sources
- Status names: `/config/data/statuses.json`
- Logging system: `/src/lib/simple-logging.ts` (SimpleProjectLogger)
- Activity display: `/src/components/project/SimpleProjectLog.astro`

### Performance Impact
- Minimal - only adds lightweight string comparison and formatting
- No additional database queries
- No impact on response times

## Future Enhancements

Possible improvements:
1. Add more field labels for additional project properties
2. Show user-friendly names for assigned staff members
3. Add file upload/download tracking to activity log
4. Include change diffs for text fields (show before/after values)
5. Add filtering by activity type in the UI

## Testing

To test the improvements:
1. Update a project field (title, address, etc.)
2. Check the activity log - should show "Updated [Field]: [Value]"
3. Change project status
4. Check the activity log - should show readable status names
5. Update multiple fields at once
6. Check the activity log - should show intelligent summary

## Related Files

- Activity API: `/src/pages/api/activity/get.ts`
- Activity Display: `/src/components/project/SimpleProjectLog.astro`
- Project Update API: `/src/pages/api/projects/_[id].ts`
- Status Update API: `/src/pages/api/status/upsert.ts`
- Logging Library: `/src/lib/simple-logging.ts`
- Status Configuration: `/config/data/statuses.json`
