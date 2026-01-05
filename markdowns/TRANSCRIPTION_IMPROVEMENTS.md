# Transcription Accuracy Improvements

## Problem
The browser's Web Speech API can produce inaccurate transcriptions, especially for:
- Technical terms (NFPA, fire protection, etc.)
- Proper nouns
- Numbers
- Accented speech
- Background noise

## Solutions Implemented

### 1. Enhanced Web Speech API Configuration
- ✅ Enabled `interimResults` for real-time feedback
- ✅ Set `maxAlternatives` to get multiple transcription options
- ✅ Added grammar hints for wake word recognition
- ✅ Improved audio settings (echo cancellation, noise suppression)

### 2. Post-Processing Corrections
- ✅ Common word corrections (contractions, technical terms)
- ✅ Wake word variations (be, b, bee → Bee)
- ✅ NFPA and fire protection terminology fixes
- ✅ Number word-to-digit conversion

### 3. Cloud-Based Transcription (Optional)
- ✅ Deepgram API integration (best accuracy)
- ✅ Google Cloud Speech-to-Text support
- ✅ Fallback to Web Speech API if cloud not configured

## Setup Instructions

### Option 1: Use Enhanced Web Speech API (Default)
No setup needed! The improvements are automatic.

### Option 2: Use Cloud Transcription (Better Accuracy)

#### Deepgram (Recommended - Best Accuracy)
1. Sign up at https://deepgram.com (free tier available)
2. Get your API key from the dashboard
3. Add to your `.env` file:
   ```env
   DEEPGRAM_API_KEY=your-deepgram-api-key-here
   ```
4. Enable "Use cloud transcription" checkbox in the voice assistant

#### Google Cloud Speech-to-Text
1. Set up Google Cloud project
2. Enable Speech-to-Text API
3. Create API key or service account
4. Add to your `.env` file:
   ```env
   GOOGLE_CLOUD_SPEECH_API_KEY=your-google-api-key-here
   ```

## Usage Tips

1. **Speak Clearly**: Enunciate words, especially technical terms
2. **Reduce Background Noise**: Use in a quiet environment
3. **Use Cloud Transcription**: Enable for best accuracy
4. **Check Debug Info**: Look at the debug panel to see what was transcribed
5. **Correct Manually**: If transcription is wrong, you can edit the wake word input to help with future recognition

## Common Transcription Errors Fixed

- "be" → "Bee"
- "nfpa" → "NFPA"
- "what's" → "what is"
- "fire protection" → "fire protection"
- Numbers: "one" → "1"

## Testing

1. Start the voice assistant
2. Enable "Use cloud transcription" if you have API keys
3. Say: "Bee what is NFPA?"
4. Check the debug panel to see the raw transcript
5. Compare with the corrected version

## Future Improvements

- [ ] Add user-specific vocabulary learning
- [ ] Implement confidence scoring
- [ ] Add transcription history for corrections
- [ ] Support for multiple languages
- [ ] Custom vocabulary dictionary

