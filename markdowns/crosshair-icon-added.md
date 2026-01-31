# Crosshair Icon Added to SimpleIcon System

## Summary

Added a `crosshair` icon to the SimpleIcon mapping system in `src/lib/icon-data.json`.

## Changes

- **File Modified**: `src/lib/icon-data.json`
- **Icon Name**: `crosshair`
- **Location**: Added after `credit-card` icon (line 68)

## Icon Details

- **Source**: Tabler Icons
- **ViewBox**: `0 0 24 24`
- **Style**: Outline/stroke-based icon
- **Stroke Width**: 2
- **Design**: Corner brackets with center crosshairs (+)

## Usage

The crosshair icon can now be used throughout the application with the SimpleIcon component:

```astro
<SimpleIcon name="crosshair" />
<SimpleIcon name="crosshair" size="md" />
<SimpleIcon name="crosshair" variant="primary" />
<SimpleIcon name="crosshair" class="text-blue-500" size="lg" />
```

## Icon SVG

```xml
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M4 8v-2a2 2 0 0 1 2 -2h2"/>
  <path d="M4 16v2a2 2 0 0 0 2 2h2"/>
  <path d="M16 4h2a2 2 0 0 1 2 2v2"/>
  <path d="M16 20h2a2 2 0 0 0 2 -2v-2"/>
  <path d="M9 12l6 0"/>
  <path d="M12 9l0 6"/>
</svg>
```

## Use Cases

The crosshair icon is ideal for:

- Target/aim functionality
- Location/positioning features
- Precision tools
- Scanning/focus indicators
- Camera/viewfinder UI elements
- Map marker placement
- Geolocation features

## Date

January 30, 2026
