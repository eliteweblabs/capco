# Cal.com SMS Setup Guide

This guide explains how to enable SMS reminders in your self-hosted Cal.com instance.

## Overview

Cal.com supports SMS notifications for appointment reminders, but requires additional Twilio configuration beyond the basic voice setup. This guide covers the complete SMS setup process.

## Prerequisites

- ✅ Twilio account with voice configuration already set up
- ✅ Self-hosted Cal.com instance running
- ✅ Basic Cal.com integration working

## Step 1: Set Up Twilio Messaging Service

### 1.1 Create Messaging Service

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Develop** → **Messaging** → **Services**
3. Click **Create Messaging Service**
4. Name it "Cal.com SMS Reminders"
5. Add your Twilio phone number as a sender
6. Copy the **Messaging Service SID** (starts with `MG...`)

### 1.2 Create Verify Service

1. Navigate to **Develop** → **Verify** → **Services**
2. Click **Create Service**
3. Name it "Cal.com SMS Verification"
4. Copy the **Verify Service SID** (starts with `VA...`)

## Step 2: Update Environment Variables

Add these to your Cal.com `.env` file:

```env
# Existing Twilio Voice Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# New SMS Configuration for Cal.com
TWILIO_MESSAGING_SID=your_messaging_service_sid
TWILIO_VERIFY_SID=your_verify_service_sid
```

## Step 3: Update Docker Configuration

If using Docker, update your `docker-compose.cal.yml`:

```yaml
services:
  calcom:
    environment:
      # ... existing configuration ...

      # Twilio SMS Configuration for Cal.com SMS reminders
      TWILIO_ACCOUNT_SID: "your_account_sid"
      TWILIO_AUTH_TOKEN: "your_auth_token"
      TWILIO_PHONE_NUMBER: "your_twilio_phone_number"
      TWILIO_MESSAGING_SID: "your_messaging_service_sid"
      TWILIO_VERIFY_SID: "your_verify_service_sid"
```

## Step 4: Configure Cal.com Event Types

### 4.1 Enable SMS Reminders

1. In your Cal.com dashboard, go to **Event Types**
2. Edit your event type (e.g., "Demo Appointment")
3. Go to **Advanced** tab
4. Enable **SMS Reminders**
5. Configure reminder timing:
   - 24 hours before
   - 2 hours before
   - Custom timing

### 4.2 Set Up SMS Templates

1. Go to **Settings** → **Notifications**
2. Configure SMS templates for:
   - Booking confirmation
   - Reminder notifications
   - Cancellation notices

## Step 5: Test SMS Functionality

### 5.1 Test Booking Flow

1. Create a test booking with a real phone number
2. Check that SMS confirmation is sent
3. Verify reminder SMS are sent at configured times

### 5.2 Check Twilio Logs

1. Go to Twilio Console → **Monitor** → **Logs**
2. Look for SMS delivery logs
3. Check for any error messages

## Step 6: Configure Your Main App

Update your main application's environment variables:

```env
# Add to your main app's .env file
TWILIO_MESSAGING_SID=your_messaging_service_sid
TWILIO_VERIFY_SID=your_verify_service_sid
```

## Troubleshooting

### Common Issues

1. **SMS not sending**
   - Check Twilio credentials are correct
   - Verify phone number format (E.164: +1234567890)
   - Check Twilio account balance

2. **Cal.com not recognizing SMS settings**
   - Restart Cal.com container after adding environment variables
   - Check Cal.com logs for SMS-related errors

3. **SMS delivery failures**
   - Check Twilio delivery logs
   - Verify phone number is valid
   - Check for carrier restrictions

### Debug Commands

```bash
# Check Cal.com environment variables
docker exec calcom-app env | grep TWILIO

# View Cal.com logs
docker logs calcom-app | grep -i sms

# Test Twilio SMS directly
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json" \
  -u "{AccountSid}:{AuthToken}" \
  -d "From={TwilioPhoneNumber}" \
  -d "To={TestPhoneNumber}" \
  -d "Body=Test message from Cal.com"
```

## Cost Considerations

- **SMS Cost**: ~$0.0075 per SMS in US
- **Verify Service**: Free for first 10,000 verifications/month
- **Messaging Service**: No additional cost

## Security Notes

1. **Phone Number Validation**: Cal.com will validate phone numbers before sending SMS
2. **Opt-out Handling**: Recipients can reply "STOP" to opt out
3. **Rate Limiting**: Twilio has rate limits for SMS sending
4. **Compliance**: Ensure compliance with SMS regulations (TCPA, etc.)

## Next Steps

After SMS is working:

1. **Customize SMS Templates**: Update message content in Cal.com settings
2. **Set Up Workflows**: Configure automated SMS sequences
3. **Monitor Usage**: Track SMS costs and delivery rates
4. **Test Thoroughly**: Verify SMS works for all event types

## Support

- **Cal.com SMS Docs**: https://cal.com/docs/sms
- **Twilio SMS Docs**: https://www.twilio.com/docs/sms
- **This Integration**: Check Cal.com logs for SMS-related errors
