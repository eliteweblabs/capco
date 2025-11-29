import { EventEmitter } from 'events';
import say from 'say';
import os from 'os';

export class SpeechSynthesizer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.isInitialized = false;
    this.isSpeaking = false;
  }

  async initialize() {
    // Check if 'say' command is available (macOS) or use alternative
    const platform = os.platform();
    
    if (platform === 'darwin') {
      // macOS has built-in 'say' command
      this.isInitialized = true;
      console.log('Speech synthesizer initialized (macOS say)');
    } else {
      // For other platforms, you might need espeak or similar
      console.warn('Speech synthesis may not work on this platform');
      this.isInitialized = true;
    }
  }

  speak(text) {
    if (!this.isInitialized || this.isSpeaking) return;
    
    this.isSpeaking = true;
    
    const platform = os.platform();
    const voice = this.config.voice;
    
    if (platform === 'darwin') {
      say.speak(text, voice, (err) => {
        this.isSpeaking = false;
        if (err) {
          this.emit('error', err);
        }
      });
    } else {
      // Fallback: just log
      console.log(`[TTS]: ${text}`);
      this.isSpeaking = false;
    }
  }

  stop() {
    if (this.isSpeaking) {
      try {
        say.stop();
      } catch (error) {
        // Ignore stop errors
      }
      this.isSpeaking = false;
    }
  }
}

