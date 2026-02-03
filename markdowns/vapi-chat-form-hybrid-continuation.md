# VAPI Chat/Form Hybrid - Continuation Plan

## Current Status (Feb 2, 2026)

### ✅ Already Built

1. **VapiChatInterface.astro** (`/src/components/chat/VapiChatInterface.astro`)
   - Beautiful chat UI matching your design system
   - Typewriter effects, voice toggle, text input
   - Smooth animations, dark mode support
   - Test page at `/tests/vapi-chat-test`

2. **VAPI Webhook** (`/src/pages/api/vapi/webhook.ts`)
   - Function calling system with 15+ functions
   - User context via metadata (userId, userEmail)
   - Project creation, knowledge base, email, file processing
   - Cal.com appointment booking

3. **Documentation**
   - `markdowns/custom-vapi-chat-interface.md` - Complete usage guide

### 🎯 The Vision

Replace rigid multi-step forms with natural conversation:

```
Instead of 8-step form:
Step 1: Name
Step 2: Email  
Step 3: Phone
Step 4: Address
Step 5: Square feet
Step 6: Building type
Step 7: Services
Step 8: Review

Natural conversation:
User: "I need a fire alarm system for my building"
AI: "Great! What's the address?"
User: "123 Main St, Boston"
AI: "How many square feet is the building?"
User: "About 5000"
AI: "Perfect. Is this a new construction or existing building?"
User: "Existing"
AI: "What's your name and email so we can send you a quote?"
User: "John Smith, john@example.com"
AI: [Creates project via function call]
```

## 🚧 What's Missing to Complete

### 1. Contact Form Function in VAPI Webhook

Add `submitContactForm` function to webhook that collects:
- name
- email
- phone
- company (optional)
- address (optional)
- message

Then calls existing `/api/contact/submit` endpoint.

### 2. Project Creation Form Function

Add `submitProjectForm` function that collects:
- address (required)
- title
- square feet
- building type (new construction vs existing)
- services needed
- description

Then calls existing `/api/projects/upsert` endpoint.

**Note:** `createProject` function already exists in webhook (line 228) but could be enhanced for form-like collection.

### 3. Hybrid Page Templates

Create choice-based pages:

#### `/src/pages/contact-hybrid.astro`
```astro
<div class="choice-screen">
  <Button onclick="showChat()">💬 Chat with us</Button>
  <Button onclick="showForm()">📝 Fill out form</Button>
</div>

<div id="chat" class="hidden">
  <VapiChatInterface />
</div>

<div id="form" class="hidden">
  <MultiStepForm config={contactFormConfig} />
</div>
```

#### `/src/pages/project/create-hybrid.astro`
Similar structure for project creation.

### 4. VAPI Assistant Configuration

Configure your VAPI assistant with:

#### System Prompt for Contact Form
```
You are a helpful assistant for [Company Name]. Your goal is to collect contact information naturally through conversation.

Required fields:
- Name (first and last)
- Email address (validate format)
- Phone number (10 digits)

Optional fields:
- Company name
- Project address
- Message/description

Guidelines:
- Ask one question at a time
- Be friendly and conversational
- Validate email format (must contain @ and .)
- Validate phone (10 digits)
- Confirm all details before submitting
- Call submitContactForm function when ready
```

#### System Prompt for Project Creation
```
You are a fire protection project assistant. Collect project details conversationally.

Required fields:
- Project address (street, city, state, zip)
- Building type (commercial, residential, industrial)
- Square footage
- Services needed (fire alarms, sprinklers, inspections)

Optional fields:
- Building name/title
- New construction vs existing
- Additional details

Guidelines:
- Validate address format
- Confirm square footage is numeric
- List available services
- Summarize all details before creating
- Call createProject function when confirmed
```

### 5. Function Definitions in VAPI Dashboard

Add to your VAPI assistant functions:

#### submitContactForm
```json
{
  "name": "submitContactForm",
  "description": "Submit contact form after collecting all required information from the user",
  "parameters": {
    "type": "object",
    "properties": {
      "firstName": { "type": "string", "description": "User's first name" },
      "lastName": { "type": "string", "description": "User's last name" },
      "email": { "type": "string", "description": "Valid email address" },
      "phone": { "type": "string", "description": "Phone number (10 digits)" },
      "company": { "type": "string", "description": "Company name (optional)" },
      "address": { "type": "string", "description": "Project address (optional)" },
      "message": { "type": "string", "description": "User's message or inquiry" }
    },
    "required": ["firstName", "lastName", "email", "phone", "message"]
  }
}
```

