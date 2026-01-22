# CookiePreferences Component

## Overview
A reusable component that provides a complete cookie consent and preferences management interface. This component can be dropped into any page to give users control over their cookie settings.

## Location
`/src/components/common/CookiePreferences.astro`

## Usage

### Basic Usage
Drop the component anywhere in your page:

```astro
---
import CookiePreferences from "../components/common/CookiePreferences.astro";
---

<CookiePreferences />
```

### With Props
```astro
<CookiePreferences 
  showHeader={true} 
  companyName="RothCo Built" 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showHeader` | `boolean` | `true` | Whether to display the "Cookie Preferences" h1 heading and last updated date banner |
| `companyName` | `string` | `"our company"` | Company name used in the introductory text (currently not fully utilized) |

## Features

### Cookie Categories
The component manages 4 cookie categories:

1. **Essential Cookies** (Always Active)
   - Cannot be disabled
   - Required for basic site functionality
   - Authentication, security, etc.

2. **Analytics Cookies** (Toggle)
   - Track page views and interactions
   - Performance monitoring
   - Default: enabled

3. **Functional Cookies** (Toggle)
   - Language/theme preferences
   - Customization features
   - Default: enabled

4. **Marketing Cookies** (Toggle)
   - Advertising and campaigns
   - Default: disabled

### Action Buttons
- **Save Preferences**: Saves current toggle states
- **Accept All Cookies**: Enables all optional cookies
- **Reject All Optional**: Disables all optional cookies

### Local Storage
Cookie preferences are stored in `localStorage` under the key `cookiePreferences`:

```json
{
  "analytics": true,
  "functional": true,
  "marketing": false,
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

### Notifications
The component integrates with the global modal system. If `window.showModal` is available, it displays success notifications. Otherwise, it falls back to browser alerts.

## Styling
- Uses Tailwind CSS utility classes
- Dark mode support via `dark:` variants
- Responsive design (mobile-first)
- Prose typography for content

## Dependencies
- `SlideToggle.astro` - Toggle switches for cookie categories
- `Button.astro` - Action buttons

## Example Pages
See the implementation in `/src/pages/cookies.astro` for a full-page example with the App wrapper and company data.

## Notes
- The component includes inline JavaScript for preference management
- Script runs on `DOMContentLoaded` to load saved preferences
- Safe null checks on button event listeners
- Privacy Policy link points to `/privacy`
