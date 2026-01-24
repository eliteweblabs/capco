# Newsletter System - Refactored to Match ContactForm Pattern

## Overview
Refactored the newsletter management system to follow the same architecture pattern as `ContactForm.astro`, with auto-detection of missing database tables and helpful setup instructions.

## Changes Made

### 1. Feature Component Structure
**Created**: `src/features/newsletters/components/NewsletterManager.astro`

- Moved all UI and logic from the admin page into a reusable feature component
- Matches the pattern used by `ContactForm.astro`
- Self-contained with all client-side JavaScript
- Uses TypeScript in `<script>` tags for type safety

### 2. Admin Page Simplification
**Updated**: `src/pages/admin/newsletters.astro`

Simplified to just:
- Authentication check
- Global data imports
- Component imports
- Rendering the `<NewsletterManager />` component

This matches the pattern used by other admin pages like `users.astro`.

### 3. Auto-Detection of Missing Table
**Updated**: `src/pages/api/newsletters/upsert.ts`

Added error handling for missing table (error code `42P01`):
- Detects when `newsletters` table doesn't exist
- Logs complete SQL setup script to console
- Returns helpful error message with instructions
- Returns 503 status with `setupRequired: true` flag

Same pattern as `src/pages/api/contact/submit.ts`.

### 4. Database Setup Instructions

**In Component** (`NewsletterManager.astro`):
- Shows red alert banner when table doesn't exist
- Displays instructions for running SQL file
- Points to server logs for copy/paste SQL

**In API** (`upsert.ts`):
- Logs full CREATE TABLE statement with all columns
- Includes RLS policies
- Includes index creation
- Includes helpful comments

### 5. Component Features

✅ **Uses Existing Components**:
- `<Button>` instead of raw `<button>`
- `<SimpleIcon>` for icons
- `<DeleteConfirmButton>` for deletion
- `globalInputClasses` for consistent styling

✅ **TypeScript Support**:
- Full TypeScript in client-side script
- Type annotations for functions
- Proper type assertions for DOM elements

✅ **Search & Select**:
- Native JavaScript implementation (no external deps)
- Real-time search filtering
- Checkbox-based multi-select
- Selected count display

## File Structure

```
src/
├── features/
│   └── newsletters/
│       └── components/
│           └── NewsletterManager.astro  ← NEW: Main feature component
├── pages/
│   ├── admin/
│   │   └── newsletters.astro            ← UPDATED: Simplified page
│   └── api/
│       └── newsletters/
│           ├── upsert.ts                ← UPDATED: Auto-table detection
│           ├── delete.ts                ← Unchanged
│           └── send.ts                  ← Unchanged
└── sql-queriers/
    └── create-newsletters-table.sql     ← Unchanged
```

## Usage Flow

### First Run (Table Doesn't Exist)
1. Admin navigates to `/admin/newsletters`
2. Page loads with red alert banner
3. Banner shows two options:
   - Run SQL file: `psql -d db < sql-queriers/create-newsletters-table.sql`
   - Check server logs: Complete SQL in console
4. When admin tries to create newsletter, gets 503 error with setup instructions
5. After running SQL, page refresh shows working interface

### Normal Operation (Table Exists)
1. Admin creates newsletter with title, subject, content
2. Selects recipient type (all/staff/client/admin/custom)
3. If custom, searches and selects specific users
4. Toggles delivery options (email/SMS)
5. Toggles status (draft/active)
6. Saves newsletter
7. When ready, turns off draft mode and sends

## Database Table

```sql
CREATE TABLE newsletters (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  "recipientType" TEXT NOT NULL DEFAULT 'all',
  "customRecipients" TEXT[],
  "isActive" BOOLEAN DEFAULT true,
  "isDraft" BOOLEAN DEFAULT true,
  "deliverViaEmail" BOOLEAN DEFAULT true,
  "deliverViaSms" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastSentAt" TIMESTAMP WITH TIME ZONE,
  "sentCount" INTEGER DEFAULT 0
);
```

## Key Differences from Original Implementation

### Before (Original)
- Monolithic admin page with all logic inline
- No table existence checking
- Assumed database was already set up
- Used `is:inline` script with vanilla JS

### After (ContactForm Pattern)
- Feature component architecture
- Auto-detects missing table
- Provides setup instructions in UI and logs
- TypeScript in script tags
- Uses existing UI components (Button, SimpleIcon, etc.)
- Better separation of concerns

## Testing Checklist

- [x] Created feature component
- [x] Updated admin page to use component
- [x] Added table detection in API
- [x] Added error handling with SQL logs
- [x] Added UI alert banner for missing table
- [x] Uses Button component instead of raw buttons
- [x] Uses SimpleIcon for icons
- [x] TypeScript in script tags
- [x] Maintains all original functionality

## Next Steps

1. **Run SQL Setup** (if not already done):
   ```bash
   psql -d your_database < sql-queriers/create-newsletters-table.sql
   ```

2. **Test First Run**:
   - Navigate to `/admin/newsletters` before running SQL
   - Verify red alert banner appears
   - Check server logs for SQL commands

3. **Test Normal Operation**:
   - After running SQL, verify newsletter creation works
   - Test all recipient types
   - Test custom user selection with search
   - Test email/SMS delivery toggles
   - Test draft mode and sending

4. **Add to Navigation**:
   - Add "Newsletters" link to admin sidebar/nav
   - Position above "Tests" as requested

## Benefits of This Refactor

1. **Consistency**: Matches ContactForm and other features
2. **Better DX**: Clear setup instructions, no silent failures
3. **Maintainability**: Separated concerns, reusable component
4. **Type Safety**: TypeScript in scripts
5. **Component Reuse**: Uses existing UI components
6. **Better UX**: Visual feedback for setup requirements
7. **Production Ready**: Handles edge cases gracefully
