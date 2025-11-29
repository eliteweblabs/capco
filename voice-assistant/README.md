# Voice Assistant

A personal AI-powered voice assistant (like Siri) with wake word detection that listens for commands and executes tasks using Anthropic's Claude API and Supabase learning tables.

## Features

- 🎤 **Wake Word Detection** - Always listening for your custom wake word
- 🗣️ **Speech Recognition** - Converts your voice commands to text
- 💬 **Speech Synthesis** - Responds with voice feedback
- 🤖 **AI-Powered** - Uses Anthropic's Claude API for intelligent responses
- 🧠 **Learning System** - Leverages Supabase learning tables for context-aware responses
- ⚙️ **Always-On** - Continuously runs and listens for wake word
- 🔧 **Context-Aware** - Remembers conversation history

## Prerequisites

- Node.js 18+ 
- macOS (for best compatibility with audio recording and speech synthesis)
- Microphone access

## Quick Start (Web Version)

For the easiest setup, try the web version first:

1. Start your Astro dev server: `npm run dev`
2. Navigate to `/voice-assistant` in your browser
3. Click the microphone button to start listening
4. Say your wake word (default: "hey assistant") followed by a command

**Note**: The web version uses your browser's built-in speech recognition and doesn't require any installation!

## Installation (Node.js Version)

For a more powerful, always-running assistant:

1. Navigate to the voice-assistant directory:
```bash
cd voice-assistant
```

2. Run the setup script:
```bash
./setup.sh
```

Or manually:

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` and configure:
   - `ANTHROPIC_API_KEY` - Your Anthropic API key (required for AI responses)
   - `PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SECRET` - Your Supabase service role key (or use `PUBLIC_SUPABASE_PUBLISHABLE`)

3. (Optional) Download Vosk model for offline speech recognition:
   - Visit https://alphacephei.com/vosk/models
   - Download a small English model (e.g., `vosk-model-small-en-us-0.15`)
   - Extract it to `./models/vosk-model-small-en-us-0.15/`

## Configuration

Edit `.env` to customize:

### Required Settings
- `ANTHROPIC_API_KEY` - Your Anthropic API key (get from https://console.anthropic.com)
- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SECRET` - Your Supabase service role key (or `PUBLIC_SUPABASE_PUBLISHABLE` for anon key)

### Optional Settings
- `WAKE_WORD` - Your custom wake word (default: "hey assistant")
- `WAKE_WORD_SENSITIVITY` - Detection sensitivity (0.0-1.0)
- `LANGUAGE` - Language code (default: "en-US")
- `MODEL_PATH` - Path to Vosk model (if using offline recognition)
- `ENABLE_SPEECH_RESPONSE` - Enable/disable voice responses
- `VOICE` - macOS voice name (default: "Alex")

## Usage

Start the assistant:
```bash
npm start
```

Or in development mode with auto-reload:
```bash
npm run dev
```

## How It Works

1. **Wake Word Detection**: Continuously listens for your wake word (always-on)
2. **Command Listening**: After wake word is detected, listens for your command
3. **AI Processing**: 
   - Loads knowledge from Supabase learning tables (`ai_agent_knowledge`)
   - Sends command to Anthropic's Claude API with context
   - Maintains conversation history for context-aware responses
4. **Response**: Provides intelligent feedback via text and/or voice

## AI-Powered Features

The assistant uses Anthropic's Claude API for intelligent responses, which means:

- **Natural Conversations**: Understands context and can have natural back-and-forth conversations
- **Knowledge Base**: Leverages information stored in Supabase `ai_agent_knowledge` table
- **Learning**: Can learn from interactions and use stored knowledge
- **Flexible**: No need to hardcode commands - understands natural language

### Example Interactions

- "What's the weather like?" (if knowledge base has weather info)
- "Tell me about fire protection standards" (uses knowledge from `ai_agent_knowledge`)
- "What did we discuss earlier?" (uses conversation history)
- "Help me with [any topic]" (intelligent responses based on context)

## Learning Tables Integration

The assistant automatically loads knowledge from your Supabase database:

- **`ai_agent_knowledge`**: Global knowledge entries available to all conversations
- **`ai_agent_project_memory`**: Project-specific memory (if projectId is provided)

To add knowledge, insert entries into the `ai_agent_knowledge` table in Supabase with:
- `title`: Brief title of the knowledge
- `content`: The actual knowledge/information
- `category`: Optional category (e.g., "company_policy", "nfpa_standards", "procedures")
- `isActive`: Set to `true` to make it available
- `projectId`: `NULL` for global knowledge, or specific project ID for project-specific knowledge

## Architecture

- `index.js` - Main entry point
- `assistant.js` - Core assistant orchestrator
- `audio-recorder.js` - Handles microphone input
- `wake-word-detector.js` - Detects wake words
- `speech-recognizer.js` - Converts speech to text
- `ai-command-processor.js` - **AI-powered command processor** (uses Anthropic API + Supabase)
- `command-processor.js` - Legacy command processor (fallback)
- `speech-synthesizer.js` - Converts text to speech

## Troubleshooting

### Audio Issues
- Ensure microphone permissions are granted
- Check that your microphone is working
- On macOS, you may need to grant Terminal/iTerm microphone access
- On Linux, you may need to install `sox` or `alsa-utils`: `sudo apt-get install sox alsa-utils`

### Speech Recognition Issues
- If Vosk model is not found, the assistant will use fallback mode
- Download a Vosk model for offline recognition
- Consider using cloud-based speech recognition APIs for better accuracy
- **Try the web version** (`web-assistant.html`) if Node.js version has issues - it uses browser's built-in speech recognition

### Wake Word Detection
- The current implementation uses keyword matching through speech recognition
- For production use, consider integrating Porcupine (Picovoice) for better wake word detection
- The web version works well for testing and basic usage

### macOS Specific
- You may need to grant microphone access in System Preferences > Security & Privacy > Privacy > Microphone
- The `say` command is built-in, so speech synthesis should work out of the box

## Troubleshooting

### AI/API Issues
- **"ANTHROPIC_API_KEY environment variable is required"**: Make sure you've set `ANTHROPIC_API_KEY` in your `.env` file
- **"Supabase not configured"**: Ensure `PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET` (or `PUBLIC_SUPABASE_PUBLISHABLE`) are set
- **Rate limiting**: If you hit rate limits, the assistant will inform you - wait a moment and try again
- **Knowledge not loading**: Check that `ai_agent_knowledge` table exists in Supabase and has entries with `isActive = true`

### Always-On Behavior
- The assistant runs continuously once started with `npm start`
- It listens for the wake word in the background
- After detecting the wake word, it listens for your command
- Returns to wake word listening mode after responding
- To stop, press `Ctrl+C` in the terminal

## Future Enhancements

- [x] AI-powered responses using Anthropic API
- [x] Integration with Supabase learning tables
- [ ] Integrate Porcupine for professional wake word detection
- [ ] Add cloud-based speech recognition (Google Cloud Speech, AWS Transcribe)
- [ ] Support for multiple languages
- [ ] Automatic learning from conversations (store in knowledge base)
- [ ] Web interface for configuration
- [ ] Integration with smart home devices
- [ ] Calendar and reminder functionality

## License

ISC

