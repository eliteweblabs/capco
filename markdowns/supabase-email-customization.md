# 🎨 Customize Supabase Email Templates (Best of Both Worlds)

## 💡 **Recommended Approach**

Keep Supabase handling password reset functionality, but customize the email template to match your branding.

## 🛠 **How to Customize Supabase Email Templates**

### **Step 1: Access Email Templates**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication → Email Templates**
3. You'll see templates for:
   - Confirm signup
   - Reset password
   - Magic link
   - Email change confirmation

### **Step 2: Customize Reset Password Template**

Replace the default template with your CAPCo branding:

```html
<h2>Reset Your CAPCo Fire Protection Password</h2>

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">CAPCo Fire Protection</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <h2 style="color: #333;">Password Reset Request</h2>

    <p>Hello,</p>

    <p>
      You requested a password reset for your CAPCo Fire Protection account. Click the button below
      to reset your password:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a
        href="{{ .ConfirmationURL }}"
        style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;"
      >
        Reset My Password
      </a>
    </div>

    <p><strong>This link expires in 1 hour.</strong></p>

    <p>If you didn't request this password reset, you can safely ignore this email.</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

    <p style="color: #666; font-size: 12px;">
      This email was sent by CAPCo Fire Protection Systems.<br />
      If you're having trouble clicking the button, copy and paste this URL into your browser:<br />
      {{ .ConfirmationURL }}
    </p>
  </div>
</div>
```

### **Step 3: Test the Template**

1. Save the template in Supabase
2. Test with a password reset request
3. Verify the branding matches your other emails

## ✅ **Benefits of This Approach**

- 🎨 **Consistent branding** with your other emails
- 🔒 **Supabase handles security** (tokens, expiration, validation)
- 🚀 **Zero maintenance** - Template is set once
- 📧 **Reliable delivery** - Supabase's email infrastructure
- ⏰ **No additional development time**

## 🆚 **Comparison**

| Aspect               | Keep Supabase Default | Customize Supabase | Take Over Completely   |
| -------------------- | --------------------- | ------------------ | ---------------------- |
| **Branding**         | ❌ Generic            | ✅ Consistent      | ✅ Full Control        |
| **Maintenance**      | ✅ None               | ✅ Minimal         | ❌ High                |
| **Security**         | ✅ Battle-tested      | ✅ Battle-tested   | ⚠️ Your responsibility |
| **Development Time** | ✅ None               | ✅ 15 minutes      | ❌ 2-4 hours           |
| **Risk**             | ✅ Low                | ✅ Low             | ⚠️ Medium              |

## 🎯 **Recommendation**

**Customize the Supabase template** - you get consistent branding without the maintenance overhead!
