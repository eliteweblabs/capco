# Inline Address Search Component

## Overview

Created a new `InlineAddressSearch.astro` component that renders address search functionality directly inline without requiring a modal or button interaction. This was specifically designed for the contact form's address step.

## Component Location

`/src/components/form/InlineAddressSearch.astro`

## Key Features

- **Inline Rendering**: Displays search input and results list directly on the page
- **Google Places Integration**: Connects to `/api/google/places-autocomplete` endpoint
- **Keyboard Navigation**: Supports arrow keys and Enter for selection
- **Auto-Search**: Debounced search with 300ms delay
- **Hidden Input**: Stores selected value for form submission
- **Empty State**: Shows map pin icon and message when no results

## Usage Example

```astro
<InlineAddressSearch
  id="contact-address"
  name="address"
  placeholder="Search for an address..."
  fetchApiEndpoint="/api/google/places-autocomplete"
  apiParams={{
    types: "address",
    components: "country:us",
    locationBias: "circle:100@42.3601,-71.0589",
  }}
  valueField="description"
  labelField="description"
  noResultsText="Type to search addresses..."
  {globalInputClasses}
/>
```

## Props

- `id` (required): Unique identifier
- `name` (optional): Form field name (defaults to id)
- `placeholder` (optional): Search input placeholder
- `globalInputClasses` (optional): CSS classes for input styling
- `fetchApiEndpoint` (optional): API endpoint for search (default: `/api/google/places-autocomplete`)
- `apiParams` (optional): Additional API parameters
- `valueField` (optional): Field name for value (default: "description")
- `labelField` (optional): Field name for label (default: "description")
- `noResultsText` (optional): Empty state message

## Generated Elements

The component generates:
1. Hidden input: `{id}-value` - stores selected address value
2. Search input: `{id}-search-input` - visible search field
3. Results list: `{id}-results-list` - dynamic results container
4. Empty state: `{id}-empty-state` - shown when no results

## Integration with ContactForm

Replaced `SlotMachineModal` with `InlineAddressSearch` in Step 6 of the contact form:

**Before:**
- Required button click to open modal
- Complex modal overlay system
- Slot machine picker interface

**After:**
- Direct inline search and selection
- Simpler UX - no modal interaction
- Results appear immediately as user types

## Validation

The contact form validation still works with the new component:
- Checks for `contact-address-value` hidden input
- Shows error if no address selected on step 6

## Reset Logic

Form reset now clears both:
- `contact-address-value` (hidden input)
- `contact-address-search-input` (visible search input)

## Custom Events

The component dispatches a custom event when an address is selected:

```javascript
window.addEventListener('inline-address-select', (e) => {
  const { componentId, value, label, data } = e.detail;
  // componentId: "contact-address"
  // value: Selected address value
  // label: Display text
  // data: Full result object
});
```

## Differences from SlotMachineModal

| Feature | SlotMachineModal | InlineAddressSearch |
|---------|------------------|---------------------|
| Rendering | Modal overlay | Inline on page |
| Interaction | Button → Modal | Direct search |
| Selection UI | Slot machine scroll | Simple list |
| Complexity | High (1700+ lines) | Low (~300 lines) |
| Use Case | General picker | Address search only |

## When to Use

Use `InlineAddressSearch` when:
- You want address search directly on the page
- Modal interactions are unnecessary
- Simple list selection is preferred

Use `SlotMachineModal` when:
- You need a generic picker for various data
- Modal interaction is preferred
- Slot machine UI is desired
