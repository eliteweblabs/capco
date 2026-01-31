# SlotMachine Modal - currentLocation Prop

**Date:** 2026-01-30
**Component:** SlotMachineModal.astro, slot-machine-modal.astro (partial)
**Feature:** Conditional "Use My Current Location" button

## Overview

Added a new `currentLocation` prop to control the visibility of the "Use My Current Location" button in the SlotMachine modal. This allows developers to enable/disable the geolocation feature per instance.

## Changes Made

### 1. SlotMachineModal.astro (Main Component)

**Props Interface** (line 38):
```typescript
currentLocation?: boolean; // Optional: Show location button (default: false)
```

**Props Destructuring** (line 86):
```typescript
currentLocation = false,
```

**Headers Setup** (line 682):
```typescript
headers.set("x-current-location", currentLocation.toString());
```

### 2. slot-machine-modal.astro (Partial)

**Variable Declaration** (line 24):
```typescript
let componentId,
  title,
  // ... other vars
  currentLocation;
```

**Props Handling** (line 45):
```typescript
currentLocation = props.currentLocation || false;
```

**Headers Handling** (line 65):
```typescript
currentLocation = Astro.request.headers.get("x-current-location") === "true";
```

**Conditional Rendering** (lines 127-139):
```astro
{
  currentLocation && (
    <button
      type="button"
      id={`${componentId}-use-location-btn`}
      class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      title="Use my current location"
    >
      <SimpleIcon name="crosshair" size="sm" />
      <span>Use My Current Location</span>
    </button>
  )
}
```

## Usage

### Enable Location Button

```astro
<SlotMachineModal
  id="address-picker"
  title="Select Address"
  options={addressOptions}
  searchText="Search for addresses..."
  currentLocation={true}  <!-- Enable location button -->
/>
```

### Disable Location Button (Default)

```astro
<SlotMachineModal
  id="status-picker"
  title="Select Status"
  options={statusOptions}
  <!-- currentLocation not specified, defaults to false -->
/>
```

## UI Changes

The location button has been integrated into the search input:

- **When `currentLocation={true}`**: The search input shows a crosshair icon (📍) instead of magnifying glass
- **When `currentLocation={false}`**: The search input shows the normal magnifying glass icon
- **No separate button**: The location feature is now inline with the search field

This provides a cleaner, more intuitive UX where the location feature is directly accessible from the search input.

## Related

- See `geolocation-geocoding-api-fix.md` for details on the geocoding implementation
- Location button uses the `/api/google/geocode` endpoint for reverse geocoding
