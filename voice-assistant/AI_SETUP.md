# AI-Powered Voice Assistant Setup Guide

This guide will help you set up the AI-powered voice assistant that uses Anthropic's Claude API and Supabase learning tables.

## Prerequisites

1. **Node.js 18+** installed
2. **Anthropic API Key** - Get one from [console.anthropic.com](https://console.anthropic.com)
3. **Supabase Project** - Your existing Supabase project with learning tables

## Quick Setup

1. **Navigate to voice-assistant directory:**
   ```bash
   cd voice-assistant
   ```

2. **Run setup script:**
   ```bash
   ./setup.sh
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure environment variables:**

   Edit the `.env` file and add:

   ```env
   # Required: Anthropic API Key
   ANTHROPIC_API_KEY=sk-ant-api03-...

   # Required: Supabase Configuration
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET=your-service-role-key-here
   ```

   **Where to find these values:**
   - **ANTHROPIC_API_KEY**: Get from [Anthropic Console](https://console.anthropic.com) → API Keys
   - **PUBLIC_SUPABASE_URL**: Supabase Dashboard → Project Settings → API → Project URL
   - **SUPABASE_SECRET**: Supabase Dashboard → Project Settings → API → Service Role Key (secret)

## Supabase Learning Tables Setup

The assistant uses these tables from your Supabase database:

### 1. `ai_agent_knowledge` Table

This table stores knowledge that the assistant can use. Make sure it exists:

```sql
CREATE TABLE IF NOT EXISTS ai_agent_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  priority INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "authorId" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "projectId" INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### 2. Adding Knowledge Entries

You can add knowledge entries via Supabase Dashboard or SQL:

```sql
INSERT INTO ai_agent_knowledge (title, content, category, "isActive")
VALUES (
  'Fire Protection Standards',
  'NFPA 72 covers fire alarm systems. NFPA 13 covers sprinkler systems.',
  'nfpa_standards',
  true
);
```

The assistant will automatically load active knowledge entries (`isActive = true`) when processing commands.

## Starting the Assistant

Once configured, start the assistant:

```bash
npm start
```

The assistant will:
1. Initialize audio recording
2. Connect to Anthropic API
3. Connect to Supabase
4. Start listening for the wake word (default: "hey assistant")

## Usage

1. **Say the wake word**: "hey assistant" (or your custom wake word)
2. **Wait for confirmation**: The assistant will say "Yes, how can I help?"
3. **Ask your question**: Speak naturally, e.g., "What are fire protection standards?"
4. **Get AI response**: The assistant uses Claude API with knowledge from Supabase

## Features

- ✅ **Always-On**: Continuously listens for wake word
- ✅ **AI-Powered**: Uses Anthropic's Claude API for intelligent responses
- ✅ **Knowledge Base**: Leverages Supabase `ai_agent_knowledge` table
- ✅ **Context-Aware**: Maintains conversation history
- ✅ **Natural Language**: Understands natural speech, no hardcoded commands needed

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable is required"
- Make sure `.env` file exists in `voice-assistant/` directory
- Check that `ANTHROPIC_API_KEY` is set in `.env`
- Restart the assistant after changing `.env`

### "Supabase not configured"
- Ensure `PUBLIC_SUPABASE_URL` is set
- Ensure either `SUPABASE_SECRET` or `PUBLIC_SUPABASE_PUBLISHABLE` is set
- Check that your Supabase project is active

### Knowledge not loading
- Verify `ai_agent_knowledge` table exists in Supabase
- Check that entries have `isActive = true`
- Ensure RLS policies allow reading (or use service role key)

### Microphone not working
- Grant microphone permissions to Terminal/iTerm
- macOS: System Preferences → Security & Privacy → Privacy → Microphone
- Check microphone is working in other apps

## Advanced Configuration

### Custom Wake Word
```env
WAKE_WORD=hey siri
```

### Disable Voice Responses
```env
ENABLE_SPEECH_RESPONSE=false
```

### Change Voice (macOS)
```env
VOICE=Samantha
```

List available voices: `say -v ?`

## Next Steps

- Add more knowledge entries to `ai_agent_knowledge` table
- Customize the system prompt in `ai-command-processor.js`
- Add project-specific memory using `ai_agent_project_memory` table
- Integrate with other services (calendar, reminders, etc.)

