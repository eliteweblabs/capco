# Fire Pump Testing Company - Vapi Voice Assistant Configuration

This document provides comprehensive information about the Vapi voice assistant configuration for Fire Pump Testing Company, Inc.

## Company Overview

**Fire Pump Testing Company, Inc.**
- **Tagline**: Massachusetts' Trusted Fire Protection Partner
- **Business Type**: Service-Disabled Veteran Owned Small Business (SDVOSB)
- **Founded By**: Martin Duross, United States Marine Corps Veteran
- **Location**: 10 Ramsay Road, East Yaphank, NY 11967
- **Phone**: 888-434-7362
- **Email**: info@firepumptestingco.com
- **Website**: https://firepumptestingco.com

## Services Offered

### 1. Installation Services
- Fire sprinkler system installation (residential and commercial)
- New construction and existing building installations
- NFPA 13 (r)(d) compliant installations
- Valued Engineering Fire Protection Systems (NFPA 17 and 17A standards)
- **Duration**: Varies by project scope (typically 1-5 days)

### 2. Inspection Services
- Annual fire protection system inspections
- Code compliance verification
- System operational testing
- Documentation and reporting
- **Duration**: 1-3 hours depending on system size

### 3. Testing Services
- Fire pump performance testing (annual)
- Fire pump churn testing (weekly for diesel, monthly for electric)
- Sprinkler system testing
- Alarm system testing
- Backflow testing
- **Duration**: 2-4 hours for comprehensive testing

### 4. Maintenance Services
- 24/7 service department availability
- Preventive maintenance programs
- System repairs and upgrades
- Emergency repair services
- **Duration**: 1-4 hours depending on scope

### 5. Fire Pump Services
- Annual performance testing
- Weekly churn testing for diesel pumps
- Monthly churn testing for electric pumps
- Pump maintenance and repair
- **Duration**: 2-3 hours for testing, varies for repairs

## NFPA Standards Compliance

The company follows all relevant NFPA (National Fire Protection Association) standards:

- **NFPA 13**: Installation of Sprinkler Systems
- **NFPA 13R**: Sprinkler Systems in Residential Occupancies
- **NFPA 13D**: Sprinkler Systems in One- and Two-Family Dwellings
- **NFPA 17**: Dry Chemical Extinguishing Systems
- **NFPA 17A**: Wet Chemical Extinguishing Systems
- **NFPA 20**: Installation of Stationary Pumps for Fire Protection
- **NFPA 25**: Inspection, Testing, and Maintenance of Water-Based Fire Protection Systems
- **NFPA 72**: National Fire Alarm and Signaling Code

## Building Types Served

- Residential (single-family, multi-family, apartments, condominiums)
- Commercial (offices, retail, restaurants, hotels)
- Industrial (manufacturing, warehouses, distribution centers)
- Institutional (schools, hospitals, care facilities, government buildings)
- Mixed-use buildings

## Voice Assistant Configuration

### Assistant Persona: Sarah
- **Role**: Service Coordinator
- **Voice**: Professional female voice (Vapi "Sarah" voice)
- **Personality**: Friendly, professional, reliable, safety-focused
- **Tone**: Warm but business-focused

### Key Features

#### 1. Appointment Scheduling
- Handles all types of service appointments
- Presents available time slots
- Confirms bookings with detailed information
- Sends confirmation emails and SMS reminders

#### 2. Emergency Service Routing
- Recognizes urgent situations
- Prioritizes emergency requests
- Connects to 24/7 emergency response team
- Gathers critical information quickly

#### 3. Service Information
- Provides details about all services
- Explains NFPA compliance standards
- Answers questions about preparation requirements
- Offers quotes and pricing information

#### 4. Professional Communication
- Uses proper technical terminology
- Confirms all details explicitly
- Maintains patient, clear communication
- Emphasizes veteran-owned business status

### Conversation Flow

1. **Greeting**: Professional introduction mentioning company tagline
2. **Service Identification**: Determines type of service needed
3. **Time Selection**: Presents available slots and waits for confirmation
4. **Information Collection**: Gathers name, email, facility address
5. **Booking Confirmation**: Confirms all details and books appointment
6. **Preparation Instructions**: Provides specific preparation guidance
7. **Follow-up**: Asks if there's anything else needed

### Critical Rules

#### Booking Process
- MUST present available times FIRST
- MUST wait for explicit time confirmation
- MUST NOT book without confirmed time
- MUST collect all required information before booking

#### Post-Booking Behavior
- MUST provide preparation instructions
- MUST ask "Is there anything else I can help you with today?"
- MUST wait silently for response
- MUST NOT say "Done", "All set", or similar closing phrases
- MUST NOT end call - wait for customer to end

## Setup Instructions

