# Custom CSS Feature - Visual Examples

## Feature Location

```
Admin Dashboard → Settings → Custom CSS Section
URL: /admin/settings#custom-css
```

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Global Settings                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Analytics Settings Section]                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Custom CSS                                               💾 │
│  Add custom CSS to override styles or add unique styling    │
│                                                              │
│  ⚠️ Advanced: Only use if familiar with CSS                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ /* Example: Override button styles */               │   │
│  │ .btn-primary {                                       │   │
│  │   background-color: #ff6b6b;                         │   │
│  │   border-radius: 12px;                               │   │
│  │ }                                                     │   │
│  │                                                       │   │
│  │ /* Example: Custom utility class */                 │   │
│  │ .custom-highlight {                                  │   │
│  │   background: linear-gradient(...);                  │   │
│  │ }                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Enter custom CSS rules. Use CSS variables like            │
│  var(--color-primary-500) for consistent theming.          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [Typography Section]                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Example Transformations

### Before Custom CSS

```
┌──────────────────────────────────────┐
│  CAPCO Design Group                  │
├──────────────────────────────────────┤
│  [Standard Purple Button]            │
│  [Standard Card Layout]              │
│  [Standard Footer]                   │
└──────────────────────────────────────┘
```

### After Custom CSS

```css
/* Custom CSS Applied */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.project-card {
  border: 2px solid var(--color-primary-500);
  border-radius: 16px;
  padding: 2rem;
}

footer {
  background: #1a1a2e;
  padding: 3rem 0;
}
```

```
┌──────────────────────────────────────┐
│  CAPCO Design Group                  │
├──────────────────────────────────────┤
│  [Gradient Purple Button] ✨         │
│  [Card with Border & Padding] ✨     │
│  [Dark Styled Footer] ✨             │
└──────────────────────────────────────┘
```

## Real-World Use Cases

### 1. Branding Override
**Client**: CAPCO Design Group  
**Requirement**: Match exact brand colors from style guide  
**Solution**:
```css
.btn-primary {
  background: #825BDD; /* Exact CAPCO purple */
  border-radius: 8px;
}

.navbar {
  background: rgba(130, 91, 221, 0.95);
}
```

### 2. Hide Unwanted Features
**Client**: Rothco Built  
**Requirement**: Remove speed dial and social links  
**Solution**:
```css
.speed-dial,
.footer-social {
  display: none !important;
}
```

### 3. Custom Typography
**Client**: Enterprise Client  
**Requirement**: Use custom font stack  
**Solution**:
```css
h1, h2, h3 {
  font-family: 'Georgia', 'Times New Roman', serif;
  letter-spacing: -0.02em;
}

.project-title {
  font-size: 2.5rem;
  font-weight: 700;
}
```

### 4. Dark Mode Adjustments
**Client**: Tech Startup  
**Requirement**: Darker dark mode  
**Solution**:
```css
.dark body {
  background: #0a0a0a;
}

.dark .card {
  background: #111;
  border: 1px solid #222;
}
```

### 5. Animation Enhancements
**Client**: Creative Agency  
**Requirement**: Add hover effects  
**Solution**:
```css
.project-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(130, 91, 221, 0.4);
}
```

## Component Targeting Guide

### Navigation
```css
/* Target navbar */
nav.navbar { ... }

/* Target nav links */
nav a { ... }

/* Target active link */
nav a.active { ... }
```

### Sidebar
```css
/* Target aside */
aside { ... }

/* Target sidebar items */
aside .sidebar-item { ... }
```

### Projects
```css
/* Target project cards */
.project-card { ... }

/* Target project list */
.project-list { ... }

/* Target project dashboard */
.project-dashboard { ... }
```

### Buttons
```css
/* Primary buttons */
.btn-primary { ... }

/* Secondary buttons */
.btn-secondary { ... }

/* All buttons */
button, .btn { ... }
```

### Forms
```css
/* Input fields */
input[type="text"],
input[type="email"],
textarea { ... }

/* Labels */
label { ... }

/* Form sections */
.form-section { ... }
```

