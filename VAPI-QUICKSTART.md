# VAPI Booking Agent - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install & Setup

```bash
# Clone and install dependencies (if not already done)
npm install

# Set your environment variables
export VAPI_API_KEY="your_vapi_key_here"
export SITE_URL="https://capcofire.com"
```

### 2. Test Locally

```bash
# Start the dev server
npm run dev

# In another terminal, test the booking API
npm run test:vapi
```

You should see:

```
✅ All tests passed!
📋 Summary:
- Availability check: ✅
- Booking creation: ✅
🎉 Integration is working correctly!
```

### 3. Deploy & Update VAPI

```bash
# Update the VAPI assistant with latest config
npm run update-vapi

# Deploy to Railway (or your hosting platform)
git push origin main
```

## 📞 Test the Phone Integration

1. Go to your VAPI dashboard
2. Find your assistant (ID: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`)
3. Use the "Test Call" feature
4. Try booking an appointment!

### Expected Conversation Flow:

**Assistant**: "Hello! I'm calling from CAPCO Fire Protection Systems. I can help you schedule a fire protection consultation. Let me check our availability..."

_Assistant automatically checks availability_

**Assistant**: "Our next available appointment is tomorrow at 2:00 PM. Would that work for you?"

**You**: "Yes, that works"

**Assistant**: "Great! Can I get your full name?"

**You**: "John Doe"

**Assistant**: "And your email address for the confirmation?"

**You**: "john@example.com"

**Assistant**: "Perfect! I've booked your Fire Protection Consultation for [date and time]. You'll receive a confirmation email at john@example.com. Is there anything else I can help you with?"

**You**: "No, that's all"

**Assistant**: "Thanks for calling CAPCO Design Group. Have a great day!"

## 🐛 Troubleshooting

### Problem: Test script fails

**Solution**: Make sure dev server is running first:

```bash
npm run dev
# Wait for "Astro server ready"
# Then in another terminal:
npm run test:vapi
```

### Problem: VAPI assistant not updated

**Solution**: Check that `VAPI_API_KEY` is set:

```bash
echo $VAPI_API_KEY
# If empty, set it:
export VAPI_API_KEY="your_key_here"
npm run update-vapi
```

### Problem: "Function call timed out"

**Solution**: Check that `SITE_URL` points to your deployed site:

```bash
# For production
export SITE_URL="https://capcofire.com"

# For local testing (requires ngrok or similar)
export SITE_URL="https://your-tunnel-url.ngrok.io"
```

## 📝 How It Works

1. **Caller dials** your VAPI phone number
2. **Assistant greets** and checks availability automatically
3. **Availability check** generates business hours slots (M-F, 9-5)
4. **Assistant offers** the next available slot
5. **Collects info** (name and email)
6. **Creates booking** with confirmation message
7. **Ends call** with thank you message

## 🔧 Customization

### Change Business Hours

Edit `src/pages/api/vapi/cal-integration.ts`:

```typescript
// Change from 9-5 to 8-6
for (let hour = 8; hour < 18; hour++) { // Was: 9; hour < 17
```

### Change Appointment Duration

Edit `src/pages/api/vapi/cal-integration.ts`:

```typescript
// Change from 60 minutes to 30 minutes
const endDate = new Date(startDate.getTime() + 30 * 60000); // Was: 60
```

### Change Voice or Model

Edit `scripts/vapi-assistant-config.js`:

```javascript
voice: {
  provider: "vapi",
  voiceId: "Jennifer",  // Was: "Elliot"
},
model: {
  provider: "openai",
  model: "gpt-4",  // Was: anthropic/claude-3-5-sonnet
}
```

Then update:

```bash
npm run update-vapi
```

## 🎯 Next Steps

- [ ] Add database persistence for bookings
- [ ] Send email confirmations
- [ ] Add SMS reminders
- [ ] Integrate with actual Cal.com calendar
- [ ] Add rescheduling/cancellation support

See `VAPI-INTEGRATION.md` for detailed documentation.
