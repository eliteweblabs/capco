#!/usr/bin/env node

/**
 * Error Monitoring Script
 * 
 * This script monitors the codebase for TypeScript/Astro errors.
 * It only runs in development mode (when NODE_ENV !== 'production').
 * 
 * Usage:
 *   npm run monitor:errors
 *   or
 *   node scripts/monitor-errors.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Only run in development
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  Error monitoring is disabled in production.');
  process.exit(0);
}

// Configuration
const CHECK_INTERVAL = 30000; // Check every 30 seconds
const ERROR_LOG_FILE = path.join(__dirname, '../.error-log.json');
const MAX_LOG_ENTRIES = 50;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getErrorLog() {
  try {
    if (fs.existsSync(ERROR_LOG_FILE)) {
      return JSON.parse(fs.readFileSync(ERROR_LOG_FILE, 'utf-8'));
    }
  } catch (error) {
    // If file is corrupted, start fresh
  }
  return { errors: [], lastCheck: null, errorCount: 0 };
}

function saveErrorLog(logData) {
  try {
    // Keep only last MAX_LOG_ENTRIES entries
    if (logData.errors.length > MAX_LOG_ENTRIES) {
      logData.errors = logData.errors.slice(-MAX_LOG_ENTRIES);
    }
    fs.writeFileSync(ERROR_LOG_FILE, JSON.stringify(logData, null, 2));
  } catch (error) {
    log(`Failed to save error log: ${error.message}`, 'red');
  }
}

function runCheck() {
  try {
    log('\n🔍 Running type check...', 'cyan');
    const output = execSync('npm run check 2>&1', { 
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });

    // Extract errors from output
    const errorLines = output.split('\n').filter(line => 
      line.includes('error') && !line.includes('warning')
    );

    const errorCount = errorLines.length;
    const logData = getErrorLog();
    
    const previousErrorCount = logData.errorCount || 0;
    const hasNewErrors = errorCount > previousErrorCount;
    const hasFixedErrors = errorCount < previousErrorCount;

    logData.lastCheck = new Date().toISOString();
    logData.errorCount = errorCount;

    if (errorCount > 0) {
      // Extract unique error files
      const errorFiles = new Set();
      errorLines.forEach(line => {
        const match = line.match(/src\/[^\s]+/);
        if (match) errorFiles.add(match[0]);
      });

      logData.errors.push({
        timestamp: new Date().toISOString(),
        count: errorCount,
        files: Array.from(errorFiles),
        sample: errorLines.slice(0, 10) // First 10 errors as sample
      });

      if (hasNewErrors) {
        log(`\n❌ Found ${errorCount} errors (${previousErrorCount} previously)`, 'red');
        log(`   Files with errors: ${errorFiles.size}`, 'yellow');
        log(`   Sample errors:`, 'yellow');
        errorLines.slice(0, 5).forEach(line => {
          log(`   ${line.trim()}`, 'red');
        });
      } else if (hasFixedErrors) {
        log(`\n✅ Errors reduced! ${previousErrorCount} → ${errorCount}`, 'green');
      } else {
        log(`\n⚠️  ${errorCount} errors still present`, 'yellow');
      }
    } else {
      if (previousErrorCount > 0) {
        log(`\n🎉 All errors fixed! (was ${previousErrorCount})`, 'green');
      } else {
        log(`\n✅ No errors found!`, 'green');
      }
      logData.errorCount = 0;
    }

    saveErrorLog(logData);
    return errorCount;

  } catch (error) {
    log(`\n❌ Error running check: ${error.message}`, 'red');
    return -1;
  }
}

function showSummary() {
  const logData = getErrorLog();
  if (logData.errors.length > 0) {
    log('\n📊 Error History:', 'cyan');
    logData.errors.slice(-5).forEach((entry, index) => {
      const date = new Date(entry.timestamp).toLocaleTimeString();
      log(`   ${date}: ${entry.count} errors in ${entry.files.length} files`, 'yellow');
    });
  }
}

// Main execution
log('🚀 Starting error monitor (dev mode only)', 'blue');
log(`   Check interval: ${CHECK_INTERVAL / 1000}s`, 'blue');
log(`   Press Ctrl+C to stop\n`, 'blue');

// Initial check
runCheck();
showSummary();

// Set up interval
const intervalId = setInterval(() => {
  runCheck();
  showSummary();
}, CHECK_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n👋 Stopping error monitor...', 'yellow');
  clearInterval(intervalId);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n👋 Stopping error monitor...', 'yellow');
  clearInterval(intervalId);
  process.exit(0);
});
