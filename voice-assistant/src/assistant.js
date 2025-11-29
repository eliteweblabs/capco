import { EventEmitter } from 'events';
import { AudioRecorder } from './audio-recorder.js';
import { WakeWordDetector } from './wake-word-detector.js';
import { SpeechRecognizer } from './speech-recognizer.js';
import { AICommandProcessor } from './ai-command-processor.js';
import { SpeechSynthesizer } from './speech-synthesizer.js';

export class VoiceAssistant extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.isListening = false;
    this.isAwake = false;
    
    // Initialize components
    this.audioRecorder = new AudioRecorder(config);
    this.wakeWordDetector = new WakeWordDetector(config);
    this.speechRecognizer = new SpeechRecognizer(config);
    // Use AI-powered command processor
    this.commandProcessor = new AICommandProcessor(config);
    this.speechSynthesizer = config.enableSpeechResponse 
      ? new SpeechSynthesizer(config) 
      : null;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Wake word detection
    this.wakeWordDetector.on('wake', () => {
      this.handleWake();
    });

    // Speech recognition - used for both wake word and command detection
    this.speechRecognizer.on('text', (text) => {
      if (!this.isAwake) {
        // Check if wake word is in the recognized text
        if (this.wakeWordDetector.detectWakeWord(text)) {
          // Wake word detected, don't process as command yet
          return;
        }
      } else {
        // We're awake, process as command
        this.handleSpeech(text);
      }
    });

    this.speechRecognizer.on('error', (error) => {
      this.emit('error', error);
    });

    // Audio recorder
    this.audioRecorder.on('error', (error) => {
      this.emit('error', error);
    });
  }

  async start() {
    try {
      console.log('Initializing audio recorder...');
      await this.audioRecorder.start();
      
      console.log('Initializing wake word detector...');
      await this.wakeWordDetector.initialize();
      
      console.log('Initializing speech recognizer...');
      await this.speechRecognizer.initialize();
      
      if (this.speechSynthesizer) {
        console.log('Initializing speech synthesizer...');
        await this.speechSynthesizer.initialize();
      }

      this.isListening = true;
      this.startListening();
      
      this.emit('ready');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  startListening() {
    if (!this.isListening) return;

    const audioStream = this.audioRecorder.getStream();
    
    // Always process audio through speech recognizer
    // It will detect wake words when not awake, and commands when awake
    audioStream.on('data', (chunk) => {
      // Process through speech recognizer (which handles wake word detection too)
      this.speechRecognizer.processAudio(chunk);
      
      // Also process through wake word detector for potential future improvements
      if (!this.isAwake) {
        this.wakeWordDetector.processAudio(chunk);
      }
    });
  }

  handleWake() {
    if (this.isAwake) return; // Already awake
    
    this.isAwake = true;
    this.emit('wake');
    
    if (this.speechSynthesizer) {
      this.speechSynthesizer.speak('Yes, how can I help?');
    }
    
    // Reset after timeout if no command received
    this.commandTimeout = setTimeout(() => {
      if (this.isAwake) {
        this.isAwake = false;
        console.log('Returning to wake word listening mode...');
      }
    }, 10000); // 10 second timeout
  }

  async handleSpeech(text) {
    if (!this.isAwake) return;
    
    // Clear the timeout since we received a command
    if (this.commandTimeout) {
      clearTimeout(this.commandTimeout);
    }

    // Check if it's a command or just noise
    const trimmedText = text.trim().toLowerCase();
    
    if (trimmedText.length < 3) {
      return; // Too short, probably noise
    }

    this.emit('command', text);
    
    // Show processing indicator
    if (this.speechSynthesizer) {
      this.speechSynthesizer.speak('Let me think...');
    }
    
    try {
      // Process the command using AI (async)
      const response = await this.commandProcessor.process(text);
      
      if (response) {
        this.emit('response', response);
        
        if (this.speechSynthesizer) {
          this.speechSynthesizer.speak(response);
        }
      }
    } catch (error) {
      console.error('Error processing command:', error);
      const errorResponse = "I'm sorry, I encountered an error processing that. Could you try again?";
      this.emit('response', errorResponse);
      
      if (this.speechSynthesizer) {
        this.speechSynthesizer.speak(errorResponse);
      }
    }
    
    // Return to wake word listening mode
    setTimeout(() => {
      this.isAwake = false;
      console.log('Returning to wake word listening mode...');
    }, 2000);
  }

  stop() {
    this.isListening = false;
    this.isAwake = false;
    
    if (this.commandTimeout) {
      clearTimeout(this.commandTimeout);
    }
    
    this.audioRecorder.stop();
    this.wakeWordDetector.stop();
    this.speechRecognizer.stop();
    
    if (this.speechSynthesizer) {
      this.speechSynthesizer.stop();
    }
  }
}

