import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export class CommandProcessor extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.commands = this.initializeCommands();
  }

  initializeCommands() {
    return {
      // Time commands
      'what time': () => this.getTime(),
      'what\'s the time': () => this.getTime(),
      'time': () => this.getTime(),
      
      // Date commands
      'what date': () => this.getDate(),
      'what\'s the date': () => this.getDate(),
      'date': () => this.getDate(),
      
      // System commands
      'system info': () => this.getSystemInfo(),
      'system status': () => this.getSystemInfo(),
      
      // File operations
      'list files': () => this.listFiles(),
      'list directory': () => this.listFiles(),
      
      // Calculator
      'calculate': (text) => this.calculate(text),
      'what is': (text) => this.calculate(text),
      
      // Web search (placeholder)
      'search for': (text) => this.searchWeb(text),
      'google': (text) => this.searchWeb(text),
      
      // Custom tasks
      'open': (text) => this.openApplication(text),
      'launch': (text) => this.openApplication(text),
      
      // Help
      'help': () => this.getHelp(),
      'what can you do': () => this.getHelp(),
    };
  }

  process(text) {
    const lowerText = text.toLowerCase().trim();
    
    // Remove wake word if present
    const wakeWord = this.config.wakeWord.toLowerCase();
    let commandText = lowerText.replace(wakeWord, '').trim();
    
    // Try to match commands
    for (const [pattern, handler] of Object.entries(this.commands)) {
      if (commandText.includes(pattern)) {
        try {
          return handler(commandText);
        } catch (error) {
          return `Sorry, I encountered an error: ${error.message}`;
        }
      }
    }
    
    // Default response
    return `I heard: "${text}". I'm not sure how to help with that. Say "help" to see what I can do.`;
  }

  getTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true 
    });
    return `The time is ${time}`;
  }

  getDate() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `Today is ${date}`;
  }

  async getSystemInfo() {
    const platform = os.platform();
    const arch = os.arch();
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    
    return `System: ${platform} ${arch}. Memory: ${freeMem} GB free of ${totalMem} GB total.`;
  }

  async listFiles() {
    try {
      const { stdout } = await execAsync('ls -la');
      const files = stdout.split('\n').slice(1).filter(line => line.trim());
      const fileList = files.slice(0, 10).map(line => {
        const parts = line.split(/\s+/);
        return parts[parts.length - 1];
      }).join(', ');
      
      return `Here are some files: ${fileList}`;
    } catch (error) {
      return `Sorry, I couldn't list the files: ${error.message}`;
    }
  }

  calculate(text) {
    // Extract math expression
    const mathMatch = text.match(/(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)/);
    if (!mathMatch) {
      return "I couldn't understand the calculation. Try something like 'calculate 5 plus 3'";
    }
    
    const [, num1, op, num2] = mathMatch;
    const a = parseFloat(num1);
    const b = parseFloat(num2);
    
    let result;
    switch (op) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      case '*':
        result = a * b;
        break;
      case '/':
        if (b === 0) return "I can't divide by zero";
        result = a / b;
        break;
      default:
        return "I don't understand that operation";
    }
    
    return `The answer is ${result}`;
  }

  searchWeb(text) {
    const query = text.replace(/search for|google/gi, '').trim();
    // In a real implementation, you'd open a browser or use an API
    return `I would search for "${query}" if I had web search capabilities configured.`;
  }

  async openApplication(text) {
    const appName = text.replace(/open|launch/gi, '').trim();
    const platform = os.platform();
    
    try {
      if (platform === 'darwin') {
        // macOS
        await execAsync(`open -a "${appName}"`);
        return `Opening ${appName}`;
      } else if (platform === 'win32') {
        // Windows
        await execAsync(`start ${appName}`);
        return `Opening ${appName}`;
      } else {
        // Linux
        await execAsync(`${appName}`);
        return `Opening ${appName}`;
      }
    } catch (error) {
      return `Sorry, I couldn't open ${appName}: ${error.message}`;
    }
  }

  getHelp() {
    const commands = [
      'Ask for the time or date',
      'Get system information',
      'List files in current directory',
      'Perform calculations',
      'Open applications',
      'Say "help" anytime'
    ];
    
    return `I can help you with: ${commands.join(', ')}. What would you like to do?`;
  }
}

