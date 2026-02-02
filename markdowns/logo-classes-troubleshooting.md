# Logo Classes Troubleshooting Guide

## Issue: Classes Not Applying After Saving in CMS

### Quick Checks

1. **Verify the value was saved to the database**
   ```sql
   SELECT key, value FROM "globalSettings" WHERE key = 'logoClasses';
   ```
   - Should return a row with your classes
   - If no row exists, the save didn't work

2. **Check the browser console (F12 → Console)**
   - Look for debug logs starting with `[Logo]`
   - These show what classes are being loaded and applied
   - Only appears in development mode

3. **Clear the cache**
   - The app caches settings for 60 seconds
   - After saving, wait 60 seconds OR restart the dev server
   - Cache is automatically cleared on successful save

4. **Inspect the rendered HTML**
   - Right-click the logo → Inspect Element
   - Check the `<a class="logo-svg-wrapper ...">` element
   - Verify the classes are present in the HTML

### Common Issues

#### 1. Classes Save But Don't Appear

**Symptom**: Database shows the classes, but they're not in the HTML.

**Solution**:
- Restart your dev server to clear the module cache
- The settings are cached for 60 seconds
- Check browser console for `[Logo]` debug logs

#### 2. Classes Are in HTML But Don't Work

**Symptom**: Classes appear in the HTML but styling doesn't apply.

**Possible Causes**:
- Tailwind classes not in safelist
- Class conflicts with existing styles
- Dark mode overrides

**Solution**:
```javascript
// Check if Tailwind is seeing your classes
// In browser console:
document.querySelector('.logo-svg-wrapper').classList
// Should show all your classes

// Check computed styles:
getComputedStyle(document.querySelector('.logo-svg-wrapper'))
```

#### 3. Prop Classes Override Database Classes

**Symptom**: Setting classes in CMS but component prop classes take precedence.

**How It Works Now**:
Classes are **merged**, not replaced:
- Component prop: `"mr-4 flex"`
- Database: `"h-10 w-auto"`
- Result: `"mr-4 flex h-10 w-auto"`

#### 4. Cache Issues

**Symptom**: Old classes still showing after update.

**Solution**:
```bash
# Clear all caches:
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
2. Restart dev server
3. Clear browser cache
4. Check database value is correct
```

### Debug Process

1. **Check Database**
   ```sql
   -- See what's actually saved
   SELECT * FROM "globalSettings" WHERE key = 'logoClasses';
   ```

2. **Check Server Logs**
   - Dev server console should show `[Logo]` debug output
   - Shows: logoClassesFromDb, propClassName, Final className

3. **Check Browser**
   ```javascript
   // In browser console:
   
   // See the element
   document.querySelector('.logo-svg-wrapper')
   
   // See all classes
   Array.from(document.querySelector('.logo-svg-wrapper').classList)
   
   // See computed styles
   getComputedStyle(document.querySelector('.logo-svg-wrapper'))
   ```

4. **Verify API Response**
   ```bash
   # Check if API returns logoClasses
   curl http://localhost:4321/api/global/company-data | jq '.logoClasses'
   ```

### Force Clear Cache

If classes still aren't updating:

```typescript
// In your code, temporarily add:
import { clearSettingsCache } from './src/pages/api/global/global-company-data';
clearSettingsCache();
```

Or restart the entire application.

### Example Working Flow

1. Go to `/admin/settings`
2. Enter `"h-12 w-auto text-primary-600"` in Logo CSS Classes
3. Click Save Settings
4. Wait for success message
5. Hard refresh the page (Cmd+Shift+R)
6. Inspect logo element
7. Verify classes are present

### Still Not Working?

Check these files for issues:

1. `/src/components/ui/Logo.astro` - Line 92-96 (class merging logic)
2. `/src/pages/api/global/global-company-data.ts` - Line 95 (logoClasses return)
3. `/src/pages/admin/settings.astro` - Form field mapping
4. Database `globalSettings` table - key must be 'logoClasses' (camelCase)

### Test Query

Run this to manually test:

```sql
-- Update logoClasses manually
UPDATE "globalSettings" 
SET value = 'h-16 w-auto text-blue-500' 
WHERE key = 'logoClasses';

-- If row doesn't exist, insert it
INSERT INTO "globalSettings" (key, value, category, "valueType")
VALUES ('logoClasses', 'h-16 w-auto text-blue-500', 'logos', 'text')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

Then:
1. Restart dev server
2. Hard refresh browser
3. Check logo

If this works, the issue is with the form save, not the display logic.