#### submitProjectForm (or enhance existing createProject)
Already exists at line 228 of webhook.ts but can add validation prompts.

## 🎯 Implementation Steps

### Step 1: Add Contact Form Function to Webhook (15 min)

File: `/src/pages/api/vapi/webhook.ts`

Add new case to `handleToolCalls` function (around line 228):

```typescript
} else if (functionName === "submitContactForm") {
  const args = typeof toolCall.function?.arguments === "string"
    ? JSON.parse(toolCall.function.arguments)
    : toolCall.function?.arguments || {};

  console.log(`[---VAPI-WEBHOOK] Submitting contact form:`, args);

  // Get base URL
  let baseUrl: string;
  try {
    baseUrl = request
      ? getApiBaseUrl(request)
      : process.env.PUBLIC_RAILWAY_STATIC_URL || 
        process.env.RAILWAY_PUBLIC_DOMAIN || 
        "https://capcofire.com";
  } catch (error) {
    baseUrl = process.env.PUBLIC_RAILWAY_STATIC_URL || 
              process.env.RAILWAY_PUBLIC_DOMAIN || 
              "https://capcofire.com";
  }

  // Call existing contact API
  const contactResponse = await fetch(`${baseUrl}/api/contact/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(callMetadata?.userId && { "X-User-Id": callMetadata.userId }),
      ...(callMetadata?.userEmail && { "X-User-Email": callMetadata.userEmail }),
    },
    body: JSON.stringify({
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      company: args.company || "",
      address: args.address || "",
      message: args.message,
      source: "vapi_chat"
    }),
  });

  const contactData = await contactResponse.json();

  if (!contactResponse.ok || !contactData.success) {
    const errorMsg = contactData.error || "Failed to submit contact form";
    console.error(`❌ [VAPI-WEBHOOK] Contact form failed:`, errorMsg);
    results.push({
      toolCallId: toolCall.id,
      result: `I'm sorry, I couldn't submit your information. ${errorMsg}`,
    });
  } else {
    console.log(`✅ [VAPI-WEBHOOK] Contact form submitted successfully`);
    results.push({
      toolCallId: toolCall.id,
      result: `Perfect! I've submitted your contact information. Someone from our team will reach out to ${args.email} or ${args.phone} within 24 hours. Is there anything else I can help you with?`,
    });
  }

  continue;
}
```

### Step 2: Create Hybrid Contact Page (30 min)

File: `/src/pages/contact-hybrid.astro`

```astro
---
import App from "../components/ui/App.astro";
import VapiChatInterface from "../components/chat/VapiChatInterface.astro";
import MultiStepForm from "../components/form/MultiStepForm.astro";
import { CONTACT_FORM_CONFIG } from "../lib/multi-step-form-config";
import { checkAuth } from "../lib/auth";

const { currentUser } = await checkAuth(Astro.cookies);
---

<App title="Contact Us" {currentUser} mask="top-left">
  <div class="container mx-auto px-4 py-12">
    <!-- Choice Screen -->
    <div id="choice-screen" class="max-w-2xl mx-auto text-center space-y-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
        How would you like to get in touch?
      </h1>
      
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Choose your preferred method of contact
      </p>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Chat Option -->
        <button
          onclick="showChat()"
          class="group p-8 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div class="space-y-4 text-white">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h2 class="text-2xl font-bold">Chat with Us</h2>
            <p class="text-primary-100">
              Natural conversation, ask questions anytime
            </p>
            <ul class="text-sm text-primary-100 space-y-2 text-left">
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Voice or text</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Get instant answers</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Flexible conversation</span>
              </li>
            </ul>
          </div>
        </button>

        <!-- Form Option -->
        <button
          onclick="showForm()"
          class="group p-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div class="space-y-4">
            <svg class="w-16 h-16 mx-auto text-gray-600 dark:text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Fill Out Form</h2>
            <p class="text-gray-600 dark:text-gray-400">
              Traditional step-by-step form
            </p>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Structured fields</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Visual confirmation</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Familiar format</span>
              </li>
            </ul>
          </div>
        </button>
      </div>
    </div>

    <!-- Chat Interface (Hidden Initially) -->
    <div id="chat-container" class="hidden max-w-4xl mx-auto">
      <button
        onclick="showChoice()"
        class="mb-6 text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to options</span>
      </button>
      
      <VapiChatInterface
        title="Let's get in touch..."
        introMessage="Hi! I'm here to help you get in touch with our team. I can answer questions about our services and collect your contact information. What brings you here today?"
        placeholder="Type your message or ask a question..."
      />
    </div>

    <!-- Form Container (Hidden Initially) -->
    <div id="form-container" class="hidden">
      <button
        onclick="showChoice()"
        class="mb-6 text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to options</span>
      </button>
      
      <MultiStepForm config={CONTACT_FORM_CONFIG} />
    </div>
  </div>
