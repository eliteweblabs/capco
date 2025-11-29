#!/usr/bin/env node

import { VoiceAssistant } from './assistant.js';
import { config } from './config.js';

console.log('🎤 Voice Assistant Starting...');
console.log(`Wake word: "${config.wakeWord}"`);
console.log('Listening for wake word...\n');

const assistant = new VoiceAssistant(config);

assistant.on('wake', () => {
  console.log('✅ Wake word detected! Listening for command...');
});

assistant.on('command', (command) => {
  console.log(`📝 Command received: "${command}"`);
});

assistant.on('response', (response) => {
  console.log(`💬 Response: "${response}"`);
});

assistant.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

assistant.on('ready', () => {
  console.log('✅ Voice Assistant is ready!\n');
});

// Start the assistant
assistant.start().catch((error) => {
  console.error('Failed to start assistant:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down voice assistant...');
  assistant.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down voice assistant...');
  assistant.stop();
  process.exit(0);
});

