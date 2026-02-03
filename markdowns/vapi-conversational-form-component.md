# VAPI Conversational Form Component

**Created:** Feb 2, 2026  
**Type:** Hybrid Form/Chat Interface

---

## Overview

A conversational form interface that **looks and feels like MultiStepForm** but uses **VAPI voice AI** instead of rigid form fields. Each AI question becomes a "panel" that you progress through, mimicking the step-by-step form experience.

---

## Key Features

✅ **Form-like progression** - Each question appears as a new panel  
✅ **Auto-scroll** - Automatically scrolls to next question after response  
✅ **Voice OR text** - Use your voice or type responses  
✅ **Visual responses** - Your answers appear in formatted cards  
✅ **Typewriter effect** - Questions use same animation as MultiStepForm  
✅ **Completion panel** - Success message when done (like final review step)  

---

## Files

### Component
`/src/components/chat/VapiConversationalForm.astro`
- Main conversational form component
- Mimics MultiStepForm UX
- Auto-creates panels from VAPI conversation

### Test Page
`/src/pages/tests/vapi-conversational-form.astro`
- Demo page to test the component
- Feature comparison
- Technical explanation

---

## Usage

### Basic Example

```astro
---
import VapiConversationalForm from "../components/chat/VapiConversationalForm.astro";
---

<VapiConversationalForm
  title="Let's create your project..."
  introMessage="I'll guide you through this step by step."
/>
```

### With Props

```astro
<VapiConversationalForm
  assistantId="your-assistant-id"
  publicKey="your-vapi-key"
  title="Welcome to the onboarding process!"
  introMessage="Answer a few questions and we'll get you set up."
  containerClass="w-full max-w-3xl mx-auto"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `assistantId` | string | env var | VAPI assistant ID |
| `publicKey` | string | env var | VAPI public key |
| `title` | string | "Let's create..." | Initial panel title |
| `introMessage` | string | "I'll guide you..." | Subtitle text |
| `containerClass` | string | "w-full max-w-2xl..." | Container CSS classes |

---

## How It Works

### 1. Initial Panel (Always Visible)
```
┌─────────────────────────────────────┐
│ Let's create your project...        │
│                                     │
│ I'll guide you through step by step│
│                                     │
│           [Start Button]            │
└─────────────────────────────────────┘
```

### 2. AI Asks First Question (New Panel Created)
```
┌─────────────────────────────────────┐
│ Let's create your project...        │
│ (initial panel scrolls up)          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ What's the address of your project? │
│                                     │
│ (Listening indicator)               │
└─────────────────────────────────────┘
```

### 3. User Responds (Response Card Added)
```
┌─────────────────────────────────────┐
│ What's the address of your project? │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Your response                │ │
│ │ 123 Main St, Boston MA          │ │
│ │                               ✓ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4. AI Asks Next Question (New Panel, Auto-Scroll)
```
(Previous panels scroll up)

┌─────────────────────────────────────┐
│ Great! How many square feet?        │
│                                     │
│ (Listening indicator)               │
└─────────────────────────────────────┘
```

### 5. Completion (Success Panel)
```
┌─────────────────────────────────────┐
│         ✓                           │
│                                     │
│      All set!                       │
│                                     │
│ Your information has been submitted │
└─────────────────────────────────────┘
```

---

## Comparison: Traditional Form vs Conversational

### MultiStepForm
- ✅ Visual form fields (input, textarea, select)
- ✅ Progress bar showing steps
- ✅ Manual typing required
- ✅ Structured, predictable
- ❌ Rigid order (must follow steps)
- ❌ Can't ask clarifying questions
- ❌ Typing only (no voice)

### VapiConversationalForm
- ✅ Form-like panels (visual progression)
- ✅ Auto-scroll between "steps"
- ✅ Voice OR text input
- ✅ Natural conversation flow
- ✅ Can ask questions anytime
- ✅ Flexible order
- ❌ Requires VAPI subscription
- ❌ Less predictable UX

---

## Visual Design

### Panel Structure

Each panel matches MultiStepForm styling:
- Typewriter animation for titles
- Title scroll container (for long text)
- Smooth slide-in animations
- Responsive spacing
- Dark mode support

### Response Cards

User responses appear in styled cards:
```html
┌─────────────────────────────────┐
│ 👤 Your response                │
│                                 │
│ [User's answer text]            │
│                               ✓ │
└─────────────────────────────────┘
```

Features:
- Avatar icon
- Label ("Your response")
- Response text (large, readable)
- Checkmark (visual confirmation)
- Border highlight (matches form focus state)

---

## JavaScript Architecture

### Event Flow

```
User clicks "Start"
    ↓
VAPI call starts
    ↓
AI asks first question (speech-end event)
    ↓
Create new panel with question
    ↓
User responds (transcript message with role="user")
    ↓
Add response card to current panel
    ↓
Auto-scroll to current panel
    ↓
AI asks next question
    ↓
Create new panel
    ↓
Repeat until done
    ↓
Function call (form submission)
    ↓
Show completion panel
```

### Key Functions

**`addAssistantPanel(text)`**
- Creates new panel with AI question
- Applies slide-in animation
- Triggers typewriter effect
- Auto-scrolls to panel

