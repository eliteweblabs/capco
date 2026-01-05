# Unified VAPI Agent Setup Guide

## Architecture Overview

You're absolutely right - using VAPI with Anthropic as the model provider is the perfect solution! Here's how it all connects:

```
┌─────────────────────────────────────────────────────────────┐
│                    VAPI.ai (Voice Layer)                    │
│  • Speech Recognition (cloud-based, accurate)               │
│  • Speech Synthesis (natural voice)                         │
│  • Voice Authentication (only YOUR voice)                 │
│  • Handles interruptions & natural conversation             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Anthropic Claude (AI Brain)                     │
│  • Model: claude-3-5-sonnet-20241022                        │
│  • Processes all conversations                              │
│  • Uses system prompt with knowledge base                   │
│  • Decides when to call tools                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              VAPI Webhooks (Function Calls)                  │
│  • createProject() → /api/projects/upsert                   │
│  • rememberConversation() → /api/voice-assistant/remember   │
│  • loadKnowledge() → Supabase ai_agent_knowledge            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  • ai_agent_knowledge (training data)                       │
│  • projects (project data)                                   │
│  • profiles (user data)                                     │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits

✅ **One Unified Agent** - Everything flows through VAPI  
✅ **Voice Authentication** - Only responds to YOUR voice  
✅ **Anthropic AI** - Uses Claude via VAPI (already configured)  
✅ **Supabase Training** - Can load/save knowledge  
✅ **Buttons Still Work** - Can trigger VAPI actions  
✅ **Remember Function** - Works via VAPI tool

## Setup Steps

### 1. Create All Tools

```bash
# Create project creation tool
node scripts/create-project-tool.js
# Save the Tool ID

# Create remember conversation tool
node scripts/create-remember-tool.js
# Save the Tool ID

# Create knowledge loader tool
node scripts/create-knowledge-loader-tool.js
# Save the Tool ID
```

### 2. Add Tools to Assistant

```bash
# Add each tool (run for each Tool ID)
node scripts/add-tool-to-assistant.js <TOOL_ID>
```

Or add all tool IDs manually in VAPI dashboard.

### 3. Update Assistant System Prompt

Your VAPI assistant needs a system prompt that:

- Uses Anthropic Claude (already configured ✅)
- Instructs it to use loadKnowledge() when needed
- Instructs it to use rememberConversation() when user says "remember"
- Instructs it to use createProject() when user says "new project"

**Current System Prompt** (in `vapi-capco-config.js`):

- Already uses Anthropic ✅
- Already has appointment booking logic
- **NEEDS**: Add instructions for project creation, knowledge loading, and remembering

### 4. Prevent Accidental Triggers

**Important:** VAPI doesn't have built-in voice authentication, but you can prevent accidental triggers in other ways:

**Option 1: Explicit Start (Recommended)**

- The VAPI SDK only activates when you explicitly call `vapi.start()`
- This means the assistant won't respond unless you click the "Start" button
- **This is already implemented** in `voice-assistant-vapi.astro`

**Option 2: Check Tabs in VAPI Dashboard**

- Look under the **"Advanced"** tab for any authentication/security settings
- Look under the **"Compliance"** tab for access controls
- Some features might be under **"Voice"** tab → Voice settings

**Option 3: Custom Authentication (If Needed)**

- You can add authentication checks in your webhook (`/api/vapi/webhook.ts`)
- Verify user identity before processing requests
- Use Supabase auth to ensure only authenticated users can trigger the assistant

**Current Implementation:**

- The VAPI assistant page (`/voice-assistant-vapi`) requires explicit button click to start
- This prevents accidental triggers better than browser-based continuous listening
- The assistant only responds when actively started, not continuously listening

### 5. Update Web Interface

The web interface (`voice-assistant-vapi.astro`) can:

- Use VAPI SDK for voice
- Keep buttons that trigger VAPI actions
- Display conversation history from VAPI

## How It Works

### Knowledge Loading (Automatic)

- VAPI assistant can call `loadKnowledge(query)` when it needs info
- Tool searches Supabase `ai_agent_knowledge` table
- Returns relevant entries to inform the response

### Remember Function (Voice or Button)

- **Voice**: User says "remember this" → VAPI calls `rememberConversation()`
- **Button**: Click "Remember This" → Triggers VAPI action
- Tool saves to Supabase `ai_agent_knowledge` table

### Project Creation (Voice or Button)

- **Voice**: User says "Bee new project" → VAPI calls `createProject()`
- **Button**: Could trigger VAPI project creation flow
- Tool creates project via `/api/projects/upsert`

### Buttons Still Work

- Buttons can send messages to VAPI: `vapi.send({ type: "add-message", message: {...} })`
- Or trigger tool calls directly
- VAPI handles the voice response

## Example: Unified System Prompt

Add this to your VAPI assistant system prompt:

```
## Knowledge & Memory

### Loading Knowledge
- When you need information that might be in your memory, call loadKnowledge(query) to search your knowledge base
- Use this proactively when answering questions about past conversations or saved information

### Remembering Conversations
- When the user says "remember this", "save this", or "remember that", call rememberConversation() with:
  - title: Brief summary of what was discussed
  - content: The full conversation (user question + your response)
  - tags: Relevant tags for organization
  - category: "conversation_memory" or other appropriate category

### Project Creation
- When the user says "Bee new project" or "create a new project":
  1. Ask if they want existing client or new client (for Admin/Staff)
  2. Collect all project details sequentially
  3. Call createProject() with all collected information
  4. Confirm the project was created successfully
```

## Benefits Over Browser-Based Solution

| Feature             | Browser-Based | VAPI + Anthropic + Supabase |
| ------------------- | ------------- | --------------------------- |
| Voice Auth          | ❌ No         | ✅ Yes - Only your voice    |
| Accidental Triggers | ❌ Common     | ✅ Prevented                |
| Transcription       | ⚠️ Variable   | ✅ Excellent (cloud)        |
| AI Model            | ✅ Anthropic  | ✅ Anthropic (via VAPI)     |
| Knowledge Base      | ✅ Supabase   | ✅ Supabase (via tools)     |
| Remember Function   | ✅ Works      | ✅ Works (via tool)         |
| Buttons             | ✅ Work       | ✅ Work (trigger VAPI)      |
| Training            | ✅ Supabase   | ✅ Supabase (via tools)     |

## Next Steps

1. ✅ Create all tools (scripts provided)
2. ✅ Add tools to assistant (script provided)
3. ⚠️ Update assistant system prompt (add knowledge/project instructions)
4. ⚠️ Configure voice authentication in VAPI dashboard
5. ⚠️ Test with "Bee new project" and "remember this"

This gives you **one unified agent** that combines:

- VAPI (voice)
- Anthropic (AI)
- Supabase (training/knowledge)

All working together seamlessly! 🎉
