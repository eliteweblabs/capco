# VAPI.ai Voice Assistant Setup Guide

## Why VAPI.ai?

You're absolutely right - VAPI.ai is a much better solution than browser-based speech recognition because:

1. **Voice Authentication** - Only responds to YOUR voice (prevents accidental triggers)
2. **Better Transcription** - Cloud-based, more accurate than browser APIs
3. **Natural Conversation** - Handles interruptions and natural speech flow better
4. **No Continuous Listening Issues** - Only active when you explicitly start it
5. **Professional Quality** - Enterprise-grade voice AI infrastructure

## Setup Steps

### 1. Create the Project Creation Tool

```bash
node scripts/create-project-tool.js
```

This will create a VAPI tool that can create projects. Save the Tool ID it returns.

### 2. Add Tool to Your Assistant

Add the tool ID to your VAPI assistant configuration. You can either:

**Option A: Via Script**
```bash
node scripts/add-tool-to-assistant.js <TOOL_ID>
```

**Option B: Via VAPI Dashboard**
1. Go to https://dashboard.vapi.ai
2. Select your assistant
3. Go to "Tools" section
4. Add the tool ID

### 3. Configure Voice Authentication (CRITICAL)

In your VAPI assistant settings:

1. **Enable Voice Authentication**:
   - Go to Assistant Settings → Security
   - Enable "Voice Authentication" or "Speaker Recognition"
   - This will require you to train the system with your voice

2. **Train Your Voice**:
   - VAPI will prompt you to record a few phrases
   - Speak clearly and naturally
   - The system will learn your voice characteristics
   - Only YOUR voice will trigger the assistant

3. **Set Sensitivity**:
   - Adjust sensitivity to balance security vs convenience
   - Higher = more strict (only your exact voice)
   - Lower = more lenient (similar voices might work)

### 4. Update Assistant System Prompt

Add project creation instructions to your assistant's system prompt:

```
## Project Creation

When the user says "Bee new project" or "create a new project":
1. Ask if they want to use an existing client or create a new one
2. If existing: Ask for client name/email to search
3. If new: Collect first name, last name, email, company name
4. Then collect project details:
   - Address (required)
   - Title (optional, defaults to address)
   - Description
   - Square footage
   - New construction? (yes/no)
   - Building type(s)
   - Project type(s)
5. Call createProject() function with all collected information
6. Confirm the project was created successfully
```

### 5. Use the VAPI Voice Assistant Page

Instead of the browser-based voice assistant, use the new VAPI-based one:

1. The new page will be at `/voice-assistant-vapi` (we'll create this)
2. It uses VAPI's SDK which handles all speech recognition
3. Voice authentication is handled automatically by VAPI
4. No accidental triggers because it only responds to your voice

## Benefits Over Browser-Based Solution

| Feature | Browser-Based | VAPI.ai |
|---------|--------------|---------|
| Voice Auth | ❌ No | ✅ Yes - Only your voice |
| Accidental Triggers | ❌ Common | ✅ Prevented |
| Transcription Quality | ⚠️ Variable | ✅ Excellent |
| Interruption Handling | ⚠️ Poor | ✅ Excellent |
| Continuous Listening | ❌ Always on | ✅ Only when active |
| Setup Complexity | ⚠️ Medium | ✅ Low (after initial setup) |

## Next Steps

1. Run the tool creation script
2. Add tool to assistant
3. Configure voice authentication in VAPI dashboard
4. Test with "Bee new project" command
5. Train your voice if prompted

## Troubleshooting

**Voice authentication not working?**
- Make sure you've trained your voice in VAPI dashboard
- Check sensitivity settings
- Try re-training with clearer audio

**Project creation failing?**
- Check webhook logs: `/api/vapi/webhook`
- Verify tool ID is added to assistant
- Check project API logs: `/api/projects/upsert`

**Assistant not responding?**
- Check VAPI dashboard for call logs
- Verify assistant is active
- Check webhook URL is correct in assistant config


