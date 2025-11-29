import mic from 'mic';
import { EventEmitter } from 'events';

export class AudioRecorder extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.micInstance = null;
    this.micInputStream = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.micInstance = mic({
          rate: this.config.sampleRate,
          channels: this.config.channels,
          device: 'default',
          exitOnSilence: 0,
        });

        this.micInputStream = this.micInstance.getAudioStream();

        this.micInputStream.on('error', (error) => {
          this.emit('error', error);
        });

        this.micInstance.start();
        
        console.log('Audio recorder started');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  getStream() {
    return this.micInputStream;
  }

  stop() {
    if (this.micInstance) {
      try {
        this.micInstance.stop();
      } catch (error) {
        // Ignore stop errors
      }
    }
    this.micInstance = null;
    this.micInputStream = null;
  }
}