</App>

<script is:inline>
  function showChat() {
    document.getElementById('choice-screen').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    document.getElementById('form-container').classList.add('hidden');
  }

  function showForm() {
    document.getElementById('choice-screen').classList.add('hidden');
    document.getElementById('chat-container').classList.add('hidden');
    document.getElementById('form-container').classList.remove('hidden');
  }

  function showChoice() {
    document.getElementById('choice-screen').classList.remove('hidden');
    document.getElementById('chat-container').classList.add('hidden');
    document.getElementById('form-container').classList.add('hidden');
  }
</script>
</App>
```

### Step 3: Configure VAPI Assistant (15 min)

In VAPI Dashboard (https://dashboard.vapi.ai):

1. Go to your assistant settings
2. Add `submitContactForm` function definition (JSON above)
3. Update system prompt with contact form guidelines
4. Test with various conversation flows

### Step 4: Test & Iterate (ongoing)

1. Test natural conversation flows
2. Validate data collection
3. Ensure submissions reach database
4. Monitor webhook logs for errors
5. Refine prompts based on user feedback

## 📊 Comparison: Form vs Chat

| Aspect | Multi-Step Form | VAPI Chat |
|--------|----------------|-----------|
| **Speed** | 8+ steps | Natural flow |
| **Questions** | Can't ask | Ask anything |
| **Validation** | Per-field | Conversational |
| **Flexibility** | Rigid order | Any order |
| **Accessibility** | Keyboard | Voice + Text |
| **Drop-off** | High (8 steps) | Lower (natural) |
| **Data Quality** | Structured | Validated conversationally |
| **User Preference** | Some prefer | Some prefer |

**Best Solution:** Offer both! Let users choose their preferred method.

## 🎯 Success Metrics to Track

1. **Completion Rate**
   - Chat vs Form completion %
   - Drop-off points

2. **Time to Complete**
   - Average duration for each method
   - Which is faster?

3. **Data Quality**
   - Validation errors
   - Missing/incorrect data

4. **User Preference**
   - Which method is chosen more?
   - Return user patterns

5. **Support Load**
   - Questions asked in chat
   - Follow-up emails needed

## 🚀 Future Enhancements

1. **Smart Routing**
   - Suggest chat for complex inquiries
   - Suggest form for simple submissions

2. **Hybrid Mode**
   - Start with chat, switch to form
   - Pre-fill form from chat data

3. **Voice-First**
   - Mobile users auto-start voice
   - Desktop defaults to text

4. **AI Memory**
   - Remember previous conversations
   - Personalize based on history

5. **Multi-Language**
   - Support Spanish, French, etc.
   - Auto-detect language preference

## 📝 Notes

- Both systems write to same database tables
- Chat adds `source: "vapi_chat"` field to track origin
- User context (userId) automatically passed from widget
- All existing form validation/business logic is reused
- No duplicate code - webhook calls existing APIs

## 🔗 Related Documentation

- `markdowns/custom-vapi-chat-interface.md` - Original implementation
- `src/pages/api/vapi/webhook.ts` - Function calling webhook
- `src/components/chat/VapiChatInterface.astro` - Chat component
- `src/components/form/MultiStepForm.astro` - Form component

---

**Status:** Ready to implement Step 1 (webhook function) and Step 2 (hybrid page)  
**Timeline:** ~1 hour to complete hybrid system  
**Next:** Add submitContactForm to webhook, create hybrid contact page, test
