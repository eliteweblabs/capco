#!/usr/bin/env node
/**
 * Setup Admin User Script
 *
 * This script securely creates the initial admin user by:
 * 1. Taking username and password as arguments
 * 2. Hashing the password with bcrypt (12 rounds)
 * 3. Inserting directly into the SQLite database
 *
 * Usage: node setup-admin.js <username> <password>
 *
 * The password is passed as an argument (from install.sh) and is
 * immediately hashed - it's never stored in plaintext anywhere.
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Get arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node setup-admin.js <username> <password>');
  process.exit(1);
}

const username = args[0];
const password = args[1];

// Validate password strength
if (password.length < 12) {
  console.error('ERROR: Password must be at least 12 characters long');
  process.exit(1);
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;
if (!passwordRegex.test(password)) {
  console.error('ERROR: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  process.exit(1);
}

// Get database path from environment or use default
const dataDir = process.env.SUPASCALE_DATA_DIR || path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'supascale.db');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
}

// Initialize database
const db = new Database(dbPath);

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL,
    last_login TEXT,
    preferences TEXT DEFAULT '{}'
  )
`);

// Check if any users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

if (userCount.count > 0) {
  console.error('ERROR: Admin user already exists. Use the password reset procedure to change credentials.');
  process.exit(1);
}

// Generate a unique ID
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

// Hash password with bcrypt (12 rounds)
const passwordHash = bcrypt.hashSync(password, 12);

// Insert admin user
const id = generateId();
const now = new Date().toISOString();

try {
  db.prepare(`
    INSERT INTO users (id, username, password_hash, role, created_at, last_login, preferences)
    VALUES (?, ?, ?, 'admin', ?, ?, '{}')
  `).run(id, username, passwordHash, now, now);

  console.log('SUCCESS: Admin user created securely');
  console.log('Username:', username);
  console.log('Password has been securely hashed and stored');

  // Set secure permissions on database file
  fs.chmodSync(dbPath, 0o600);

  process.exit(0);
} catch (error) {
  console.error('ERROR: Failed to create admin user:', error.message);
  process.exit(1);
}
