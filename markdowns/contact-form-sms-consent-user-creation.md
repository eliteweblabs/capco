# Contact Form with SMS Consent & User Profile Creation

## Overview
Multi-step contact form that collects user information, SMS consent, and automatically creates/updates user profiles.

## Form Flow (7 Steps)

1. **Name** - First and Last name
2. **Email** - Email address
3. **Phone** - Phone number
4. **SMS Consent** - New step asking for SMS permission
   - Two buttons: "no" (outline) | "yes" (primary)
   - Disclaimer: "Not for marketing. Communication and project updates only."
5. **Company** - Company name
6. **Address** - Address lookup via Google Places API
7. **Message** - User's message/inquiry

## SMS Consent Step Details

### UI
- Large heading: "contact via SMS?"
- Subtext: "Not for marketing. Communication and project updates only."
- Two choice buttons on the right side (no back/next combo)
  - "no" button (outline variant)
  - "yes" button (primary variant)
- Hidden input stores the consent value (`true`/`false`)

### Implementation
```astro
<input type="hidden" name="smsConsent" id="contact-sms-consent" value="" />
```

JavaScript handles the button clicks and stores the value before advancing to next step.

## User Profile Creation/Update

### Logic
When a contact form is submitted:

1. **Check if user exists** by email in `profiles` table
2. **If exists**: Update profile with new information if changed
   - Updates: name, phone, company, smsConsent
3. **If new**: Create a new profile entry
   - Uses temporary ID format: `contact-{timestamp}-{random}`
   - Role: "Client"
   - Stores all contact information

### Database Fields Added
- `smsConsent` (BOOLEAN) - tracks SMS permission
- `userId` (TEXT) - links to profiles table

## Email Notifications

### To Admins
- Subject: "🔔 New Contact Form Submission - {Name}"
- Includes all submitted information
- Shows SMS consent status with ✅ if true
- "Reply to {Name}" button

### To Submitter
- Subject: "Thank you for contacting {Company Name}"
- Confirmation message
- Shows their submitted message
- Reassures them of response

## Database Schema

### contactSubmissions Table
```sql
CREATE TABLE "contactSubmissions" (
  id SERIAL PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  "smsConsent" BOOLEAN DEFAULT false,
  company TEXT,
  address TEXT,
  message TEXT NOT NULL,
  "userId" TEXT,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
- `email` - for quick lookups
- `userId` - for profile association
- `submittedAt` DESC - for chronological sorting

## Files Modified

1. `src/features/contact-form/components/ContactForm.astro`
   - Added Step 4 (SMS Consent)
   - Updated all subsequent step numbers (5-7)
   - Updated totalSteps to 7
   - Added SMS choice button handler
   - Updated progress bar text

2. `src/pages/api/contact/submit.ts`
   - Added SMS consent extraction
   - Added user profile creation/update logic
   - Updated email templates to show SMS consent
   - Updated database insert to include userId and smsConsent

3. `sql-queriers/create-contactSubmissions-table.sql`
   - New SQL file for table creation

## Usage

1. Run SQL to create table: `sql-queriers/create-contactSubmissions-table.sql`
2. Users fill out the contact form
3. System automatically creates/updates their profile
4. Admins receive notification email
5. User receives confirmation email
6. Data stored in `contactSubmissions` with profile link

## Environment Variables Required

```env
PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SECRET=your_service_role_key
EMAIL_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name
```

## Future Enhancements

- [ ] SMS sending for users who opt-in
- [ ] Admin dashboard to view submissions
- [ ] Follow-up email automation
- [ ] Integration with CRM system
- [ ] Export submissions to CSV
