import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

export const config = {
  wakeWord: process.env.WAKE_WORD || 'hey assistant',
  wakeWordSensitivity: parseFloat(process.env.WAKE_WORD_SENSITIVITY) || 0.5,
  language: process.env.LANGUAGE || 'en-US',
  modelPath: process.env.MODEL_PATH || join(__dirname, '../models/vosk-model-small-en-us-0.15'),
  sampleRate: parseInt(process.env.SAMPLE_RATE) || 16000,
  channels: parseInt(process.env.CHANNELS) || 1,
  bitDepth: parseInt(process.env.BIT_DEPTH) || 16,
  enableSpeechResponse: process.env.ENABLE_SPEECH_RESPONSE !== 'false',
  voice: process.env.VOICE || 'Alex',
};

