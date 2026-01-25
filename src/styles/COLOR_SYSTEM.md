# Global Color System

This project uses a comprehensive global color system that provides consistent colors across all components.

## Usage Methods

### 1. Tailwind Classes (Recommended)

Use the custom color names defined in `tailwind.config.mjs`:

```html
<!-- Brand Colors -->
<div class="bg-primary-500 text-white">Primary Background</div>
<div class="bg-primary-100 text-primary-700">Light Primary</div>
<div class="bg-primary-700 text-primary-100">Dark Primary</div>

<!-- Semantic Colors -->
<div class="bg-success-500 text-white">Success</div>
<div class="bg-warning-500 text-white">Warning</div>
<div class="bg-danger-500 text-white">Danger</div>

<!-- Neutral Colors -->
<div class="bg-gray-100 text-gray-900">Light Neutral</div>
<div class="bg-gray-800 text-gray-100">Dark Neutral</div>

<!-- Background Colors -->
<div class="bg-background-light dark:bg-background-dark">Adaptive Background</div>
<div class="_1jTZ8KXRZul60S6czNi SWeL9OnwkbKp0VeBUJlf">Card Background</div>

<!-- Text Colors -->
<div class="dark:text-light text-black">Primary Text</div>
<div class="text-gray-800 dark:text-gray-200">Secondary Text</div>

<!-- Border Colors -->
<div class="border border-border-light dark:border-border-dark">Adaptive Border</div>
```

### 2. CSS Custom Properties

Use CSS variables for dynamic styling:

```css
.my-component {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.my-component:hover {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}
```

### 3. Utility Classes

Use the predefined utility classes:

```html
<!-- Global Backgrounds -->
<div class="bg-global">Main Background</div>
<div class="bg-global-secondary">Secondary Background</div>
<div class="bg-global-card">Card Background</div>

<!-- Global Text -->
<div class="text-global-primary">Primary Text</div>
<div class="text-global-secondary">Secondary Text</div>
<div class="text-global-muted">Muted Text</div>

<!-- Global Borders -->
<div class="border-global-primary">Primary Border</div>
<div class="border-global-secondary">Secondary Border</div>

<!-- Global Icons -->
<i class="icon-global-primary">Icon</i>
<i class="icon-global-secondary">Secondary Icon</i>

<!-- Brand Colors -->
<div class="bg-primary text-white">Primary Background</div>
<div class="text-primary">Primary Text</div>
<div class="border-primary">Primary Border</div>

<!-- Hover States -->
<button class="hover-bg-primary bg-primary text-white">Hover Button</button>
```

## Color Palette

### Brand Colors

- **Primary**: Purple theme (#825BDD to #230e5a)
- **Secondary**: Blue theme (#0ea5e9 to #082f49)

### Semantic Colors

- **Success**: Green theme (#22c55e to #052e16)
- **Warning**: Orange theme (#f59e0b to #451a03)
- **Danger**: Red theme (#ef4444 to #450a0a)

### Neutral Colors

- **Neutral**: Gray theme (#fafafa to #0a0a0a)

## Dark Mode Support

All colors automatically adapt to dark mode using the `dark:` prefix in Tailwind or CSS custom properties that change based on the `.dark` class.

## Examples

### Button Component

```html
<button class="rounded bg-primary-500 px-4 py-2 text-white hover:bg-primary-600">
  Primary Button
</button>

<button class="rounded bg-success-500 px-4 py-2 text-white hover:bg-success-600">
  Success Button
</button>
```

### Card Component

```html
<div
  class="_1jTZ8KXRZul60S6czNi SWeL9OnwkbKp0VeBUJlf rounded-lg border border-border-light p-6 dark:border-border-dark"
>
  <h3 class="dark:text-light mb-2 text-xl font-semibold text-black">Card Title</h3>
  <p class="text-gray-800 dark:text-gray-200">Card content goes here.</p>
</div>
```

### Navigation

```html
<nav
  class="border-b border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark"
>
  <a href="#" class="dark:text-light text-black hover:text-primary-600"> Navigation Link </a>
</nav>
```

## Best Practices

1. **Use Tailwind classes** for most styling
2. **Use CSS custom properties** for dynamic styling or complex components
3. **Use utility classes** for common patterns
4. **Always consider dark mode** with `dark:` prefixes
5. **Test both light and dark themes** during development
6. **Use semantic colors** for status indicators (success, warning, danger)
7. **Use neutral colors** for text and backgrounds
8. **Use brand colors** for primary actions and branding

## Customization

To modify colors, update either:

- `tailwind.config.mjs` for Tailwind classes
- `src/styles/colors.css` for CSS custom properties and utility classes

Both files are synchronized to maintain consistency.
