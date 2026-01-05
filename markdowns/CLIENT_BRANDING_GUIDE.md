# Client Branding Guide

## Overview

This guide explains how to customize the visual identity of each fire protection system deployment. Each client can have unique branding while maintaining the same functionality and structure.

## 🎨 What Can Be Customized

### 1. Colors

**Primary Color** (Most Important)
- Sets the main brand color throughout the site
- Auto-generates a complete palette (50-950 shades)
- Used for buttons, links, headers, accents

**Secondary Color**
- Used for secondary UI elements
- Complements the primary color

**How It Works:**
```bash
# .env file
GLOBAL_COLOR_PRIMARY="#825BDD"  # Your brand color
GLOBAL_COLOR_SECONDARY="#0ea5e9"
```

The system automatically:
1. Generates 10 shades (50, 100, 200... 950)
2. Applies to all Tailwind `primary-*` classes
3. Updates at build time (no code changes needed)

**Choosing Colors:**
- Use your brand's main color as PRIMARY
- Ensure good contrast for accessibility
- Test with both light and dark mode
- Tools: [Coolors.co](https://coolors.co), [Adobe Color](https://color.adobe.com)

### 2. Typography

**Font Family**
- Default: "Outfit Variable" (Google Fonts)
- Can be changed to any web font

**How to Change:**
```bash
FONT_FAMILY="Roboto"
FONT_FAMILY_FALLBACK="sans-serif"
```

**Supported Fonts:**
- Any Google Font
- System fonts (Arial, Helvetica, etc.)
- Custom fonts (requires additional setup)

### 3. Logos

**Two Types Required:**

**A. Company Logo** (Used in navbar, footer, emails)
- Horizontal layout preferred
- Any aspect ratio
- SVG format recommended
- Can be inline SVG or URL

**B. Company Icon** (Used for favicon, PWA icon)
- Square format required
- Simple, recognizable at small sizes
- SVG format recommended

**Implementation Options:**

**Option 1: Inline SVG (Recommended)**
```bash
# In your .env file
GLOBAL_COMPANY_LOGO_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">...</svg>'
GLOBAL_COMPANY_ICON_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
```

**Option 2: File URLs**
1. Upload logo to `public/img/company-logo.svg`
2. Upload icon to `public/img/company-icon.svg`
3. Reference in env:
```bash
GLOBAL_COMPANY_LOGO_URL="/img/company-logo.svg"
GLOBAL_COMPANY_ICON_URL="/img/company-icon.svg"
```

**Logo Requirements:**
- **Format:** SVG preferred (scales perfectly)
- **Logo dimensions:** Typically 200x60px (approx)
- **Icon dimensions:** 512x512px (square)
- **File size:** Under 50KB recommended
- **Colors:** Should work on both light and dark backgrounds

**Making Dark Mode Compatible:**
```svg
<svg xmlns="http://www.w3.org/2000/svg">
  <style>
    .fill { fill: #000; }
    @media (prefers-color-scheme: dark) {
      .fill { fill: #fff; }
    }
  </style>
  <path class="fill" d="..."/>
</svg>
```

### 4. Company Information

All company details are customizable:

```bash
RAILWAY_PROJECT_NAME="Acme Fire Protection"
GLOBAL_COMPANY_SLOGAN="Safety First, Always"
GLOBAL_COMPANY_ADDRESS="123 Main St, City, ST 12345"
GLOBAL_COMPANY_PHONE="+15551234567"
GLOBAL_COMPANY_EMAIL="contact@acmefire.com"
RAILWAY_PUBLIC_DOMAIN="acmefire.com"
YEAR="2025"
```

**Where They Appear:**
- **Name:** Navbar, page titles, emails, documents
- **Slogan:** Homepage hero, about section
- **Address:** Footer, contact page, invoices
- **Phone:** Contact page, footer, click-to-call buttons
- **Email:** Contact forms, footer, email signatures
- **Domain:** URLs, email links, social sharing
- **Year:** Footer copyright

## 📋 Branding Checklist

### Before Starting

- [ ] Brand style guide (if available)
- [ ] Logo files (SVG preferred)
- [ ] Brand colors (hex codes)
- [ ] Company information (name, address, phone, email)
- [ ] Font preferences

### Logo Preparation

- [ ] Logo in SVG format
- [ ] Icon in SVG format (square)
- [ ] Logo works on light backgrounds
- [ ] Logo works on dark backgrounds
- [ ] Icon is recognizable at 32x32px
- [ ] Files are optimized (< 50KB each)

### Color Selection

- [ ] Primary color chosen
- [ ] Secondary color chosen
- [ ] Colors pass WCAG AA contrast requirements
- [ ] Colors tested in light mode
- [ ] Colors tested in dark mode

### Company Info

- [ ] Legal company name confirmed
- [ ] Phone number in E.164 format (+1...)
- [ ] Email address verified
- [ ] Physical address confirmed
- [ ] Domain name reserved

## 🎨 Design Best Practices

### Color Guidelines

1. **Contrast Ratios**
   - Text on background: minimum 4.5:1
   - Large text (18pt+): minimum 3:1
   - Test with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

2. **Color Psychology**
   - Blue: Trust, professionalism (common for fire protection)
   - Red: Urgency, safety, fire (use sparingly)
   - Green: Growth, success
   - Orange: Energy, attention

3. **Avoid**
   - Too many colors (stick to 2-3 main colors)
   - Colors that are too similar
   - Very bright/neon colors (hard on eyes)

### Logo Guidelines

1. **SVG Benefits**
   - Scales to any size perfectly
   - Small file size
   - Easy to style with CSS
   - Works on any background

2. **Conversion**
   - Convert PNG/JPG to SVG using [Vectorizer.AI](https://vectorizer.ai/)
   - Or redesign in [Figma](https://figma.com) / [Inkscape](https://inkscape.org/)
   - Optimize with [SVGOMG](https://jakearchibald.github.io/svgomg/)

3. **Testing**
   - View at 16x16 (favicon size)
   - View at 512x512 (PWA icon)
   - View on light background
   - View on dark background
   - View in email clients

### Typography Guidelines

1. **Font Selection**
   - Sans-serif for better readability
   - Modern but not trendy
   - Good character set (special characters)
   - Multiple weights available

2. **Recommended Fonts**
   - **Professional:** Inter, Roboto, Open Sans
   - **Modern:** Outfit, Poppins, Montserrat
   - **Classic:** Lato, Source Sans Pro, PT Sans

3. **Performance**
   - Use variable fonts when possible (fewer files)
   - Limit to 2-3 font weights
   - Self-host for better privacy/performance

## 🖼️ Asset Preparation Guide

### Step-by-Step: Logo Preparation

1. **Get Your Logo**
   - Source file from designer (AI, SVG, or high-res PNG)
   - Ensure you have rights to use it

2. **Convert to SVG** (if needed)
   - Use Vectorizer.AI for PNG/JPG
   - Export from Adobe Illustrator/Figma
   - Ensure paths are expanded (no text elements)

3. **Optimize SVG**
   - Open in SVGOMG
   - Enable all optimizations
   - Keep precision at 2-3
   - Download optimized file

4. **Make Responsive**
   - Remove fixed `width` and `height` attributes
   - Keep `viewBox` attribute
   - Add CSS class for color control

5. **Test**
   ```html
   <!-- Test in browser -->
   <div style="width: 200px; background: white;">
     <svg><!-- your logo --></svg>
   </div>
   <div style="width: 200px; background: black;">
     <svg><!-- your logo --></svg>
   </div>
   ```

6. **Copy SVG Code**
   - Open optimized SVG in text editor
   - Copy entire `<svg>...</svg>` tag
   - Paste into .env file as `GLOBAL_COMPANY_LOGO_SVG`

### Step-by-Step: Icon Preparation

1. **Start with Logo**
   - Use simplified version of main logo
   - Or create a unique icon (monogram, symbol)

2. **Make Square**
   - 512x512px canvas
   - Center icon with padding
   - Ensure it's visible at 32x32

3. **Simplify**
   - Remove fine details
   - Increase line weights
   - Use solid colors

4. **Convert & Optimize**
   - Same as logo steps 2-4 above

5. **Test at Different Sizes**
   ```html
   <img src="icon.svg" width="16">  <!-- favicon -->
   <img src="icon.svg" width="32">  <!-- small -->
   <img src="icon.svg" width="512"> <!-- large -->
   ```

## 🧪 Testing Your Branding

### Local Testing

1. **Setup Test Environment**
   ```bash
   # Copy your client config
   cp configs/client-name.env .env
   
   # Run dev server
   npm run dev
   ```

2. **Check All Pages**
   - Homepage
   - Dashboard
   - Project pages
   - Settings
   - About/Contact

3. **Test Both Modes**
   - Light mode
   - Dark mode
   - Toggle between them

4. **Test Responsive**
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)

### Visual Checklist

- [ ] Logo appears correctly in navbar
- [ ] Logo appears correctly in footer
- [ ] Logo appears correctly in emails
- [ ] Icon appears as favicon
- [ ] Primary color applied throughout
- [ ] Colors look good in light mode
- [ ] Colors look good in dark mode
- [ ] All text is readable
- [ ] Company name appears in page titles
- [ ] Company info in footer is correct
- [ ] Phone number is clickable (mobile)
- [ ] Email is clickable

### Browser Testing

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## 🚀 Deployment

Once branding is tested and approved:

```bash
# Deploy to Railway
./scripts/deploy-client.sh client-name

# Or manually
railway variables set -f configs/client-name.env
railway up
```

## 📊 Common Issues & Solutions

### Issue: Logo Not Showing

**Causes:**
- Invalid SVG syntax
- Missing viewBox attribute
- Incorrect env var name

**Solutions:**
1. Validate SVG at [validator.w3.org](https://validator.w3.org/)
2. Check env var spelling: `GLOBAL_COMPANY_LOGO_SVG`
3. Test SVG in browser directly first

### Issue: Colors Not Updating

**Causes:**
- Cached CSS
- Build didn't regenerate
- Invalid hex code

**Solutions:**
1. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear build cache: `rm -rf dist`
3. Rebuild: `npm run build`
4. Verify hex format: `#RRGGBB`

### Issue: Fonts Not Loading

**Causes:**
- Font name misspelled
- Font not imported
- CORS issues

**Solutions:**
1. Check exact font name from Google Fonts
2. Verify `FONT_FAMILY` matches import
3. For custom fonts, add to `public/fonts/`

### Issue: Dark Mode Issues

**Causes:**
- Missing dark mode variants
- Fixed color values
- Insufficient contrast

**Solutions:**
1. Use Tailwind `dark:` prefix
2. Use CSS variables for colors
3. Test contrast with [WebAIM](https://webaim.org/resources/contrastchecker/)

## 📚 Examples

### Example 1: Conservative Branding

```bash
# Professional, trustworthy, classic
RAILWAY_PROJECT_NAME="Smith Fire Protection Services"
GLOBAL_COLOR_PRIMARY="#1e40af"  # Navy blue
GLOBAL_COLOR_SECONDARY="#dc2626"  # Fire red
FONT_FAMILY="Inter"
```

### Example 2: Modern Branding

```bash
# Fresh, innovative, tech-forward
RAILWAY_PROJECT_NAME="Ignite Safety Solutions"
GLOBAL_COLOR_PRIMARY="#8b5cf6"  # Purple
GLOBAL_COLOR_SECONDARY="#06b6d4"  # Cyan
FONT_FAMILY="Outfit Variable"
```

### Example 3: Local Business

```bash
# Friendly, approachable, community-focused
RAILWAY_PROJECT_NAME="Main Street Fire Safety"
GLOBAL_COLOR_PRIMARY="#ea580c"  # Orange
GLOBAL_COLOR_SECONDARY="#16a34a"  # Green
FONT_FAMILY="Poppins"
```

## 🔗 Helpful Resources

### Design Tools
- [Figma](https://figma.com) - Design tool
- [Adobe Color](https://color.adobe.com) - Color palettes
- [Coolors](https://coolors.co) - Color generator
- [Realtime Colors](https://realtimecolors.com) - Preview color schemes

### Converters & Optimizers
- [Vectorizer.AI](https://vectorizer.ai) - PNG to SVG
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - SVG optimizer
- [TinyPNG](https://tinypng.com) - Image compression

### Testing & Validation
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Accessibility
- [W3C Validator](https://validator.w3.org/) - SVG validation
- [Responsively](https://responsively.app) - Multi-device testing

### Fonts
- [Google Fonts](https://fonts.google.com) - Free web fonts
- [Font Squirrel](https://www.fontsquirrel.com) - Free commercial fonts

## 💡 Tips & Tricks

1. **Start with Reference Sites**
   - Look at competitor sites
   - Note what works well
   - Screenshot for reference

2. **Use Brand Guidelines**
   - If client has style guide, follow it
   - Request brand assets early
   - Clarify usage rights

3. **Test Early, Test Often**
   - Don't wait until deployment
   - Test locally with real data
   - Get client approval before going live

4. **Document Decisions**
   - Keep notes on why colors were chosen
   - Document any custom adjustments
   - Maintain brand asset library

5. **Version Control**
   - Keep old configs in git
   - Tag deployments
   - Easy rollback if needed

---

## Need Help?

If you run into issues with branding:

1. Check this guide first
2. Review the main [deployment strategy](./MULTI_SITE_DEPLOYMENT_STRATEGY.md)
3. Test with default values to isolate the issue
4. Check Railway logs for build errors

Remember: The core system is proven and stable. Most issues are related to asset formats or environment variable typos. Double-check your inputs!

