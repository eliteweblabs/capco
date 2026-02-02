# SimpleIcon Logo Special Case Implementation

## Summary

Added a special case in the `SimpleIcon` component to automatically fetch and display the global company icon from the database when the icon name is `'logo'`.

## Changes Made

### 1. Updated `src/lib/simple-icons.ts`

- Added `globalCompanyIcon?: string` parameter to the `IconConfig` interface
- Added logic to use the `globalCompanyIcon` when `name === 'logo'`
- Falls back to regular icon data if the name is not 'logo' or if no global icon is provided

### 2. Updated `src/components/common/SimpleIcon.astro`

- Imported `globalCompanyData` from `../../pages/api/global/global-company-data`
- Added server-side fetch of global company icon when `name === 'logo'`
- Pass the fetched `globalCompanyIcon` to the `getIcon()` function

## Usage

Now when you use `<SimpleIcon name="logo" />`, it will:

1. Detect that the name is 'logo'
2. Fetch the global company icon from the database (via `globalCompanyData()`)
3. Use the fetched SVG as the icon
4. Apply all the same size, class, and variant styling as any other SimpleIcon

## Example

```astro
<!-- This will now automatically display the global company icon from the database -->
<SimpleIcon name="logo" size="md" class="m-0 sm:mr-2" />
```

## Benefits

- Centralized company branding - the logo comes from database settings
- No need to hardcode or duplicate logo SVG code
- Works with all SimpleIcon features (sizing, variants, classes, etc.)
- Server-side rendering ensures the correct icon is always displayed
- Compatible with the existing caching system in `globalCompanyData()`

## Technical Details

- The global company icon is fetched from the `globalSettings` table via `globalCompanyData()`
- The icon is cached for 1 minute to avoid repeated database calls
- The SVG markup is processed and sized correctly by the existing `getIcon()` logic
- If no global icon is found, it falls back to showing `[icon:logo]` as a debug indicator
