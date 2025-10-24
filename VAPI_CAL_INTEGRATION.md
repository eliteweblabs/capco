# Vapi.ai + Cal.com Integration

This integration allows you to use Vapi.ai voice assistants to interact with your Cal.com instance for reading/writing appointments, managing users, and checking availability.

## 🏗️ Architecture

```
Vapi.ai Assistant → Your API → Cal.com API
     ↓                ↓           ↓
Voice Commands → Webhook → Database Sync
```

## 📁 Files Created

### API Endpoints

- `src/pages/api/vapi/cal-integration.ts` - Main Cal.com integration API
- `src/pages/api/vapi/webhook.ts` - Vapi.ai webhook handler
- `src/pages/api/cal/webhook.ts` - Cal.com webhook handler

### Scripts

- `scripts/vapi-assistant-config.js` - Vapi.ai assistant configuration
- `scripts/setup-vapi-cal-integration.sh` - Setup script

### Database

- `sql-queriers/create-appointments-table.sql` - Database schema for appointments

## 🚀 Quick Setup

1. **Set Environment Variables**

```bash
# Add to your .env file
VAPI_API_KEY=your_vapi_api_key
CAL_API_KEY=your_cal_api_key
VAPI_WEBHOOK_SECRET=your_webhook_secret
SITE_URL=https://your-domain.com
```

2. **Run Setup Script**

```bash
./scripts/setup-vapi-cal-integration.sh
```

3. **Configure Cal.com Webhooks**
   - Go to your Cal.com instance: https://calcom-web-app-production-0b16.up.railway.app/settings/developer
   - Add webhook URL: `https://your-domain.com/api/cal/webhook`
   - Select events: `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`, `BOOKING_CONFIRMED`

## 🤖 Vapi.ai Assistant Features

### Voice Commands Supported

#### Appointment Management

- **"Show my appointments"** - Lists user's appointments
- **"Create an appointment"** - Guides through appointment creation
- **"Reschedule my appointment"** - Updates existing appointments
- **"Cancel my appointment"** - Cancels appointments

#### User Management

- **"Show user information"** - Displays user details
- **"Create a new user"** - Adds new users to Cal.com
- **"Update user profile"** - Modifies user information

#### Availability

- **"Check availability"** - Shows available time slots
- **"What's my schedule?"** - Displays user's calendar

### Function Calls Available

| Function             | Description        | Parameters                                                     |
| -------------------- | ------------------ | -------------------------------------------------------------- |
| `appointment_read`   | Read appointments  | `userId`, `startDate`, `endDate`                               |
| `appointment_create` | Create appointment | `eventTypeId`, `start`, `end`, `attendeeName`, `attendeeEmail` |
| `appointment_update` | Update appointment | `appointmentId`, `start`, `end`, `notes`                       |
| `appointment_cancel` | Cancel appointment | `appointmentId`, `reason`                                      |
| `user_read`          | Read user info     | `userId`, `email`                                              |
| `user_create`        | Create user        | `username`, `email`, `name`, `timeZone`                        |
| `availability_read`  | Check availability | `eventTypeId`, `userId`, `date`                                |

## 🔧 API Endpoints

### Vapi.ai Integration

```
POST /api/vapi/cal-integration
```

Handles all Cal.com operations from Vapi.ai calls.

**Request Body:**

```json
{
  "type": "appointment|user|availability|booking",
  "action": "read|write|update|delete",
  "data": {
    /* operation-specific data */
  },
  "appointmentId": "string",
  "userId": "string",
  "eventTypeId": "string"
}
```

### Vapi.ai Webhook

```
POST /api/vapi/webhook
```

Receives webhooks from Vapi.ai for call events and function calls.

### Cal.com Webhook

```
POST /api/cal/webhook
```

Receives webhooks from Cal.com for appointment changes.

## 🗄️ Database Schema

### Appointments Table

```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  cal_uid VARCHAR(255) UNIQUE NOT NULL,
  event_type_id INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  organizer_id INTEGER NOT NULL,
  organizer_name VARCHAR(255) NOT NULL,
  organizer_email VARCHAR(255) NOT NULL,
  attendees JSONB DEFAULT '[]',
  responses JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  paid BOOLEAN DEFAULT FALSE,
  payment_id VARCHAR(255),
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🧪 Testing

### Test Vapi.ai Assistant

```bash
# Test the assistant configuration
node scripts/vapi-assistant-config.js

# Make a test call (replace ASSISTANT_ID)
curl -X POST https://api.vapi.ai/call \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistantId": "ASSISTANT_ID",
    "customer": {
      "number": "+1234567890"
    }
  }'
```

### Test Cal.com Integration

```bash
# Test reading appointments
curl -X POST https://your-domain.com/api/vapi/cal-integration \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "type": "appointment",
    "action": "read"
  }'
```

## 🔐 Security

- All endpoints require authentication
- Webhook signatures are verified (implement in `verifyWebhookSignature`)
- RLS policies protect appointment data
- API keys are stored securely in environment variables

## 📊 Monitoring

### Logs to Monitor

- Vapi.ai function calls: `🤖 [VAPI-WEBHOOK] Function call:`
- Cal.com webhooks: `📅 [CAL-WEBHOOK] Received webhook:`
- Database operations: Check Supabase logs
- API errors: `❌ [VAPI-CAL] Error:`

### Key Metrics

- Appointment creation success rate
- Voice assistant response time
- Webhook delivery success
- Database sync accuracy

## 🚨 Troubleshooting

### Common Issues

1. **"Authentication required" errors**
   - Check if user is logged in
   - Verify API endpoints have proper auth

2. **Cal.com API errors**
   - Verify `CAL_API_KEY` is correct
   - Check Cal.com instance is accessible
   - Ensure API key has proper permissions

3. **Vapi.ai function call failures**
   - Check webhook URL is accessible
   - Verify function parameters match schema
   - Check Vapi.ai assistant configuration

4. **Database sync issues**
   - Check Supabase connection
   - Verify RLS policies
   - Check appointment table exists

### Debug Commands

```bash
# Check environment variables
env | grep -E "(VAPI|CAL|SITE)"

# Test webhook endpoints
curl -X POST https://your-domain.com/api/vapi/webhook
curl -X POST https://your-domain.com/api/cal/webhook

# Check database connection
psql "$SUPABASE_URL" -c "SELECT COUNT(*) FROM appointments;"
```

## 🔄 Maintenance

### Regular Tasks

1. Monitor webhook delivery success
2. Check appointment sync accuracy
3. Update Vapi.ai assistant configuration as needed
4. Review and rotate API keys periodically

### Updates

- Update Vapi.ai assistant configuration: `node scripts/vapi-assistant-config.js`
- Database migrations: Run new SQL files in `sql-queriers/`
- API endpoint updates: Deploy new code

## 📚 Resources

- [Vapi.ai Documentation](https://docs.vapi.ai/)
- [Cal.com API Reference](https://cal.com/docs/api-reference)
- [Your Cal.com Instance](https://calcom-web-app-production-0b16.up.railway.app/)
- [Vapi.ai Dashboard](https://dashboard.vapi.ai/)

## 🆘 Support

For issues with this integration:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Test individual components (Vapi.ai, Cal.com, your API)
4. Verify all environment variables are set correctly