### Prerequisites
1. Node.js installed
2. VAPI_API_KEY environment variable set
3. RAILWAY_PUBLIC_DOMAIN or WEBHOOK_DOMAIN configured
4. Access to Cal.com or other calendar system

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   export VAPI_API_KEY="your-vapi-api-key"
   export RAILWAY_PUBLIC_DOMAIN="https://firepumptestingco.com"
   export RAILWAY_PROJECT_NAME="Fire Pump Testing Company"
   ```

3. **Create the Assistant** (First Time Only)
   ```bash
   node scripts/vapi-firepumptesting-config.js
   ```
   
   This will create a new assistant and return an ID. Copy this ID.

4. **Update the Configuration File**
   Open `scripts/vapi-firepumptesting-config.js` and add the assistant ID:
   ```javascript
   const ASSISTANT_ID = "your-assistant-id-here";
   ```

5. **Update the Assistant** (For Future Changes)
   ```bash
   node scripts/vapi-firepumptesting-config.js
   ```
   
   This will update the existing assistant with any configuration changes.

### Testing the Assistant

1. **Test via Script**
   ```bash
   node scripts/vapi-firepumptesting-config.js
   ```
   Then use the test function to initiate a test call.

2. **Test via Vapi Dashboard**
   - Go to https://dashboard.vapi.ai
   - Select your assistant
   - Use the "Test" feature to make a test call

3. **Test via API**
   ```bash
   curl -X POST https://api.vapi.ai/call \
     -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "assistantId": "your-assistant-id",
       "customer": {
         "number": "+18884347362"
       }
     }'
   ```

## Calendar Integration

The assistant uses the same calendar tools as other configurations in this workspace:

### Tool IDs
- **getStaffSchedule**: `0b17d3bc-a697-432b-8386-7ed1235fd111`
- **bookAppointment**: `5b8ac059-9bbe-4a27-985d-70df87f9490d`

### Calendar Type
- Default: `calcom` (Cal.com integration)
- Can be changed to: `google`, `iCal`, `booksy`, or `custom`

### Webhook URL
```
https://firepumptestingco.com/api/vapi/webhook?calendarType=calcom
```

## Customization Options

### Voice Selection
Change the voice in the configuration:
```javascript
voice: {
  provider: "vapi",
  voiceId: "Sarah", // Options: Sarah, Kylie, Jennifer, etc.
}
```

### Call Duration
Adjust maximum call duration:
```javascript
maxDurationSeconds: 300, // 5 minutes (adjust as needed)
```

### Silence Timeout
Adjust how long to wait for user response:
```javascript
silenceTimeoutSeconds: 15, // 15 seconds (adjust as needed)
```

### Background Sound
Change background ambiance:
```javascript
backgroundSound: "office", // Options: office, cafe, none
```

### End Call Phrases
Customize phrases that trigger call end:
```javascript
endCallPhrases: ["goodbye", "bye", "that's all", "finished", "end call", "hangup"],
```

## Preparation Requirements by Service Type

### Installation Projects
- Building plans
- Site access information
- Project timeline
- Occupancy type
- Previous system documentation (if retrofit)

### Inspections
- Previous inspection reports
- System documentation
- Access to all equipment
- Building layout

### Testing
- System documentation
- Previous test results
- Access to equipment rooms
- System specifications

### Maintenance
- Service history
- Any known issues
- Access to equipment
- System age and type

## Emergency Service Protocol

When emergency keywords are detected ("emergency", "urgent", "broken", "leak", "failure"):

1. Acknowledge urgency immediately
2. Mention 24/7 availability
3. Gather critical information:
   - Nature of emergency
   - Facility address
   - Contact information
4. Promise callback within 15 minutes
5. Escalate to emergency response team

## Company Background

Fire Pump Testing Company, Inc. was founded by Martin Duross, a United States Marine Corps Veteran who became a licensed journeyman through local 550 in Massachusetts. After graduating and seeking more responsibility and challenges, Martin established the company to make a difference in the fire protection industry. The company operates as a Service-Disabled Veteran Owned Small Business (SDVOSB) and continues to uphold the oath to defend and protect the people of this nation every day through fire protection services.

## Support and Maintenance

### Updating the Assistant
When you need to update the assistant configuration (e.g., change services, update phone numbers, modify conversation flow):

1. Edit `scripts/vapi-firepumptesting-config.js`
2. Run: `node scripts/vapi-firepumptesting-config.js`
3. The script will automatically update the existing assistant

### Monitoring Calls
- Access call logs via Vapi Dashboard
- Review transcripts for quality assurance
- Monitor booking success rates
- Analyze common customer questions

### Troubleshooting

**Assistant not responding:**
- Check VAPI_API_KEY is valid
- Verify webhook URL is accessible
- Check calendar integration is working

**Bookings not working:**
- Verify tool IDs are correct
- Check calendar system connectivity
- Review webhook logs for errors

**Voice quality issues:**
- Try different voice options
- Adjust speaking rate in Vapi dashboard
- Check audio settings

## Contact Information

For technical support or questions about this configuration:
- Review existing Vapi configurations in `/scripts/` directory
- Check Vapi documentation: https://docs.vapi.ai
- Review NFPA standards: https://www.nfpa.org

For Fire Pump Testing Company business inquiries:
- Phone: 888-434-7362
- Email: info@firepumptestingco.com
- Website: https://firepumptestingco.com