**`addUserResponse(text)`**
- Adds formatted response card to current panel
- Shows checkmark confirmation
- Prepares for next question

**`addCompletionPanel()`**
- Shows success message
- Indicates form submission complete
- Removes listening indicator

**`scrollToPanel(panel)`**
- Smooth scroll to keep current question centered
- Uses `scrollIntoView` with smooth behavior

---

## VAPI Configuration

### System Prompt (Recommended)

```
You are a form assistant that collects information one question at a time.

Guidelines:
- Ask ONE question at a time
- Wait for user response before asking next question
- Keep questions short and clear
- Acknowledge responses briefly ("Great!", "Got it!")
- Don't repeat information back unless confirming
- When all information collected, call submitContactForm function

Example flow:
You: "What's your name?"
User: "John Smith"
You: "Great! What's your email?"
User: "john@example.com"
You: "Got it. What's your phone number?"
[continue until all fields collected]
You: "Perfect! Let me submit this information."
[Call submitContactForm function]
```

### Function Definitions

Use the same function definitions from the hybrid contact system:
- `submitContactForm` - Submit contact data
- `createProject` - Create new project
- etc.

---

## Testing

### Test Page
Visit: `/tests/vapi-conversational-form`

### Manual Test Flow
1. Click "Start" button
2. AI should ask first question
3. Speak or type response
4. New panel should appear with next question
5. Previous panel should show your response in a card
6. Continue until form complete
7. Success panel should appear

### Things to Check
- ✅ Panels slide in smoothly
- ✅ Auto-scroll keeps current question visible
- ✅ Response cards display correctly
- ✅ Typewriter animation works
- ✅ Listening indicator updates
- ✅ Completion panel appears at end
- ✅ Works on mobile (responsive)
- ✅ Dark mode styling correct

---

## Customization

### Change Panel Spacing

```css
.conversation-panel + .conversation-panel {
  margin-top: 3rem; /* Adjust spacing between panels */
}
```

### Modify Response Card Style

In component script, update `addUserResponse()` function:

```javascript
responseContainer.innerHTML = `
  <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-primary-500 p-6">
    <!-- Customize response card HTML here -->
  </div>
`;
```

### Add Progress Indicator

Add after initial panel:

```html
<div class="mt-4 text-center text-sm text-gray-500">
  <span id="progress-text">0 of 5 questions</span>
</div>
```

Update in JavaScript after each question.

---

## Advantages

### Over Traditional Chat
1. **Visual progression** - Feels like completing steps
2. **Permanent display** - Responses stay visible above
3. **Context clarity** - Each Q&A pair is self-contained
4. **Familiar UX** - Matches form experience users know

### Over MultiStepForm
1. **Voice input** - Hands-free option
2. **Natural language** - No rigid field constraints
3. **Flexible order** - Can skip/clarify questions
4. **Ask questions** - Get help during process

---

## Use Cases

### Contact Form
- Collect name, email, phone, message
- Natural conversation instead of fields
- Auto-submit when complete

### Project Creation
- Address, square footage, building type
- AI can explain options
- Voice-friendly for contractors

### Onboarding
- Step-by-step user setup
- Conversational guidance
- Progressive disclosure

### Survey/Feedback
- One question at a time
- Natural responses (not rigid choices)
- Voice option increases completion

---

## Future Enhancements

### Phase 1
- [ ] Add progress indicator (X of Y questions)
- [ ] Allow editing previous responses
- [ ] Show all collected data in review panel

### Phase 2
- [ ] Branch logic (conditional questions)
- [ ] Multi-language support
- [ ] Save partial progress
- [ ] Resume incomplete forms

### Phase 3
- [ ] Rich responses (file upload, images)
- [ ] Real-time validation feedback
- [ ] Integration with existing forms
- [ ] A/B testing framework

---

## Troubleshooting

### Panels not appearing
- Check VAPI webhook is configured
- Verify assistant is asking questions
- Look for transcript messages in console

### Auto-scroll not working
- Check `scrollToPanel()` function
- Ensure panels have correct positioning
- Try adjusting scroll timing

### Responses not displaying
- Verify user transcript messages received
- Check `addUserResponse()` function
- Inspect `user-response-container` in DOM

### Typewriter not animating
- Import typewriter script
- Check `data-text` attribute on h2
- Trigger typewriter event manually

---

## Related Files

- `/src/components/chat/VapiConversationalForm.astro` - Component
- `/src/pages/tests/vapi-conversational-form.astro` - Test page
- `/src/components/form/MultiStepForm.astro` - Traditional form (for comparison)
- `/src/components/chat/VapiChatInterface.astro` - Chat-style interface
- `/src/pages/api/vapi/webhook.ts` - VAPI webhook handler

---

## Summary

The **VapiConversationalForm** bridges the gap between traditional forms and modern conversational AI. It gives you:

1. The **familiar, visual progression** of MultiStepForm
2. The **flexibility and intelligence** of conversational AI
3. The **voice input capability** users increasingly expect
4. A **hybrid UX** that feels like both form and chat

Perfect for users who want structure but hate rigid forms, or who prefer voice input but need visual confirmation of their responses.

---

**Status:** Production ready  
**Test URL:** `/tests/vapi-conversational-form`  
**Dependencies:** VAPI SDK, typewriter script  
**Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)
