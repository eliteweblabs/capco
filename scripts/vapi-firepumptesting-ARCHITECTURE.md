# Fire Pump Testing Company - Vapi Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CUSTOMER                                 │
│                    (Calls 888-434-7362)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Phone Call
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VAPI.AI PLATFORM                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Voice Assistant: Sarah                                    │  │
│  │  - Voice Recognition (Speech-to-Text)                      │  │
│  │  - Claude 3.5 Sonnet (AI Processing)                       │  │
│  │  - Voice Synthesis (Text-to-Speech)                        │  │
│  │  - Assistant ID: [your-assistant-id]                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Webhook Calls
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              WEBHOOK SERVER (Railway/Astro)                      │
│              https://firepumptestingco.com                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /api/vapi/webhook?calendarType=calcom                     │  │
│  │  - Receives tool calls from Vapi                           │  │
│  │  - Processes booking requests                              │  │
│  │  - Returns available time slots                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Calendar API Calls
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CALENDAR SYSTEM                               │
│                      (Cal.com)                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  - Stores appointments                                     │  │
│  │  - Manages availability                                    │  │
│  │  - Sends confirmations                                     │  │
│  │  - Handles reminders                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Call Flow Sequence

```
CUSTOMER                VAPI                WEBHOOK             CALENDAR
   │                     │                     │                   │
   │──Call 888-434-7362─>│                     │                   │
   │                     │                     │                   │
   │<──"Thank you for──  │                     │                   │
   │    calling..."      │                     │                   │
   │                     │                     │                   │
   │                     │──getAccountInfo()──>│                   │
   │                     │                     │                   │
   │                     │                     │──Get Availability>│
   │                     │                     │<──Available Times─│
   │                     │<──Available Times───│                   │
   │                     │                     │                   │
   │<──"I have          │                     │                   │
   │    availability..." │                     │                   │
   │                     │                     │                   │
   │──"2pm works"──────>│                     │                   │
   │                     │                     │                   │
   │<──"Perfect! Can I  │                     │                   │
   │    get your name?"  │                     │                   │
   │                     │                     │                   │
   │──"John Smith"─────>│                     │                   │
   │                     │                     │                   │
   │<──"Email address?" │                     │                   │
   │                     │                     │                   │
   │──"john@email.com"─>│                     │                   │
   │                     │                     │                   │
   │                     │──bookAppointment()─>│                   │
   │                     │   (time, name,      │                   │
   │                     │    email, phone)    │                   │
   │                     │                     │                   │
   │                     │                     │──Create Booking──>│
   │                     │                     │<──Confirmation────│
   │                     │<──Booking Success───│                   │
   │                     │                     │                   │
   │<──"You're scheduled│                     │                   │
   │    for..."          │                     │                   │
   │                     │                     │                   │
   │<──"Please ensure   │                     │                   │
   │    technicians..."  │                     │                   │
   │                     │                     │                   │
   │<──"Anything else?" │                     │                   │
   │                     │                     │                   │
   │──"No, thank you"──>│                     │                   │
   │                     │                     │                   │
   │<──"Have a         │                     │                   │
   │    wonderful day!"  │                     │                   │
   │                     │                     │                   │
   │                     │                     │──Send Email──────>│
   │                     │                     │──Send SMS────────>│
   │                     │                     │                   │
```

## Emergency Call Flow

