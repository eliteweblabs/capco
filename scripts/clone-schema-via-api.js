#!/usr/bin/env node

/**
 * Clone Supabase Database Schema via Management API
 * Uses Supabase Management API (similar to MCP approach)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_PROJECT_REF = process.argv[2] || 'qudlxlryegnainztkrtk';
const TARGET_PROJECT_REF = process.argv[3] || 'fhqglhcjlkusrykqnoel';

// Colors for terminal
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

log('🔄 Clone Database Schema via Supabase API', 'green');
log('==========================================', 'green');
log(`Source: ${SOURCE_PROJECT_REF}`, 'blue');
log(`Target: ${TARGET_PROJECT_REF}`, 'blue');
log('');

// Check for access token
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;

if (!accessToken) {
  log('❌ SUPABASE_ACCESS_TOKEN not found', 'red');
  log('');
  log('Please set your Supabase access token:', 'yellow');
  log('  export SUPABASE_ACCESS_TOKEN="your-token-here"', 'yellow');
  log('');
  log('Get your token from:', 'yellow');
  log('  https://supabase.com/dashboard/account/tokens', 'yellow');
  process.exit(1);
}

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
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          resolve(body); // Return raw body if not JSON
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

async function main() {
  try {
    log('📤 Step 1: Getting database connection info...', 'blue');
    
    // Get source project info
    log(`Fetching source project: ${SOURCE_PROJECT_REF}`, 'yellow');
    const sourceProject = await apiRequest('GET', `/v1/projects/${SOURCE_PROJECT_REF}`);
    
    // Get target project info  
    log(`Fetching target project: ${TARGET_PROJECT_REF}`, 'yellow');
    const targetProject = await apiRequest('GET', `/v1/projects/${TARGET_PROJECT_REF}`);
    
    log('✅ Projects found', 'green');
    log('');
    
    log('⚠️  Note: Supabase Management API does not support direct schema export', 'yellow');
    log('Using alternative method: SQL-based export', 'yellow');
    log('');
    
    // Generate SQL export script
    const exportSQL = `
-- =====================================================
-- SCHEMA EXPORT FOR PROJECT: ${SOURCE_PROJECT_REF}
-- Generated: ${new Date().toISOString()}
-- =====================================================

-- Run this in SOURCE project SQL Editor, then import results to TARGET project

-- Export all table structures
SELECT 
    'CREATE TABLE IF NOT EXISTS ' || tablename || ' (' ||
    string_agg(
        quote_ident(column_name) || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '255') || ')'
            WHEN data_type = 'character' THEN 'CHAR(' || COALESCE(character_maximum_length::text, '1') || ')'
            WHEN data_type = 'numeric' THEN 'NUMERIC(' || COALESCE(numeric_precision::text, '') || 
                CASE WHEN numeric_scale > 0 THEN ',' || numeric_scale::text ELSE '' END || ')'
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
        ORDER BY ordinal_position
    ) || ');' as create_statement
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
GROUP BY tablename
ORDER BY tablename;

-- Export all functions
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Export all triggers
SELECT pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY tgname;

-- Export all RLS policies
SELECT 
    'CREATE POLICY ' || quote_ident(polname) || ' ON ' || 
    quote_ident(schemaname) || '.' || quote_ident(tablename) || ' ' ||
    polcmd || ' ' ||
    CASE WHEN polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END || ' ' ||
    'FOR ' || polroles::text || ' ' ||
    CASE 
        WHEN polqual IS NOT NULL THEN 'USING (' || polqual::text || ') '
        ELSE ''
    END ||
    CASE 
        WHEN polwithcheck IS NOT NULL THEN 'WITH CHECK (' || polwithcheck::text || ') '
        ELSE ''
    END || ';' as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Export all indexes
SELECT indexdef || ';' as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
`;

    // Save export SQL
    const outputFile = path.join(process.cwd(), `schema-export-${SOURCE_PROJECT_REF}-${Date.now()}.sql`);
    fs.writeFileSync(outputFile, exportSQL);
    
    log(`✅ Export SQL script created: ${outputFile}`, 'green');
    log('');
    log('📋 Next Steps:', 'blue');
    log('');
    log('1. Go to SOURCE project SQL Editor:', 'yellow');
    log(`   https://supabase.com/dashboard/project/${SOURCE_PROJECT_REF}/sql`, 'yellow');
    log('');
    log('2. Copy and run the queries from the generated SQL file', 'yellow');
    log('');
    log('3. Copy all CREATE statements from the results', 'yellow');
    log('');
    log('4. Go to TARGET project SQL Editor:', 'yellow');
    log(`   https://supabase.com/dashboard/project/${TARGET_PROJECT_REF}/sql`, 'yellow');
    log('');
    log('5. Paste and run the CREATE statements', 'yellow');
    log('');
    log('Alternatively, use pg_dump if you have PostgreSQL tools:', 'blue');
    log(`   pg_dump [SOURCE_CONN_STRING] --schema-only --no-owner --no-acl --schema=public > schema.sql`, 'yellow');
    log(`   psql [TARGET_CONN_STRING] -f schema.sql`, 'yellow');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    if (error.message.includes('401') || error.message.includes('403')) {
      log('');
      log('Authentication failed. Check your SUPABASE_ACCESS_TOKEN:', 'yellow');
      log('  https://supabase.com/dashboard/account/tokens', 'yellow');
    }
    process.exit(1);
  }
}

main();
