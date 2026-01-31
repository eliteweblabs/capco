# Practical Use Cases for mobileClickable Tooltips

## Where to Apply This Feature in the Codebase

### 1. Info Icons in Forms
**Location**: Form fields that have info/help icons
**Before**:
```astro
<Tooltip text="This field is required" position="right" open={true}>
  <SimpleIcon name="info-circle" />
</Tooltip>
```

**After**:
```astro
<Tooltip text="This field is required" position="right" mobileClickable={true}>
  <span class="cursor-pointer">
    <SimpleIcon name="info-circle" />
  </span>
</Tooltip>
```

### 2. Status Indicators
**Location**: Project status, file status, or any status badges
**Before**: Tooltips don't work on mobile

**After**:
```astro
<Tooltip text="Approved by admin on Jan 30, 2026" position="top" mobileClickable={true}>
  <span class="cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
    Approved
  </span>
</Tooltip>
```

### 3. User Avatars (Non-clickable)
**Location**: Display user info on hover/tap without navigation
**Use Case**: Show user details without navigating to profile

```astro
<Tooltip text="John Doe - Admin - Last active 2 hours ago" position="bottom" mobileClickable={true}>
  <span class="cursor-pointer">
    <img src={user.avatar} alt={user.name} class="h-8 w-8 rounded-full" />
  </span>
</Tooltip>
```

### 4. Inline Text Explanations
**Location**: Documentation, help text, technical terms
**Use Case**: Explain terminology without disrupting reading flow

```astro
<p>
  The system uses 
  <Tooltip text="Row Level Security - database access control at row level" mobileClickable={true}>
    <span class="cursor-pointer text-blue-600 underline decoration-dotted">RLS</span>
  </Tooltip>
  to protect data.
</p>
```

### 5. Truncated Content Preview
**Location**: Tables or lists with truncated text
**Use Case**: Show full content on hover/tap

```astro
<Tooltip text={fullAddress} position="top" mobileClickable={true}>
  <span class="cursor-pointer truncate max-w-xs block">
    {truncatedAddress}
  </span>
</Tooltip>
```

### 6. Icon-only Actions (Non-clickable indicators)
**Location**: Status icons that show information but don't trigger actions

```astro
<Tooltip text="SSL Certificate Valid" position="right" mobileClickable={true}>
  <span class="cursor-pointer text-green-500">
    <SimpleIcon name="shield-check" />
  </span>
</Tooltip>
```

### 7. File Type Indicators
**Location**: File listings with type icons

```astro
<Tooltip text="PDF Document - 2.5MB" position="top" mobileClickable={true}>
  <span class="cursor-pointer">
    <SimpleIcon name="file-pdf" />
  </span>
</Tooltip>
```

## Where NOT to Use

### ❌ Buttons
```astro
<!-- DON'T DO THIS - button needs click for its action -->
<Tooltip text="Save changes" mobileClickable={true}>
  <button onclick="save()">Save</button>
</Tooltip>

<!-- DO THIS INSTEAD -->
<Tooltip text="Save changes" open={true}>
  <button onclick="save()">Save</button>
</Tooltip>
```

### ❌ Links
```astro
<!-- DON'T DO THIS - link needs click for navigation -->
<Tooltip text="Go to profile" mobileClickable={true}>
  <a href="/profile">Profile</a>
</Tooltip>

<!-- DO THIS INSTEAD -->
<Tooltip text="Go to profile" open={true}>
  <a href="/profile">Profile</a>
</Tooltip>
```

### ❌ Form Inputs
```astro
<!-- DON'T DO THIS - input needs tap for focus -->
<Tooltip text="Enter your email" mobileClickable={true}>
  <input type="email" />
</Tooltip>

<!-- DO THIS INSTEAD - put tooltip on label or info icon -->
<label>
  Email
  <Tooltip text="We'll never share your email" mobileClickable={true}>
    <span class="cursor-pointer ml-1">
      <SimpleIcon name="info-circle" size="sm" />
    </span>
  </Tooltip>
</label>
<input type="email" />
```

## Implementation Checklist

When adding `mobileClickable` tooltips:

1. ✅ Ensure the element is **non-interactive** (not a button, link, or input)
2. ✅ Add `cursor-pointer` class to the wrapper/span for visual feedback
3. ✅ Set `mobileClickable={true}` on the Tooltip component
4. ✅ Choose appropriate `position` (top, bottom, left, right)
5. ✅ Test on mobile device or dev tools mobile emulation
6. ✅ Verify tooltip doesn't conflict with any existing click handlers

## Testing Your Implementation

1. **Desktop Test**: Hover should work normally
2. **Mobile Test**: 
   - Tap element to show tooltip
   - Tap again to hide tooltip
   - Tap outside to hide tooltip
3. **Accessibility Test**: Ensure tooltip content is also in title/aria-label for screen readers

## Performance Considerations

- The script only initializes if `.mobile-clickable-tooltip` elements exist
- Touch detection happens once on page load
- Event listeners are only added on touch devices
- No performance impact on desktop devices
