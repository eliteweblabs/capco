#!/usr/bin/env node

/**
 * Development Database Reset Script
 *
 * This script resets the Supascale development database by:
 * 1. Deleting the SQLite database files (supascale.db, supascale.db-shm, supascale.db-wal)
 * 2. Optionally keeping or removing the admin user
 *
 * Usage:
 *   node scripts/reset-dev-db.js           # Reset DB, will need to run setup-admin.js after
 *   node scripts/reset-dev-db.js --keep-admin <username> <password>  # Reset and recreate admin
 *
 * After reset, restart the dev server and the database will be recreated.
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbFiles = [
  'supascale.db',
  'supascale.db-shm',
  'supascale.db-wal',
];

console.log('Supascale Development Database Reset');
console.log('=====================================\n');

// Check if data directory exists
if (!fs.existsSync(dataDir)) {
  console.log('No data directory found. Nothing to reset.');
  process.exit(0);
}

// Delete database files
let deletedCount = 0;
for (const file of dbFiles) {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete ${file}:`, error.message);
    }
  }
}

if (deletedCount === 0) {
  console.log('No database files found to delete.');
} else {
  console.log(`\nDeleted ${deletedCount} file(s).`);
}

console.log('\nDatabase reset complete!');
console.log('\nNext steps:');
console.log('  1. Restart the dev server: npm run dev');
console.log('  2. Create admin user: node scripts/setup-admin.js <username> <password>');
console.log('  3. Access the app at http://localhost:3000');
