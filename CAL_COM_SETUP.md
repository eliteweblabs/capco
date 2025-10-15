# Cal.com Integration Setup Guide

This guide will help you set up Cal.com integration for your CAPCo Fire Protection Systems application.

## Overview

The Cal.com integration allows users to book demo appointments directly through your website using Cal.com's scheduling system. When appointments are booked, cancelled, or rescheduled, webhooks will automatically update your database and send notifications to your team.

## Setup Steps

### 1. Create Cal.com Account

1. Go to [cal.com](https://cal.com) and create an account
2. Complete your profile setup
3. Create an event type for "Demo Appointments" (30 minutes recommended)

### 2. Configure Event Type

1. In your Cal.com dashboard, go to **Event Types**
2. Create a new event type called "Demo Appointment"
3. Set duration to 30 minutes
4. Configure availability (business hours, timezone)
5. Add description: "Personalized demo of our fire protection system management platform"
6. Set up location (video call, physical address, or "TBD")
7. Configure booking form fields:
   - Name (required)
   - Email (required)
   - Company (optional)
   - Phone (optional)
   - Additional notes (optional)

### 3. Get Cal.com Credentials

1. Go to **Settings** → **Developer** in your Cal.com dashboard
2. Create a new API key
3. Note your username (found in your profile URL: `cal.com/your-username`)
4. Set up webhook endpoint (see next step)

### 4. Configure Webhook

1. In Cal.com dashboard, go to **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/cal-webhook`
3. Select events to listen for:
   - `BOOKING_CREATED`
   - `BOOKING_CANCELLED`
   - `BOOKING_RESCHEDULED`
   - `BOOKING_CONFIRMED`
4. Generate webhook secret and save it

### 5. Update Environment Variables

Add these to your `.env` file:

```env
# Cal.com Integration
CAL_WEBHOOK_SECRET=your-webhook-secret-from-step-4
CAL_API_KEY=your-api-key-from-step-3
CAL_USERNAME=your-cal-username
```

### 6. Update Cal.com Embed Configuration

In `src/components/common/CalComBooking.astro`, update the `calConfig` object:

```javascript
const calConfig = {
  calLink: "your-username/demo-appointment", // Replace with your actual Cal.com link
  layout: "month_view",
  theme: "light", // or "dark"
  branding: {
    brandColor: "#2563eb", // Your brand color
    hideEventTypeDetails: false,
    hideLandingPageDetails: false,
  },
};
```

### 7. Database Setup

The integration uses the `appointments` table. Make sure you have run the SQL migration:

```sql
-- This should already be created by the appointments table migration
-- If not, run the create-appointments-table.sql file
```

### 8. Test the Integration

1. Visit `/demo` on your website
2. Try booking an appointment through the Cal.com embed
3. Check your database for the new appointment record
4. Verify that notifications are created for admin/staff users

## Features

### Automatic Database Updates
- New appointments are automatically stored in your `appointments` table
- Cancellations and reschedules are tracked
- All Cal.com booking data is preserved

### Notifications
- Admin and staff users receive notifications for new bookings
- Cancellation notifications are sent when appointments are cancelled
- Notifications include attendee details and appointment time

### User Experience
- Seamless booking experience using Cal.com's proven interface
- Mobile-responsive calendar
- Automatic timezone handling
- Email confirmations sent by Cal.com

## Customization

### Styling
The Cal.com embed can be customized in `CalComBooking.astro`:

```javascript
const calConfig = {
  calLink: "your-username/event-type",
  layout: "month_view", // or "week_view", "day_view"
  theme: "light", // or "dark"
  branding: {
    brandColor: "#your-brand-color",
    hideEventTypeDetails: false,
    hideLandingPageDetails: false,
  },
};
```

### Form Pre-filling
If users are logged in, their information can be pre-filled:

```javascript
prefill: {
  name: window.currentUser?.profile?.firstName + " " + window.currentUser?.profile?.lastName || "",
  email: window.currentUser?.email || "",
  company: window.currentUser?.profile?.companyName || "",
}
```

### Additional Event Types
You can create multiple event types in Cal.com and update the `calLink` to point to different events:

- `your-username/demo` - 30-minute demo
- `your-username/consultation` - 60-minute consultation
- `your-username/quick-call` - 15-minute quick call

## Troubleshooting

### Common Issues

1. **Calendar not loading**
   - Check that your Cal.com username is correct
   - Verify the event type slug matches exactly
   - Check browser console for JavaScript errors

2. **Webhooks not working**
   - Verify webhook URL is accessible from the internet
   - Check that webhook secret matches in both Cal.com and your environment
   - Look at server logs for webhook processing errors

3. **Database errors**
   - Ensure the `appointments` table exists
   - Check that `supabaseAdmin` is properly configured
   - Verify RLS policies allow webhook access

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_CAL_WEBHOOK=true
```

This will log detailed information about webhook processing.

## Security Notes

1. **Webhook Security**: Always verify webhook signatures to prevent unauthorized access
2. **API Keys**: Keep your Cal.com API keys secure and never commit them to version control
3. **Rate Limiting**: Cal.com has rate limits - implement proper error handling
4. **Data Privacy**: Ensure you're handling attendee data according to privacy regulations

## Support

- Cal.com Documentation: https://cal.com/docs
- Cal.com Support: https://cal.com/support
- This Integration: Check the code comments in `CalComBooking.astro` and `cal-webhook.ts`