```
CUSTOMER                VAPI                WEBHOOK             EMERGENCY TEAM
   │                     │                     │                   │
   │──"We have a leak!"─>│                     │                   │
   │                     │                     │                   │
   │    [EMERGENCY       │                     │                   │
   │     DETECTED]       │                     │                   │
   │                     │                     │                   │
   │<──"I understand    │                     │                   │
   │    this is urgent"  │                     │                   │
   │                     │                     │                   │
   │<──"24/7 emergency  │                     │                   │
   │    service..."      │                     │                   │
   │                     │                     │                   │
   │<──"What is the     │                     │                   │
   │    facility address?"│                    │                   │
   │                     │                     │                   │
   │──"123 Main St"────>│                     │                   │
   │                     │                     │                   │
   │<──"Best callback   │                     │                   │
   │    number?"         │                     │                   │
   │                     │                     │                   │
   │──"555-1234"───────>│                     │                   │
   │                     │                     │                   │
   │                     │──emergencyAlert()──>│                   │
   │                     │                     │                   │
   │                     │                     │──Notify Team─────>│
   │                     │                     │<──Acknowledged────│
   │                     │<──Alert Sent────────│                   │
   │                     │                     │                   │
   │<──"Technician will │                     │                   │
   │    call within 15min"│                    │                   │
   │                     │                     │                   │
   │                     │                     │                   │
   │                     │                     │                   ▼
   │<─────────────────────────────────────────────────[CALL CUSTOMER]
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CONFIGURATION FILE                          │
│           vapi-firepumptesting-config.js                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  - Company information                                     │  │
│  │  - Service descriptions                                    │  │
│  │  - NFPA standards knowledge                                │  │
│  │  - Conversation flow rules                                 │  │
│  │  - Voice settings                                          │  │
│  │  - Tool configurations                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Creates/Updates
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VAPI ASSISTANT                                │
│                  (Stored in Vapi Cloud)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Assistant ID: [unique-id]                                 │  │
│  │  - System prompt                                           │  │
│  │  - Tool IDs                                                │  │
│  │  - Voice configuration                                     │  │
│  │  - Webhook URL                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Used During
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LIVE CALLS                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Call Data:                                                │  │
│  │  - Customer phone number                                   │  │
│  │  - Conversation transcript                                 │  │
│  │  - Tool call results                                       │  │
│  │  - Booking confirmations                                   │  │
│  │  - Call duration & metrics                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Tool Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      VAPI TOOLS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tool 1: getStaffSchedule / getAccountInfo                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ID: 0b17d3bc-a697-432b-8386-7ed1235fd111                 │  │
│  │                                                            │  │
│  │  Purpose: Get available appointment slots                 │  │
│  │                                                            │  │
│  │  Input: None (or username parameter)                      │  │
│  │                                                            │  │
│  │  Output: Array of available time slots                    │  │
│  │  [                                                         │  │
│  │    {                                                       │  │
│  │      "start": "2025-01-15T14:00:00Z",                     │  │
│  │      "end": "2025-01-15T15:00:00Z"                        │  │
│  │    },                                                      │  │
│  │    ...                                                     │  │
│  │  ]                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Tool 2: bookAppointment                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ID: 5b8ac059-9bbe-4a27-985d-70df87f9490d                 │  │
│  │                                                            │  │
│  │  Purpose: Book confirmed appointment                       │  │
│  │                                                            │  │
│  │  Input:                                                    │  │
│  │  {                                                         │  │
│  │    "start": "2025-01-15T14:00:00Z",                       │  │
│  │    "name": "John Smith",                                  │  │
│  │    "email": "john@email.com",                             │  │
│  │    "phone": "+15551234567",                               │  │
│  │    "address": "123 Main St"                               │  │
│  │  }                                                         │  │
│  │                                                            │  │
│  │  Output: Booking confirmation                              │  │
│  │  {                                                         │  │
│  │    "success": true,                                        │  │
│  │    "bookingId": "abc123",                                 │  │
│  │    "confirmationSent": true                               │  │
│  │  }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variables

```
┌─────────────────────────────────────────────────────────────────┐
│                  ENVIRONMENT CONFIGURATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VAPI_API_KEY                                                   │
│  ├─ Purpose: Authenticate with Vapi API                         │
│  ├─ Required: Yes                                               │
│  └─ Example: "sk_live_abc123xyz..."                             │
│                                                                  │
│  RAILWAY_PUBLIC_DOMAIN                                          │
│  ├─ Purpose: Webhook base URL                                   │
│  ├─ Required: Yes                                               │
│  └─ Example: "https://firepumptestingco.com"                    │
│                                                                  │
│  RAILWAY_PROJECT_NAME                                           │
│  ├─ Purpose: Company name for placeholders                      │
│  ├─ Required: No (has default)                                  │
│  └─ Example: "Fire Pump Testing Company"                        │
│                                                                  │
│  CALCOM_API_KEY (if using Cal.com)                             │
│  ├─ Purpose: Calendar integration                               │
│  ├─ Required: Yes (for calendar)                                │
│  └─ Example: "cal_live_abc123..."                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Local Machine                                             │  │
│  │  - Edit vapi-firepumptesting-config.js                    │  │
│  │  - Run: node scripts/vapi-firepumptesting-config.js       │  │
│  │  - Creates/updates assistant in Vapi                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Deploy
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Railway (or similar hosting)                              │  │
│  │  - Astro/Node.js application                               │  │
│  │  - Webhook endpoints                                       │  │
│  │  - Environment variables                                   │  │
│  │  - SSL certificate (HTTPS)                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Vapi Cloud                                                │  │
│  │  - Voice assistant running                                 │  │
│  │  - Handles all phone calls                                 │  │
│  │  - Calls webhook for tools                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Cal.com (or other calendar)                               │  │
│  │  - Stores appointments                                     │  │
│  │  - Sends confirmations                                     │  │
│  │  - Manages availability                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: API Authentication                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - VAPI_API_KEY required for all API calls                │  │
│  │  - Webhook signature verification                          │  │
│  │  - Rate limiting on API endpoints                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 2: Transport Security                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - HTTPS/TLS for all communications                        │  │
│  │  - SSL certificate validation                              │  │
│  │  - Encrypted data in transit                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 3: Data Privacy                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - PII (name, email, phone) handled securely              │  │
│  │  - Call recordings stored per privacy policy              │  │
│  │  - GDPR/CCPA compliance considerations                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 4: Access Control                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Vapi dashboard access restricted                        │  │
│  │  - Environment variables secured                           │  │
│  │  - Calendar API keys protected                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring & Logging

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Vapi Dashboard                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Call logs and transcripts                               │  │
│  │  - Tool call history                                       │  │
│  │  - Success/failure metrics                                 │  │
│  │  - Call duration statistics                                │  │
│  │  - Cost tracking                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Webhook Logs                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Incoming requests                                       │  │
│  │  - Tool execution logs                                     │  │
│  │  - Error tracking                                          │  │
│  │  - Response times                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Calendar System                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Booking confirmations                                   │  │
│  │  - Cancellation tracking                                   │  │
│  │  - No-show rates                                           │  │
│  │  - Availability patterns                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCALING STRATEGY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Concurrent Calls                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Vapi handles multiple simultaneous calls               │  │
│  │  - No limit on concurrent conversations                    │  │
│  │  - Each call is independent                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Webhook Scaling                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Railway auto-scales based on load                       │  │
│  │  - Stateless webhook design                                │  │
│  │  - Can handle multiple requests simultaneously            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Calendar Integration                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Cal.com API rate limits apply                           │  │
│  │  - Implement caching for availability                      │  │
│  │  - Queue booking requests if needed                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Cost Management                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Monitor Vapi usage costs                                │  │
│  │  - Set maximum call duration (5 min default)              │  │
│  │  - Track cost per successful booking                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Failure Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Scenario 1: Webhook Timeout                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Problem: Webhook doesn't respond in time                  │  │
│  │  Handling: Vapi retries, assistant apologizes             │  │
│  │  Fallback: Offer to take message for callback             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Scenario 2: Calendar Unavailable                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Problem: Calendar API is down                             │  │
│  │  Handling: Assistant mentions technical difficulty        │  │
│  │  Fallback: Collect info, promise callback                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Scenario 3: No Available Slots                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Problem: All time slots are booked                        │  │
│  │  Handling: Offer alternative dates/times                   │  │
│  │  Fallback: Add to waitlist or callback list               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Scenario 4: Customer Disconnects                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Problem: Call drops mid-booking                           │  │
│  │  Handling: Log partial information                         │  │
│  │  Fallback: System can call back if phone captured         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│                    TARGET METRICS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Call Metrics                                                   │
│  ├─ Average Call Duration: 2-4 minutes                          │
│  ├─ Booking Success Rate: >80%                                  │
│  ├─ Customer Satisfaction: >4.5/5                               │
│  └─ First Call Resolution: >90%                                 │
│                                                                  │
│  Technical Metrics                                              │
│  ├─ Webhook Response Time: <500ms                               │
│  ├─ Tool Call Success Rate: >99%                                │
│  ├─ System Uptime: >99.9%                                       │
│  └─ Error Rate: <1%                                             │
│                                                                  │
│  Business Metrics                                               │
│  ├─ Cost Per Booking: <$2                                       │
│  ├─ No-Show Rate: <10%                                          │
│  ├─ Repeat Booking Rate: >50%                                   │
│  └─ Emergency Response Time: <15 minutes                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0
**Last Updated**: December 2025
**Status**: Production Ready






