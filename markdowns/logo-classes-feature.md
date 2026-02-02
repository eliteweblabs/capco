# Logo Classes Feature

## Overview
Added the ability to manage logo CSS classes through the CMS settings, allowing admins to control logo styling (size, colors, spacing) from the database without code changes.

## Implementation Details

### Database Column
- **Column Name**: `logoClasses`
- **Storage**: `globalSettings` table (key-value store)
- **Category**: `logos`
- **Type**: `text`

### Files Modified

#### 1. `/src/pages/admin/settings.astro`
- Added `logoClasses` input field to the "Company Logo (SVG)" section
- Field includes placeholder: `"h-8 w-auto text-primary-600 dark:text-white"`
- Added to form field mapping for submission
- Shows database indicator (💾) when value is stored in database
- **FIXED**: Excluded `logoClasses` from SVG validation (line 1470) - it's for CSS classes, not SVG markup

#### 2. `/src/pages/api/global/global-company-data.ts`
- Added `logoClasses: get("logoClasses") || ""` to return object
- Fetches from database, falls back to empty string if not set

#### 3. `/src/components/ui/Logo.astro`
- Retrieves `logoClasses` from `companyData.logoClasses`
- Uses `Astro.props.className` if passed, otherwise uses `logoClassesFromDb`
- Applies classes to the logo wrapper element: `logo-svg-wrapper ${className}`

#### 4. `/src/pages/api/settings/update.ts`
- Updated `getCategoryAndType()` function to handle `logoClasses`
- Sets category to `"logos"` and valueType to `"text"` (not `"svg"`)

## Bug Fix (Feb 2, 2026)

### Issue
When trying to save CSS classes like `'w-36 sm:w-40'` in the logoClasses field, validation error appeared:
```
Validation Error
Validation errors: logoClasses must be valid SVG markup starting with <svg>
```

### Root Cause
The validation logic in `settings.astro` (line 1470) was checking if `dbKey.includes("logo")` and if so, requiring the value to start with `<svg>`. Since `logoClasses` contains "logo" in its name, it was incorrectly being treated as SVG markup instead of CSS classes.

### Solution
Added exclusion for `logoClasses` in the SVG validation:
```typescript
// Before:
if ((dbKey.includes("logo") || dbKey.includes("icon")) && trimmedValue) {

// After:
if ((dbKey.includes("logo") || dbKey.includes("icon")) && trimmedValue && dbKey !== "logoClasses") {
```

Now `logoClasses` bypasses the SVG validation and can accept any text value (CSS classes).

## Usage

### Via CMS Settings
1. Navigate to `/admin/settings`
2. Scroll to "Company Logo (SVG)" section
3. Enter Tailwind CSS classes in "Logo CSS Classes" field
4. Examples:
   - `h-8 w-auto` - Standard logo size
   - `h-12 w-auto text-primary-600` - Larger logo with primary color
   - `h-10 w-32 dark:text-white` - Fixed height and width with dark mode color
   - `w-36 sm:w-40` - Responsive width sizing
5. Click "Save Settings"

### Via Component Props
You can still add additional classes per-component by passing the `className` prop:

```astro
<Logo className="h-16 w-auto text-blue-500" />
```

**Note**: Classes are now **merged**, not replaced. If you set `logoClasses` in the database to `"h-8"` and pass `className="text-blue-500"`, the final classes will be `"text-blue-500 h-8"`.

## Priority Order
Classes are merged with this priority:
1. Component prop `className` (applied first)
2. Database value `logoClasses` (appended)
3. Empty string (default if neither is set)

**Example:**
- Database: `logoClasses = "h-10 w-auto"`
- Component: `<Logo className="mr-4 flex" />`
- Result: `class="mr-4 flex h-10 w-auto"`

## Benefits
- Centralized logo styling control
- No code changes needed to adjust logo appearance
- Per-client customization (especially useful for multi-tenant setups)
- Supports Tailwind CSS classes for responsive design and dark mode
- Can still override per-component when needed

## Testing
1. Set logo classes in CMS settings (e.g., `w-36 sm:w-40`)
2. Verify logo appears with correct styling
3. Check both light and dark modes
4. Test responsive behavior
5. Verify component-level override works