### Footer
```css
/* Footer container */
footer { ... }

/* Footer links */
footer a { ... }

/* Footer social */
.footer-social { ... }
```

## Testing Workflow

### Step 1: Open Browser DevTools
```
Chrome/Edge: F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
Firefox: F12 or Cmd+Option+K (Mac) / Ctrl+Shift+K (Windows)
Safari: Cmd+Option+I (Mac)
```

### Step 2: Test CSS in Console
```javascript
// Test CSS before adding to settings
const style = document.createElement('style');
style.textContent = `
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
`;
document.head.appendChild(style);

// If it looks good, copy to Custom CSS settings
// If not, remove and try again:
style.remove();
```

### Step 3: Add to Settings
1. Copy working CSS from DevTools
2. Go to `/admin/settings`
3. Paste into Custom CSS textarea
4. Click "Save Settings"
5. Reload page

### Step 4: Verify
1. Inspect element with DevTools
2. Look for styles under `<style data-source="cms-custom-css">`
3. Verify CSS is being applied
4. Check in both light and dark modes

## Common Patterns

### Responsive Design
```css
/* Mobile first */
.custom-element {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .custom-element {
    padding: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .custom-element {
    padding: 2rem;
  }
}
```

### Theme Variables
```css
/* Use existing theme colors */
.custom-card {
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  color: var(--color-primary-900);
}

.dark .custom-card {
  background: var(--color-primary-900);
  border: 1px solid var(--color-primary-700);
  color: var(--color-primary-50);
}
```

### Utility Classes
```css
/* Create reusable utilities */
.shadow-custom {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.gradient-text {
  background: linear-gradient(120deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.rounded-custom {
  border-radius: 16px;
}
```

## Troubleshooting Visual Guide

### Issue: CSS Not Applying

```
1. Check DevTools Console
   └─> Look for syntax errors

2. Inspect Element
   └─> Find <style data-source="cms-custom-css">
   └─> Verify CSS is present

3. Check Specificity
   └─> Your selector may be too weak
   └─> Try more specific selector or !important

4. Clear Cache
   └─> Hard reload: Cmd+Shift+R / Ctrl+Shift+R
```

### Issue: Only Works in Light Mode

```
Solution: Add dark mode styles

✗ .custom-element { color: black; }

✓ .custom-element { color: black; }
  .dark .custom-element { color: white; }
```

### Issue: Breaks on Mobile

```
Solution: Test responsive behavior

✗ .custom-element { width: 1000px; }

✓ .custom-element { 
    width: 100%; 
    max-width: 1000px; 
  }
```

## Performance Tips

✅ **Good**: Specific selectors
```css
.project-card .btn-primary { ... }
```

❌ **Bad**: Universal selectors
```css
* { ... }
div { ... }
```

✅ **Good**: Minimal rules
```css
.custom-highlight {
  background: var(--color-primary-500);
  color: white;
}
```

❌ **Bad**: Excessive rules
```css
.custom-highlight {
  /* 500 lines of CSS */
}
```

## Keyboard Shortcuts

**In Custom CSS Textarea**:
- Tab: Indent
- Shift+Tab: Outdent
- Cmd/Ctrl + A: Select all
- Cmd/Ctrl + /: Comment (if editor supports)

**In DevTools**:
- Cmd/Ctrl + F: Find in styles
- Cmd/Ctrl + Shift + C: Inspect element
- Esc: Toggle console

## Quick CSS Snippets Library

Copy-paste ready examples:

### Gradient Button
```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}
```

### Glass Morphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Smooth Shadows
```css
.elevated-card {
  box-shadow: 
    0 2px 4px rgba(0,0,0,0.05),
    0 8px 16px rgba(0,0,0,0.1);
}
```

### Animated Underline
```css
.link-animated {
  position: relative;
}

.link-animated::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary-500);
  transition: width 0.3s ease;
}

.link-animated:hover::after {
  width: 100%;
}
```
