# Inline Save Indicator Pattern

## Overview
The inline save indicator system provides visual feedback when data is being saved using CSS `::after` pseudo-elements.

## The Problem
Input, textarea, and select elements are **void/replaced elements** that do not support `::before` or `::after` pseudo-elements. This is a fundamental browser limitation.

## The Solution
Wrap form elements with `data-refresh="true"` in a `.relative` container, so the `::after` pseudo-element can be applied to the wrapper instead.

## Usage Pattern

### ✅ CORRECT - For Input/Textarea/Select Elements
```astro
<!-- Wrap in a .relative container -->
<div class="relative inline-block">
  <input
    type="text"
    data-refresh="true"
    data-project-id={project.id}
    data-meta="fieldName"
    data-meta-value={value}
    class="..."
  />
</div>
```

### ✅ CORRECT - For Span Elements (No Wrapper Needed)
```astro
<!-- Span elements support ::after natively -->
<span
  data-refresh="true"
  data-project-id={project.id}
  data-meta="fieldName"
  data-meta-value={value}
>
  {value}
</span>
```

### ❌ INCORRECT - Input Without Wrapper
```astro
<!-- This will NOT work - inputs don't support ::after -->
<input
  type="text"
  data-refresh="true"
  class="relative"
  ...
/>
```

## CSS Implementation

The CSS uses the `:has()` pseudo-class to detect when a wrapper contains a form element with save state classes:

```css
/* Wrapper detects child input with .saving class */
.relative:has(input[data-refresh="true"].saving)::after {
  background-image: url("...");
  opacity: 1;
  animation: pulse-save 1s ease-in-out infinite;
}
```

## Save States

The system supports four visual states:

1. **Default (hidden)**: `opacity: 0` - No indicator shown
2. **Saving**: Gray disk icon with pulse animation
3. **Saved**: Green checkmark (fades after 3s)
4. **Error**: Red X icon

## State Classes

Add these classes to the input/textarea/select element (not the wrapper):

- `.saving` - Shows pulsing disk icon
- `.saved` - Shows green checkmark
- `.save-error` - Shows red X
- `.fade-out` - Triggers fade out animation

## JavaScript Integration

```javascript
const input = document.getElementById('my-input');

// Show saving state
input.classList.add('saving');
input.classList.remove('saved', 'save-error', 'fade-out');

// After save succeeds
input.classList.remove('saving');
input.classList.add('saved');

// Fade out after 3 seconds
setTimeout(() => {
  input.classList.add('fade-out');
  setTimeout(() => {
    input.classList.remove('saved', 'fade-out');
  }, 300);
}, 3000);
```

## Supported Elements

The CSS handles all common form elements:

- `input[data-refresh="true"]` (needs wrapper)
- `textarea[data-refresh="true"]` (needs wrapper)
- `select[data-refresh="true"]` (needs wrapper)
- `span[data-refresh="true"]` (no wrapper needed)

## Positioning

The indicator appears 28px to the right of the element. Make sure there's enough space or adjust the wrapper's positioning as needed.

```css
/* Indicator positioning */
right: -28px;
top: 50%;
transform: translateY(-50%);
```

## Example: Full Implementation

```astro
<div class="relative inline-block">
  <input
    type="text"
    id="field-{id}"
    value={value}
    data-refresh="true"
    data-project-id={id}
    data-meta="fieldName"
    data-meta-value={value}
    class="w-full border rounded px-2 py-1"
  />
</div>

<script>
  const input = document.getElementById('field-{id}');
  
  input.addEventListener('input', async (e) => {
    const newValue = e.target.value;
    
    // Show saving
    input.classList.add('saving');
    
    try {
      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify({ value: newValue })
      });
      
      // Show success
      input.classList.remove('saving');
      input.classList.add('saved');
      
      // Auto-hide
      setTimeout(() => {
        input.classList.add('fade-out');
        setTimeout(() => {
          input.classList.remove('saved', 'fade-out');
        }, 300);
      }, 3000);
      
    } catch (error) {
      // Show error
      input.classList.remove('saving');
      input.classList.add('save-error');
      
      setTimeout(() => {
        input.classList.remove('save-error');
      }, 3000);
    }
  });
</script>
```

## Key Takeaways

1. **Always wrap inputs/textareas/selects** with `.relative` container
2. **Spans work without wrapping** (they support `::after`)
3. **Add state classes to the form element**, not the wrapper
4. **CSS uses `:has()` to detect** child element states
5. **Indicator appears 28px to the right** of the element
