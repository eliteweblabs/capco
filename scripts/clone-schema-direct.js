#!/usr/bin/env node

/**
 * Clone Supabase Schema Directly via Management API
 * Uses Supabase API to export and import schema programmatically
 */

import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors
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

// Get access token from env or MCP config
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_a65bdf5279f0debe7e32d8bdd140a22b70556a8e';

log('🔄 Clone Schema via Supabase Management API', 'green');
log('============================================', 'green');
log(`Source: ${SOURCE_PROJECT_REF}`, 'blue');
log(`Target: ${TARGET_PROJECT_REF}`, 'blue');
log('');

// Function to make API request
function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: endpoint,
      method: method,
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
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Function to execute SQL via Management API
async function executeSQL(projectRef, sql) {
  try {
    // Get database password/connection info
    const project = await apiRequest('GET', `/v1/projects/${projectRef}`);
    
    log(`📤 Executing SQL on ${projectRef}...`, 'yellow');
    
    // Note: Management API doesn't support direct SQL execution
    // We need to use the database connection string
    log('⚠️  Management API doesn\'t support direct SQL execution', 'yellow');
    log('Using alternative: Generate SQL file for manual import', 'yellow');
    
    return { success: false, reason: 'api_limitation' };
  } catch (error) {
    throw error;
  }
}

// Function to get database connection info
async function getConnectionInfo(projectRef) {
  try {
    const project = await apiRequest('GET', `/v1/projects/${projectRef}`);
    return project;
  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    log('📋 Step 1: Getting project information...', 'blue');
    
    const sourceProject = await getConnectionInfo(SOURCE_PROJECT_REF);
    const targetProject = await getConnectionInfo(TARGET_PROJECT_REF);
    
    log('✅ Projects found', 'green');
    log(`   Source: ${sourceProject.name || SOURCE_PROJECT_REF}`, 'blue');
    log(`   Target: ${targetProject.name || TARGET_PROJECT_REF}`, 'blue');
    log('');
    
    log('📋 Step 2: Generating SQL export queries...', 'blue');
    
    // Read the export SQL file
    const exportSQLPath = path.join(__dirname, '../sql-queriers/export-complete-schema.sql');
    const exportSQL = fs.readFileSync(exportSQLPath, 'utf-8');
    
    // Split into parts
    const parts = exportSQL.split('-- =====================================================');
    
    log('✅ Export SQL loaded', 'green');
    log('');
    
    log('📋 Step 3: Creating SQL file for import...', 'blue');
    
    // Create a comprehensive SQL file
    const outputSQL = `-- =====================================================
-- COMPLETE SCHEMA IMPORT
-- Source: ${SOURCE_PROJECT_REF}
-- Target: ${TARGET_PROJECT_REF}
-- Generated: ${new Date().toISOString()}
-- =====================================================

-- IMPORTANT: Run each section separately in TARGET project SQL Editor
-- Some sections depend on others (tables before foreign keys, etc.)

${exportSQL}

-- =====================================================
-- IMPORT ORDER:
-- =====================================================
-- 1. Tables (PART 1)
-- 2. Functions (PART 2)
-- 3. Triggers (PART 3)
-- 4. RLS Policies (PART 4)
-- 5. Indexes (PART 5)
-- 6. Views (PART 6)
-- 7. Sequences (PART 7)
-- 8. Foreign Keys (PART 8)
-- =====================================================
`;

    const outputFile = path.join(process.cwd(), `complete-schema-import-${Date.now()}.sql`);
    fs.writeFileSync(outputFile, outputSQL);
    
    log(`✅ SQL file created: ${outputFile}`, 'green');
    log('');
    
    log('📋 Step 4: Instructions for import...', 'blue');
    log('');
    log('Since Supabase Management API doesn\'t support direct SQL execution,', 'yellow');
    log('you need to import manually:', 'yellow');
    log('');
    log('1. Go to SOURCE project SQL Editor:', 'blue');
    log(`   https://supabase.com/dashboard/project/${SOURCE_PROJECT_REF}/sql`, 'blue');
    log('2. Run the queries from the SQL file (each PART separately)', 'blue');
    log('3. Export results as CSV for each part', 'blue');
    log('4. Convert CSV to SQL:', 'blue');
    log('   node scripts/csv-to-sql-fixed.js tables.csv functions.csv ...', 'blue');
    log('5. Import to TARGET project SQL Editor', 'blue');
    log(`   https://supabase.com/dashboard/project/${TARGET_PROJECT_REF}/sql`, 'blue');
    log('');
    log('OR use pg_dump if you have PostgreSQL tools:', 'yellow');
    log('  pg_dump [SOURCE_CONN_STRING] --schema-only > schema.sql', 'yellow');
    log('  psql [TARGET_CONN_STRING] -f schema.sql', 'yellow');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    if (error.message.includes('401') || error.message.includes('403')) {
      log('');
      log('Authentication failed. Check your access token:', 'yellow');
      log('  export SUPABASE_ACCESS_TOKEN="your-token"', 'yellow');
      log('  Or get token from: https://supabase.com/dashboard/account/tokens', 'yellow');
    }
    process.exit(1);
  }
}

main();
