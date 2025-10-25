# VAPI.ai Booking Agent - WORKING SOLUTION

## Overview

This is a **SIMPLIFIED, WORKING** voice booking agent using VAPI.ai for CAPCO Fire Protection Systems. The system enables automated appointment scheduling via phone calls.

## ✅ Current Status: FUNCTIONAL

### Core Components

1. **VAPI Assistant** (`scripts/vapi-assistant-config.js`)
   - Friendly scheduling assistant with clear conversation flow
   - Uses Claude 3.5 Sonnet model
   - Vapi's "Elliot" voice
   - Assistant ID: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`

2. **Webhook Handler** (`src/pages/api/vapi/webhook.ts`)
   - Processes function calls from VAPI
   - Routes to Cal.com integration
   - Returns consistent response format

3. **Booking API** (`src/pages/api/vapi/cal-integration.ts`)
   - Simple, reliable availability generation
   - Creates booking records with validation
   - Returns consistent JSON responses

## How It Works

1. **Caller initiates**: Phone call starts
2. **Check availability**: System generates available slots (business hours, weekdays only)
3. **Collect info**: Assistant asks for name and email
4. **Book appointment**: Creates booking and confirms
5. **End call**: Provides confirmation message

## Simple Architecture

### API Response Format

All responses use consistent structure:

```json
{
  "success": true,
  "result": {
    // Response data here
  }
}
```

### Availability Response

```json
{
  "success": true,
  "result": {
    "nextAvailable": "2024-10-26T14:00:00.000Z",
    "availableSlots": ["2024-10-26T14:00:00.000Z", "..."],
    "totalSlots": 40
  }
}
```

### Booking Response

```json
{
  "success": true,
  "result": {
    "booking": {
      "id": 1729872000000,
      "title": "Fire Protection Consultation with John Doe",
      "start": "2024-10-26T14:00:00.000Z",
      "end": "2024-10-26T15:00:00.000Z",
      "status": "confirmed"
    },
    "message": "Appointment confirmed for Saturday, October 26 at 2:00 PM"
  }
}
```

## Setup

### Required Environment Variables

```bash
VAPI_API_KEY=your_vapi_api_key_here
SITE_URL=https://capcofire.com
```

That's it! No database configuration needed for basic functionality.

## Testing

### Local Testing

1. **Start the dev server**:

   ```bash
   npm run dev
   ```

2. **Test the integration**:

   ```bash
   node scripts/test-vapi-booking.js
   ```

3. **Update VAPI assistant**:
   ```bash
   node scripts/vapi-assistant-config.js
   ```

### Manual API Testing

Test availability:

```bash
curl -X POST http://localhost:4321/api/vapi/cal-integration \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_availability",
    "dateFrom": "2024-10-25T00:00:00.000Z",
    "dateTo": "2024-11-01T00:00:00.000Z"
  }'
```

Test booking:

```bash
curl -X POST http://localhost:4321/api/vapi/cal-integration \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_booking",
    "start": "2024-10-26T14:00:00.000Z",
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

## Deployment

### Deploy to Railway

1. **Set environment variables** in Railway dashboard:
   - `VAPI_API_KEY`
   - `SITE_URL` (your production URL)

2. **Deploy**:

   ```bash
   git push origin main
   ```

3. **Update VAPI assistant** (automatic on Railway deploy, or manual):
   ```bash
   node scripts/vapi-assistant-config.js
   ```

## Next Steps (Future Enhancements)

- [ ] Add database persistence (currently in-memory)
- [ ] Send email confirmations to customers
- [ ] Add SMS reminders integration
- [ ] Connect to actual Cal.com for syncing
- [ ] Add cancellation/rescheduling support
- [ ] Implement timezone detection

## Resources

1. **Documentation**
   - [VAPI.ai Blocks Demo](https://www.vapiblocks.com/components/demos/meeting)
   - [Cal.com Self-Hosting Guide](https://github.com/calcom/cal.com#self-hosting)

2. **Repositories**
   - [VAPI.ai Examples](https://github.com/vapi-ai/examples)
   - [Cal.com Source](https://github.com/calcom/cal.com)
