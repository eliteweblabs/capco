# Fire Pump Testing Company - Vapi Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Set Environment Variables
```bash
export VAPI_API_KEY="your-vapi-api-key"
export RAILWAY_PUBLIC_DOMAIN="https://firepumptestingco.com"
```

### Step 2: Create the Assistant
```bash
node scripts/vapi-firepumptesting-config.js
```

**Expected Output:**
```
🤖 [VAPI-FIREPUMPTESTING] Creating Vapi.ai assistant...
🔄 [VAPI-FIREPUMPTESTING] Processed placeholders in configuration
📝 [VAPI-FIREPUMPTESTING] Company name set to: "Fire Pump Testing Company"
✅ [VAPI-FIREPUMPTESTING] Assistant created successfully: abc123xyz
📝 [VAPI-FIREPUMPTESTING] IMPORTANT: Add this ID to ASSISTANT_ID in this config file
```

### Step 3: Save the Assistant ID
Copy the assistant ID from the output and add it to the config file:

```javascript
// In scripts/vapi-firepumptesting-config.js
const ASSISTANT_ID = "abc123xyz"; // Replace with your actual ID
```

### Step 4: Test the Assistant
Run the script again to verify it works:
```bash
node scripts/vapi-firepumptesting-config.js
```

**Expected Output:**
```
🤖 [VAPI-FIREPUMPTESTING] Updating existing assistant: abc123xyz
✅ [VAPI-FIREPUMPTESTING] Assistant updated successfully
✅ [VAPI-FIREPUMPTESTING] Configuration complete!
```

## 📞 Company Information

**Fire Pump Testing Company, Inc.**
- **Phone**: 888-434-7362
- **Email**: info@firepumptestingco.com
- **Website**: https://firepumptestingco.com
- **Type**: Service-Disabled Veteran Owned Small Business (SDVOSB)

## 🛠️ Services Configured

The voice assistant can handle scheduling for:

1. **Fire Pump Testing** (2-3 hours)
   - Annual performance testing
   - Weekly/monthly churn testing

2. **Installation** (1-5 days)
   - Fire sprinkler systems
   - NFPA 13 compliant installations

3. **Inspection** (1-3 hours)
   - Annual inspections
   - Code compliance verification

4. **Testing** (2-4 hours)
   - System testing
   - Backflow testing

5. **Maintenance** (1-4 hours)
   - 24/7 emergency service
   - Preventive maintenance

## 🎯 Key Features

✅ **Automatic Time Slot Presentation** - Shows available times immediately
✅ **Confirmation Before Booking** - Always confirms time before collecting info
✅ **Preparation Instructions** - Tells customers what to bring
✅ **24/7 Emergency Routing** - Handles urgent requests specially
✅ **Email & SMS Confirmations** - Sends automatic reminders
✅ **NFPA Standards Knowledge** - Understands fire protection codes

## 🗣️ Voice Assistant: Sarah

- **Personality**: Professional, reliable, safety-focused
- **Tone**: Friendly but business-oriented
- **Greeting**: "Thank you for calling Fire Pump Testing Company, Massachusetts' trusted fire protection partner. This is Sarah. How may I assist you today?"

## 📋 Typical Call Flow

1. **Greeting** → Sarah introduces herself
2. **Service Type** → "What type of service do you need?"
3. **Available Times** → "I have availability on [date] at [time]..."
4. **Time Confirmation** → Customer selects time
5. **Information Collection** → Name, email, facility address
6. **Booking** → Confirms and books appointment
7. **Preparation** → "Please ensure our technicians have access to..."
8. **Follow-up** → "Is there anything else I can help you with?"

## 🔧 Common Updates

### Change Phone Number
```javascript
const CLIENT_PHONE = "+18884347362"; // Update this line
```

### Change Website
```javascript
const WEBHOOK_DOMAIN = "https://firepumptestingco.com"; // Update this line
```

### Change Voice
```javascript
voice: {
  provider: "vapi",
  voiceId: "Sarah", // Try: Kylie, Jennifer, etc.
}
```

### Change Call Duration
```javascript
maxDurationSeconds: 300, // 5 minutes (adjust as needed)
```

## 🚨 Emergency Service Keywords

The assistant recognizes these as urgent:
- "emergency"
- "urgent"
- "broken"
- "not working"
- "leak"
- "failure"
- "immediate"

When detected, it:
1. Acknowledges urgency
2. Mentions 24/7 availability
3. Gathers critical info
4. Promises 15-minute callback

## 📊 Tools Used

The assistant uses the same calendar tools as other configurations:

- **getStaffSchedule**: Gets available appointment slots
- **bookAppointment**: Books confirmed appointments

Both tools integrate with Cal.com (or your configured calendar system).

## ⚠️ Important Rules

### ✅ DO:
- Present available times FIRST
- Wait for explicit time confirmation
- Collect info AFTER time is confirmed
- Provide preparation instructions
- Ask "Is there anything else?"
- Wait silently for response

### ❌ DON'T:
- Book without confirmed time
- Say "Done" or "All set" after booking
- End the call (let customer end it)
- Rush through confirmations

## 🧪 Testing

### Test via Vapi Dashboard
1. Go to https://dashboard.vapi.ai
2. Select your assistant
3. Click "Test"
4. Make a test call

### Test Scenarios
1. **Standard Appointment**: "I need to schedule a fire pump test"
2. **Emergency**: "We have a sprinkler leak, it's urgent"
3. **Information Request**: "What services do you offer?"
4. **Multiple Services**: "I need inspection and testing"

## 📚 Additional Resources

- **Full Documentation**: See `vapi-firepumptesting-README.md`
- **Company Website**: https://firepumptestingco.com
- **Vapi Docs**: https://docs.vapi.ai
- **NFPA Standards**: https://www.nfpa.org

## 🆘 Troubleshooting

**Problem**: Assistant not created
- **Solution**: Check VAPI_API_KEY is set correctly

**Problem**: Webhook errors
- **Solution**: Verify RAILWAY_PUBLIC_DOMAIN is accessible

**Problem**: Bookings not working
- **Solution**: Check calendar integration and tool IDs

**Problem**: Voice quality issues
- **Solution**: Try different voice options in config

## 📞 Support

For technical issues with this configuration:
- Review other Vapi configs in `/scripts/` directory
- Check Vapi documentation
- Review webhook logs

For Fire Pump Testing Company business:
- Call: 888-434-7362
- Email: info@firepumptestingco.com

---

**Created**: December 2025
**Version**: 1.0
**Status**: Ready for Production






