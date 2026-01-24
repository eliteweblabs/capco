#!/usr/bin/env node
/**
 * Password Reset Script
 *
 * This script allows administrators to reset a user's password when they've
 * forgotten their credentials. It should be run on the server where Supascale
 * is installed.
 *
 * Usage: node reset-password.js <username> <new_password>
 *
 * Requirements:
 * - Password must be at least 12 characters long
 * - Password must contain at least one uppercase letter
 * - Password must contain at least one lowercase letter
 * - Password must contain at least one number
 * - Password must contain at least one special character
 *
 * Example:
 *   node scripts/reset-password.js admin "MyNewP@ssw0rd!123"
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Get arguments
const args = process.argv.slice(2);

async function promptForInput(question, hidden = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hidden) {
      process.stdout.write(question);
      let password = '';

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', (char) => {
        char = char.toString();
        if (char === '\n' || char === '\r' || char === '\u0004') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          console.log('');
          rl.close();
          resolve(password);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007F') {
          // Backspace
          password = password.slice(0, -1);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(question + '*'.repeat(password.length));
        } else {
          password += char;
          process.stdout.write('*');
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

function validatePassword(password) {
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters long' };
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;
  if (!passwordRegex.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    };
  }

  return { valid: true };
}

async function main() {
  let username = args[0];
  let password = args[1];

  // Interactive mode if no arguments provided
  if (!username) {
    console.log('');
    console.log('=== Supascale Password Reset ===');
    console.log('');
    username = await promptForInput('Enter username to reset: ');
  }

  if (!password) {
    password = await promptForInput('Enter new password: ', true);
    const confirmPassword = await promptForInput('Confirm new password: ', true);

    if (password !== confirmPassword) {
      console.error('\nERROR: Passwords do not match');
      process.exit(1);
    }
  }

  // Validate password strength
  const validation = validatePassword(password);
  if (!validation.valid) {
    console.error('\nERROR:', validation.error);
    process.exit(1);
  }

  // Get database path from environment or use default
  const dataDir = process.env.SUPASCALE_DATA_DIR || path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'supascale.db');

  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.error('\nERROR: Database not found at', dbPath);
    console.error('Make sure you are running this script from the Supascale installation directory.');
    process.exit(1);
  }

  // Initialize database
  const db = new Database(dbPath);

  // Check if user exists
  const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);

  if (!user) {
    console.error('\nERROR: User not found:', username);
    const users = db.prepare('SELECT username FROM users').all();
    if (users.length > 0) {
      console.log('\nAvailable users:');
      users.forEach((u) => console.log('  -', u.username));
    }
    process.exit(1);
  }

  // Hash the new password with bcrypt (12 rounds)
  const passwordHash = bcrypt.hashSync(password, 12);

  // Update the password
  try {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);

    console.log('');
    console.log('SUCCESS: Password has been reset for user:', username);
    console.log('');
    console.log('The user can now log in with the new password.');

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('\nERROR: Failed to reset password:', error.message);
    db.close();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('ERROR:', error.message);
  process.exit(1);
});
