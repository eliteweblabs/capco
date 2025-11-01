# Campfire Chat Widget Setup Guide

## 🚀 Quick Setup

### Step 1: Get Your Campfire Chat Widget Code

1. Log in to your Campfire Chat dashboard (deployed on Railway)
2. Navigate to **Settings** → **Widget** or **Integrations**
3. Copy your:
   - **Widget ID** (if available)
   - **Campfire URL** (your Railway deployment URL)

### Step 2: Set Environment Variables

In your Railway project dashboard (main app), go to **Variables** and add:

```bash
# Campfire Chat Configuration
CAMPFIRE_URL=https://capco-campfire-chat.railway.app
CAMPFIRE_WIDGET_ID=your_widget_id_here

# OR use PUBLIC_ prefix if you need client-side access
PUBLIC_CAMPFIRE_URL=https://capco-campfire-chat.railway.app
PUBLIC_CAMPFIRE_WIDGET_ID=your_widget_id_here
```

**Note**: 
- Use `PUBLIC_` prefix if the variables need to be accessible in the browser
- If your Campfire deployment uses a different URL structure, adjust accordingly

### Step 3: Widget is Already Integrated

The Campfire Chat widget is already integrated in `src/components/common/Footer.astro`. It will automatically:
- Load when the page loads
- Position itself in the bottom-right corner
- Match your site's theme (light/dark mode)
- Pass user information if available

### Step 4: Customize (Optional)

#### Change Widget Position

Edit `src/components/common/Footer.astro`:

```astro
<!-- Change position: bottom-right or bottom-left -->
<CampfireChatWidget {currentUser} position="bottom-left" theme="auto" />
```

#### Change Theme

```astro
<!-- Change theme: light, dark, or auto -->
<CampfireChatWidget {currentUser} position="bottom-right" theme="dark" />
```

#### Add to Different Location

You can add the widget to any component:

```astro
---
import CampfireChatWidget from "@/components/common/CampfireChatWidget.astro";
---

<CampfireChatWidget {currentUser} />
```

## 🔧 Troubleshooting

### Widget Not Appearing

1. **Check Environment Variables**:
   - Verify `CAMPFIRE_URL` or `CAMPFIRE_WIDGET_ID` is set in Railway
   - Check browser console for errors

2. **Check Console Logs**:
   - Open browser DevTools (F12)
   - Look for `[CAMPFIRE-WIDGET]` messages
   - Verify the widget script is loading

3. **Verify Campfire Deployment**:
   - Ensure your Campfire Chat service is running on Railway
   - Check that the URL is accessible

### Widget Script Loading Errors

If you see errors about the widget script not loading:

1. **Check the Widget Embed Code**:
   - The component expects either:
     - A widget ID (standard Campfire embed)
     - A direct Campfire URL (self-hosted)
   
2. **Update the Component**:
   - If Campfire provides a different embed script, update `src/components/common/CampfireChatWidget.astro`
   - Replace the script loading logic with Campfire's actual embed code

### Example: Using Campfire's Official Embed Code

If Campfire provides an embed snippet like this:

```html
<script src="https://your-campfire-instance.com/widget.js" data-widget-id="abc123"></script>
```

Update the component's script section to use their exact code format.

## 📝 Integration Methods

The component supports two methods:

### Method 1: Widget ID (Recommended)
Uses Campfire's widget ID for standard embedding.

```bash
CAMPFIRE_WIDGET_ID=abc123
```

### Method 2: Direct URL
Uses your self-hosted Campfire instance URL.

```bash
CAMPFIRE_URL=https://capco-campfire-chat.railway.app
```

## 🎨 Customization

### User Information

The widget automatically passes user information if available:
- User ID
- Email
- Name/Company Name

This allows Campfire to:
- Pre-fill user details
- Show user status
- Personalize the chat experience

### Styling

The widget container can be styled via CSS. Edit the `<style>` section in `CampfireChatWidget.astro`:

```css
#campfire-chat-widget-container {
  /* Your custom styles */
}
```

## ✅ Verification

After setup:

1. **Visit your website**
2. **Check browser console** - should see: `✅ [CAMPFIRE-WIDGET] Campfire widget loaded successfully`
3. **Look for chat button** - should appear in bottom-right corner
4. **Test chat** - click the button and send a test message

## 📚 Additional Resources

- [Campfire Chat Help Center](https://help.meetcampfire.com/)
- [Campfire Chat Documentation](https://docs.campfire.so/)
- Railway deployment: Check `RAILWAY_CAMPFIRE_DEPLOYMENT.md`

