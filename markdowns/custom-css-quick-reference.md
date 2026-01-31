# Custom CSS - Quick Reference

## Access

**URL**: `/admin/settings`  
**Section**: Custom CSS (between Analytics and Typography)  
**Permission**: Admin only

## How to Use

1. Navigate to `/admin/settings`
2. Scroll to "Custom CSS" section
3. Add CSS in the textarea
4. Click "Save Settings"
5. Changes apply immediately (may need cache clear)

## Common Use Cases

### 1. Change Button Styles

```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}
```

### 2. Hide Elements

```css
.speed-dial {
  display: none !important;
}
.footer-social {
  display: none !important;
}
```

### 3. Add Custom Colors

```css
.custom-header {
  background: var(--color-primary-500);
  color: white;
}
```

### 4. Override Spacing

```css
.project-card {
  padding: 2rem !important;
  margin-bottom: 1.5rem !important;
}
```

### 5. Custom Typography

```css
h1,
h2,
h3 {
  font-family: "Georgia", serif;
  letter-spacing: -0.02em;
}
```

## Tips

✅ **Use CSS variables** for colors: `var(--color-primary-500)`  
✅ **Test in both** light and dark modes  
✅ **Add comments** to explain your changes  
✅ **Use specific selectors** to avoid affecting entire site  
✅ **Check responsive** behavior on mobile/tablet/desktop

❌ **Don't** use overly broad selectors like `*` or `div`  
❌ **Don't** forget dark mode styles (prefix with `.dark`)  
❌ **Don't** use `<script>` tags (CSS only)  
❌ **Don't** delete existing CSS rules unless intentional

## Troubleshooting

**CSS not showing?**

- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
- Check if saved successfully (look for 💾 icon)
- Inspect page source for `<style data-source="cms-custom-css">`

**Styles not working?**

- Increase specificity or add `!important`
- Check for CSS syntax errors
- Test in browser DevTools first

## Examples by Component

### Navigation

```css
nav.navbar {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}
```

### Sidebar

```css
aside {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}
```

### Cards

```css
.project-card {
  border: 2px solid var(--color-primary-500);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
```

### Footer

```css
footer {
  background: #1a1a2e;
  color: #ffffff;
  padding: 3rem 0;
}
```

## Available CSS Variables

**Primary Colors**: `var(--color-primary-50)` through `var(--color-primary-950)`  
**Secondary Colors**: `var(--color-secondary-50)` through `var(--color-secondary-950)`  
**Fonts**: `var(--font-family)` and `var(--font-family-secondary)`

## Performance

- Custom CSS is injected in `<head>` during SSR
- Minimal performance impact (single `<style>` tag)
- No additional HTTP requests
- Cached with page (fast subsequent loads)

## Related

- **Documentation**: `/markdowns/custom-css-global-settings.md`
- **Settings API**: `/api/settings/update`
- **Global Data**: `src/pages/api/global/global-company-data.ts`
