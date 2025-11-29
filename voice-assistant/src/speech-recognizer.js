import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SpeechRecognizer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.model = null;
    this.recognizer = null;
    this.isInitialized = false;
    this.audioBuffer = Buffer.alloc(0);
    this.lastText = '';
    this.silenceCounter = 0;
    this.useFallback = false;
    this.vosk = null;
  }

  async initialize() {
    try {
      // Try to import Vosk dynamically (optional dependency)
      try {
        const voskModule = await import('vosk');
        this.vosk = voskModule.default || voskModule;
      } catch (error) {
        // Vosk not installed, will use fallback mode
        this.vosk = null;
      }

      // Check if Vosk is available
      if (!this.vosk) {
        console.warn('Vosk not installed. Using fallback mode.');
        console.warn('For offline speech recognition, install Vosk: npm install vosk');
        console.warn('Or use the web version (web-assistant.html) which uses browser speech recognition.');
        this.useFallback = true;
        this.isInitialized = true;
        return;
      }

      // Check if model exists
      const modelPath = this.config.modelPath;
      
      if (!fs.existsSync(modelPath)) {
        console.warn(`Model not found at ${modelPath}`);
        console.warn('Using fallback mode. To use Vosk offline recognition:');
        console.warn('1. Download a model from: https://alphacephei.com/vosk/models');
        console.warn(`2. Extract it to: ${modelPath}`);
        console.warn('3. Restart the assistant');
        console.warn('Or use the web version (web-assistant.html) for immediate testing.');
        
        // Fallback: use a simple text-based approach for testing
        this.useFallback = true;
        this.isInitialized = true;
        return;
      }

      if (!fs.existsSync(join(modelPath, 'am', 'final.mdl'))) {
        throw new Error(`Invalid model directory: ${modelPath}`);
      }

      console.log(`Loading Vosk model from ${modelPath}...`);
      this.model = new this.vosk.Model(modelPath);
      this.recognizer = new this.vosk.Recognizer({
        model: this.model,
        sampleRate: this.config.sampleRate,
      });

      this.isInitialized = true;
      console.log('Speech recognizer initialized');
    } catch (error) {
      console.error('Failed to initialize speech recognizer:', error.message);
      console.warn('Falling back to basic mode. Use web-assistant.html for full functionality.');
      this.useFallback = true;
      this.isInitialized = true;
    }
  }

  processAudio(chunk) {
    if (!this.isInitialized) return;
    
    if (this.useFallback) {
      // Fallback mode - would need Web Speech API or manual input
      // For now, we'll skip processing
      return;
    }

    if (!this.recognizer) return;

    try {
      // Process audio chunk
      if (this.recognizer.acceptWaveform(chunk)) {
        const result = JSON.parse(this.recognizer.result());
        if (result.text && result.text !== this.lastText) {
          this.lastText = result.text;
          this.emit('text', result.text);
        }
      } else {
        // Partial result
        const partial = JSON.parse(this.recognizer.partialResult());
        if (partial.partial && partial.partial !== this.lastText) {
          // Could emit partial results for real-time feedback
        }
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  stop() {
    if (this.recognizer) {
      this.recognizer.free();
    }
    if (this.model) {
      this.model.free();
    }
    this.isInitialized = false;
    this.audioBuffer = Buffer.alloc(0);
  }
}

