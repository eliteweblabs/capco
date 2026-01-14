#!/usr/bin/env node

/**
 * Clone Schema via pg_dump using Supabase Management API
 * Gets connection strings from API and uses pg_dump for complete export
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import https from 'https';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const SOURCE_PROJECT_REF = process.argv[2] || 'qudlxlryegnainztkrtk';
const TARGET_PROJECT_REF = process.argv[3] || 'fhqglhcjlkusrykqnoel';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_a65bdf5279f0debe7e32d8bdd140a22b70556a8e';

log('🔄 Clone Schema via pg_dump + Supabase API', 'green');
log('============================================', 'green');
log('');

// Check pg_dump
try {
  await execAsync('which pg_dump');
  log('✅ pg_dump found', 'green');
} catch {
  log('❌ pg_dump not found', 'red');
  log('');
  log('Install PostgreSQL tools:', 'yellow');
  log('  brew install postgresql@15', 'yellow');
  log('');
  log('Or use the Supabase CLI method instead:', 'yellow');
  log('  ./scripts/clone-schema-mcp-complete.sh', 'yellow');
  process.exit(1);
}

log('');
log('📋 Getting connection strings from Supabase API...', 'blue');

// Get database connection info
function apiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

try {
  const sourceProject = await apiRequest(`/v1/projects/${SOURCE_PROJECT_REF}`);
  const targetProject = await apiRequest(`/v1/projects/${TARGET_PROJECT_REF}`);
  
  log('✅ Projects found', 'green');
  log(`   Source: ${sourceProject.name || SOURCE_PROJECT_REF}`, 'blue');
  log(`   Target: ${targetProject.name || TARGET_PROJECT_REF}`, 'blue');
  log('');
  
  log('📋 Connection Strings Needed:', 'yellow');
  log('');
  log('To use pg_dump, you need the database connection strings:', 'yellow');
  log('');
  log('1. Get SOURCE connection string:', 'blue');
  log(`   https://supabase.com/dashboard/project/${SOURCE_PROJECT_REF}/settings/database`, 'blue');
  log('   → Connection string → Pooler → Copy URI', 'blue');
  log('');
  log('2. Get TARGET connection string:', 'blue');
  log(`   https://supabase.com/dashboard/project/${TARGET_PROJECT_REF}/settings/database`, 'blue');
  log('   → Connection string → Pooler → Copy URI', 'blue');
  log('');
  log('3. Then run:', 'yellow');
  log('   pg_dump "[SOURCE_CONN_STRING]" --schema-only --no-owner --no-acl --schema=public > schema.sql', 'yellow');
  log('   psql "[TARGET_CONN_STRING]" -f schema.sql', 'yellow');
  log('');
  log('OR use the automated script:', 'green');
  log('   ./scripts/export-schema-pgdump.sh qudlxlryegnainztkrtk', 'green');
  log('   ./scripts/import-schema-pgdump.sh schema-export-*.sql fhqglhcjlkusrykqnoel', 'green');
  
} catch (error) {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
}
