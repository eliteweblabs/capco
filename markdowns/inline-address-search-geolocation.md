# InlineAddressSearch - Geolocation Integration

**Date:** 2026-01-30
**Component:** InlineAddressSearch.astro
**Feature:** Integrated geolocation with crosshair icon

## Overview

Added geolocation functionality to the InlineAddressSearch component, matching the behavior of the SlotMachineModal. When enabled, the search magnifying glass icon is replaced with a crosshair icon that triggers location-based address lookup.

## Changes Made

### 1. InlineAddressSearch.astro Component

**Props Interface** (line 14):
```typescript
currentLocation?: boolean; // Show crosshair icon for geolocation (default: false)
```

**Props Destructuring** (line 26):
```typescript
currentLocation = false,
```

**Conditional Icon Rendering** (lines 42-69):
```astro
{
  currentLocation ? (
    <button id={`${id}-use-location-btn`}>
      <SimpleIcon name="crosshair" size="sm" />
    </button>
  ) : (
    <button>
      <svg><!-- magnifying glass --></svg>
    </button>
  )
}
```

**Script Updated** (line 80):
```javascript
currentLocation: currentLocation,
```

### 2. inline-address-search.js Module

**Updated Config Destructuring**:
```javascript
const { 
  id, 
  fetchApiEndpoint, 
  apiParams, 
  valueField, 
  labelField, 
  onSelect, 
  currentLocation = false  // New parameter
} = config;
```

**Added Geolocation Handler**:
- Listens for click on `use-location-btn`
- Gets coordinates from browser geolocation API
- Calls `/api/google/geocode` endpoint for reverse geocoding
- Populates dropdown with nearby addresses
- Auto-selects the first (most accurate) result
- Shows loading spinner while fetching
- Handles errors with user-friendly messages

## Usage

### Enable Geolocation

```astro
<InlineAddressSearch
  id="address"
  name="address"
  placeholder="Search for an address..."
  currentLocation={true}  <!-- Shows crosshair icon -->
  globalInputClasses="your-classes"
/>
```

### Disable Geolocation (Default)

```astro
<InlineAddressSearch
  id="address"
  name="address"
  placeholder="Search for an address..."
  <!-- currentLocation not specified, shows magnifying glass -->
/>
```

## Behavior

**With `currentLocation={true}`**:
1. Shows crosshair icon (📍) instead of magnifying glass
2. Clicking icon requests browser location permission
3. Gets coordinates and calls geocode API
4. Populates dropdown with nearby addresses
5. Auto-fills input with the first/most accurate result
6. User can select a different address from dropdown if needed

**With `currentLocation={false}` (default)**:
1. Shows magnifying glass icon
2. Regular search behavior (type to search)

## Technical Details

- Uses `/api/google/geocode` endpoint for reverse geocoding
- Handles multiple response formats (predictions, results, data)
- Shows loading spinner during location fetch
- Provides error handling for:
  - Browser doesn't support geolocation
  - User denies location permission
  - Location unavailable
  - Request timeout
  - API errors

## Files Modified

1. `/src/components/form/InlineAddressSearch.astro` - Added prop and conditional rendering
2. `/public/js/inline-address-search.js` - Added geolocation handler

## Related

- See `geolocation-geocoding-api-fix.md` for geocode API details
- See `slot-machine-current-location-prop.md` for SlotMachineModal implementation
- Both components now share the same geolocation UX pattern
