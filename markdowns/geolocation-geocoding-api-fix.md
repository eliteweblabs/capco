# Geolocation Geocoding API Fix

**Date:** 2026-01-30
**Component:** SlotMachineModal.astro
**Issue:** 400 Bad Request error when using "Use My Location" button

## Problem

The geolocation feature in SlotMachineModal was calling the wrong API endpoint:

```javascript
// ❌ WRONG: Was calling places-autocomplete with latlng parameter
const response = await fetch(`${fetchApiEndpoint}?latlng=${latitude},${longitude}`);
```

The `/api/google/places-autocomplete` endpoint expects:

- `input` parameter (required) - text search query
- `locationBias` parameter (optional) - for biasing results near a location

It's designed for **autocomplete** (text search), not **reverse geocoding** (coordinates → address).

## Solution

### 1. Created New Geocoding API Endpoint

Created `/src/pages/api/google/geocode.ts` that properly handles:

- **Reverse geocoding**: `latlng` parameter (converts coordinates to address)
- **Forward geocoding**: `address` parameter (converts address to coordinates)

**Important:** The endpoint uses Google's **Places API (searchNearby)** instead of the Geocoding API because:

- The Geocoding API requires separate enablement in Google Cloud Console
- The Places API is already enabled and provides reverse geocoding functionality
- Using searchNearby with location coordinates returns nearby addresses

### 2. Updated SlotMachineModal Geolocation Handler

Changed the geolocation button handler to use the dedicated geocode endpoint:

```javascript
// ✅ CORRECT: Using dedicated geocode endpoint
const geocodeEndpoint = "/api/google/geocode";
const response = await fetch(`${geocodeEndpoint}?latlng=${latitude},${longitude}`);
```

Also removed the unnecessary `if (fetchApiEndpoint)` check since geocoding should always use its own endpoint.

## Files Changed

1. **Created:** `/src/pages/api/google/geocode.ts` - New geocoding API endpoint
2. **Modified:** `/src/components/form/SlotMachineModal.astro` - Updated geolocation handler (lines 758-813)

## Testing

To test the fix:

1. Open a page with SlotMachineModal that has address search (e.g., project form)
2. Click the "Use My Location" button (📍 icon)
3. Allow browser location access
4. Verify that nearby addresses populate the options list
5. Check console for successful geocoding logs

## Expected Behavior

When user clicks "Use My Location":

1. Browser requests location permission
2. Coordinates are obtained: `42.5516295666599, -70.88294226749905`
3. Geocode API is called: `GET /api/google/geocode?latlng=42.5516295666599,-70.88294226749905`
4. Google Places API (searchNearby) returns nearby addresses within 100m radius
5. Addresses populate the slot machine options
6. First result auto-fills the search input

## Related Endpoints

- `/api/google/places-autocomplete` - For text-based address search (autocomplete)
- `/api/google/geocode` - For coordinate-based geocoding (reverse geocoding)

Both endpoints are now properly separated by their use cases.
