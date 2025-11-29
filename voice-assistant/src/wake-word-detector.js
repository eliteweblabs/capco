import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WakeWordDetector extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.wakeWords = this.config.wakeWord.toLowerCase().split(' ');
    this.audioBuffer = Buffer.alloc(0);
    this.isInitialized = false;
    
    // Simple keyword matching approach
    // For production, consider using Porcupine or similar
    this.useSimpleDetection = true;
  }

  async initialize() {
    // For now, we'll use a simple approach
    // In production, you'd initialize Porcupine or similar here
    this.isInitialized = true;
    console.log('Wake word detector initialized (simple mode)');
  }

  processAudio(chunk) {
    if (!this.isInitialized) return;
    
    // Buffer audio for processing
    this.audioBuffer = Buffer.concat([this.audioBuffer, chunk]);
    
    // Keep buffer size reasonable (2 seconds of audio)
    const maxBufferSize = this.config.sampleRate * 2 * 2; // 2 seconds * 2 bytes per sample
    if (this.audioBuffer.length > maxBufferSize) {
      this.audioBuffer = this.audioBuffer.slice(-maxBufferSize);
    }
    
    // Simple detection: check periodically
    // In a real implementation, you'd use a proper wake word detection library
    // For now, we'll rely on speech recognition to detect the wake word
    this.checkWakeWord();
  }

  checkWakeWord() {
    // This is a placeholder - in production, use proper wake word detection
    // For now, we'll use a hybrid approach where speech recognition helps
    // detect the wake word. This is less efficient but works without
    // requiring Porcupine API keys or model downloads.
  }

  // Method to be called by speech recognizer when wake word is detected
  detectWakeWord(text) {
    const lowerText = text.toLowerCase();
    const wakePhrase = this.config.wakeWord.toLowerCase();
    
    if (lowerText.includes(wakePhrase)) {
      this.emit('wake');
      return true;
    }
    
    return false;
  }

  stop() {
    this.isInitialized = false;
    this.audioBuffer = Buffer.alloc(0);
  }
}

