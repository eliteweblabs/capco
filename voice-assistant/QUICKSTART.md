# Quick Start Guide

## Option 1: Web Version (Easiest - No Installation!)

1. Start your Astro dev server: `npm run dev` (from project root)
2. Navigate to `http://localhost:4321/voice-assistant` in Chrome, Edge, or Safari
3. Click the microphone button 🎤
4. Say: **"hey assistant, what time is it"**
5. That's it! The assistant will respond.

**Pros:**
- ✅ No installation needed
- ✅ Works immediately
- ✅ Uses browser's built-in speech recognition
- ✅ Great for testing

**Cons:**
- ❌ Requires browser to be open
- ❌ Not always-on (need to click mic button)

---

## Option 2: Node.js Version (Always-On Assistant)

### macOS Setup:

1. **Install dependencies:**
   ```bash
   cd voice-assistant
   npm install
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Grant microphone access:**
   - System Preferences → Security & Privacy → Privacy → Microphone
   - Enable access for Terminal (or iTerm if you use it)

4. **Start the assistant:**
   ```bash
   npm start
   ```

5. **Say your wake word:**
   - Default: **"hey assistant"**
   - Then say a command like: **"what time is it"**

### Troubleshooting Node.js Version:

**If you get audio errors:**
- Make sure microphone permissions are granted
- Try installing `sox`: `brew install sox` (macOS) or `sudo apt-get install sox` (Linux)

**If speech recognition doesn't work:**
- The assistant will work in fallback mode without Vosk model
- For better accuracy, download a Vosk model:
  1. Visit: https://alphacephei.com/vosk/models
  2. Download: `vosk-model-small-en-us-0.15.zip`
  3. Extract to: `./models/vosk-model-small-en-us-0.15/`

---

## Customizing Your Wake Word

Edit `.env` file:
```env
WAKE_WORD=hey jarvis
```

Or in the web version, change the input field at the top.

---

## Example Commands

- **"hey assistant, what time is it"**
- **"hey assistant, what date is it"**
- **"hey assistant, calculate 10 plus 5"**
- **"hey assistant, system info"**
- **"hey assistant, help"**

---

## Next Steps

- Add custom commands in `src/command-processor.js`
- Integrate with smart home devices
- Add calendar and reminder functionality
- Connect to web APIs for more features

See `README.md` for full documentation!

