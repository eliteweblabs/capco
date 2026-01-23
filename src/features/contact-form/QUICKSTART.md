# Contact Form - Quick Start Guide

## 🚀 Get Started in 2 Steps

### Step 1: Add to Your Page

**Option A - Direct Component:**
```astro
---
import ContactForm from "@/features/contact-form/components/ContactForm.astro";
---

<ContactForm />
```

**Option B - CMS Shortcode:**
```markdown
<ContactForm />
```

### Step 2: First Submission (Auto-Setup Detection)

1. **Test the form** - Fill it out and submit
2. **If table doesn't exist** - You'll see a helpful message with exact SQL to run
3. **Run the SQL** - Copy from server logs or `sql-queriers/create-contact-submissions-table.sql`
4. **Submit again** - Works perfectly!

That's it! The form automatically detects if setup is needed.

## ⚡ WordPress-Style Experience

While we can't auto-create tables like WordPress (Supabase security), we provide:
- ✅ **Auto-detection** of missing table
- ✅ **Exact SQL commands** in error message
- ✅ **Server logs** with complete setup code
- ✅ **One-time manual setup** then works forever

Best of both worlds: WordPress convenience + database security!

## 📋 That's It!

The form includes:
- ✅ 6-step wizard with progress bar
- ✅ Name, Email, Phone, Company fields
- ✅ **Google Places address search** (SlotMachine)
- ✅ Message textarea
- ✅ Full validation
- ✅ Success/error notifications
- ✅ Mobile responsive
- ✅ Dark mode support

## 🔍 View Submissions

Submissions are saved to `contact_submissions` table in Supabase.

View them in:
1. Supabase Dashboard → Table Editor
2. Or query directly:
   ```sql
   SELECT * FROM contact_submissions ORDER BY submitted_at DESC;
   ```

## 🎨 Customize

The form uses your site's existing design system:
- Primary colors from your theme
- Same styling as MultiStepRegisterForm
- Fully customizable via Tailwind classes

## 📱 Mobile First

Already optimized for mobile with:
- Touch-friendly buttons
- Smooth swipe gestures for SlotMachine
- Responsive text sizes
- Auto-focus on each step

## 🔐 Security

- ✅ RLS policies enabled
- ✅ Input validation
- ✅ SQL injection protection
- ⚠️ TODO: Add rate limiting for production

## Need Help?

Check the full docs: `src/features/contact-form/README.md`
