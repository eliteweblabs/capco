#!/usr/bin/env node

/**
 * Compare schemas between Capco and Rothco Supabase projects
 * Helps identify missing tables/columns that might affect sidebar navigation
 */

import https from 'https';
import { createClient } from '@supabase/supabase-js';

const CAPCO_PROJECT_REF = 'qudlxlryegnainztkrtk';
const ROTHCO_PROJECT_REF = 'fhqglhcjlkusrykqnoel';

// You'll need to provide these from environment variables or Supabase dashboard
const CAPCO_URL = `https://${CAPCO_PROJECT_REF}.supabase.co`;
const ROTHCO_URL = `https://${ROTHCO_PROJECT_REF}.supabase.co`;

// Get keys from environment or you'll need to provide them
const CAPCO_ANON_KEY = process.env.CAPCO_SUPABASE_ANON_KEY || 'YOUR_CAPCO_ANON_KEY';
const ROTHCO_ANON_KEY = process.env.ROTHCO_SUPABASE_ANON_KEY || 'YOUR_ROTHCO_ANON_KEY';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getTables(supabaseClient, projectName) {
  try {
    const { data, error } = await supabaseClient.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    });

    if (error) {
      // Fallback: use direct SQL query
      const { data: tables, error: tablesError } = await supabaseClient
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (tablesError) {
        log(`⚠️  Error getting tables for ${projectName}: ${tablesError.message}`, 'yellow');
        return [];
      }
      return tables?.map(t => t.table_name) || [];
    }

    return data || [];
  } catch (error) {
    log(`⚠️  Error querying ${projectName}: ${error.message}`, 'yellow');
    return [];
  }
}

async function getTableColumns(supabaseClient, tableName) {
  try {
    // Try to get column info via a view or function
    // Since we can't directly query information_schema, we'll try to describe the table
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      return [];
    }

    // Get column names from the response metadata
    // This is a workaround since we can't directly query information_schema
    return Object.keys(data || {});
  } catch (error) {
    return [];
  }
}

async function compareSchemas() {
  log('🔍 Comparing Supabase Schemas', 'green');
  log('================================', 'green');
  log(`Capco: ${CAPCO_PROJECT_REF}`, 'blue');
  log(`Rothco: ${ROTHCO_PROJECT_REF}`, 'blue');
  log('');

  // Create Supabase clients
  const capcoClient = createClient(CAPCO_URL, CAPCO_ANON_KEY);
  const rothcoClient = createClient(ROTHCO_URL, ROTHCO_ANON_KEY);

  log('📋 Fetching tables from both projects...', 'cyan');

  // Get tables using MCP-like approach - query the tables directly
  // We'll use a simpler approach: try to access key tables that affect navigation
  
  const keyTables = [
    'globalSettings',
    'cmsPages',
    'profiles',
    'projects',
    'files',
    'discussion',
    'invoices',
    'payments',
    'ai_agent_conversations',
    'ai_agent_knowledge',
    'chatMessages',
    'chatMessages',
    'notifications',
    'bannerAlerts'
  ];

  log('\n🔍 Checking key tables...', 'cyan');
  log('─'.repeat(60), 'cyan');

  const results = {
    capco: { exists: [], missing: [] },
    rothco: { exists: [], missing: [] }
  };

  // Check Capco tables
  log('\n📊 Capco Project:', 'blue');
  for (const table of keyTables) {
    try {
      const { data, error } = await capcoClient
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist
        results.capco.missing.push(table);
        log(`  ❌ ${table} - MISSING`, 'red');
      } else {
        results.capco.exists.push(table);
        log(`  ✅ ${table} - EXISTS`, 'green');
      }
    } catch (error) {
      results.capco.missing.push(table);
      log(`  ❌ ${table} - ERROR: ${error.message}`, 'red');
    }
  }

  // Check Rothco tables
  log('\n📊 Rothco Project:', 'blue');
  for (const table of keyTables) {
    try {
      const { data, error } = await rothcoClient
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        results.rothco.missing.push(table);
        log(`  ❌ ${table} - MISSING`, 'red');
      } else {
        results.rothco.exists.push(table);
        log(`  ✅ ${table} - EXISTS`, 'green');
      }
    } catch (error) {
      results.rothco.missing.push(table);
      log(`  ❌ ${table} - ERROR: ${error.message}`, 'red');
    }
  }

  // Compare results
  log('\n📈 Comparison Summary:', 'cyan');
  log('─'.repeat(60), 'cyan');
  
  const capcoOnly = results.capco.exists.filter(t => !results.rothco.exists.includes(t));
  const rothcoOnly = results.rothco.exists.filter(t => !results.capco.exists.includes(t));
  const bothHave = results.capco.exists.filter(t => results.rothco.exists.includes(t));
  
  log(`\n✅ Both have: ${bothHave.length} tables`, 'green');
  log(`📊 Capco only: ${capcoOnly.length} tables`, capcoOnly.length > 0 ? 'yellow' : 'green');
  if (capcoOnly.length > 0) {
    capcoOnly.forEach(t => log(`   - ${t}`, 'yellow'));
  }
  
  log(`📊 Rothco only: ${rothcoOnly.length} tables`, rothcoOnly.length > 0 ? 'yellow' : 'green');
  if (rothcoOnly.length > 0) {
    rothcoOnly.forEach(t => log(`   - ${t}`, 'yellow'));
  }

  log(`\n❌ Missing in Capco: ${results.capco.missing.length} tables`, results.capco.missing.length > 0 ? 'red' : 'green');
  if (results.capco.missing.length > 0) {
    results.capco.missing.forEach(t => log(`   - ${t}`, 'red'));
  }

  log(`❌ Missing in Rothco: ${results.rothco.missing.length} tables`, results.rothco.missing.length > 0 ? 'red' : 'green');
  if (results.rothco.missing.length > 0) {
    results.rothco.missing.forEach(t => log(`   - ${t}`, 'red'));
  }

  // Check globalSettings specifically (affects navigation)
  log('\n🔍 Checking globalSettings table (affects navigation)...', 'cyan');
  
  try {
    const { data: capcoSettings, error: capcoError } = await capcoClient
      .from('globalSettings')
      .select('key, category')
      .order('category, key');
    
    const { data: rothcoSettings, error: rothcoError } = await rothcoClient
      .from('globalSettings')
      .select('key, category')
      .order('category, key');

    if (capcoError) {
      log(`  ❌ Capco globalSettings: ${capcoError.message}`, 'red');
    } else {
      log(`  ✅ Capco globalSettings: ${capcoSettings?.length || 0} entries`, 'green');
    }

    if (rothcoError) {
      log(`  ❌ Rothco globalSettings: ${rothcoError.message}`, 'red');
    } else {
      log(`  ✅ Rothco globalSettings: ${rothcoSettings?.length || 0} entries`, 'green');
    }

    if (capcoSettings && rothcoSettings) {
      const capcoKeys = new Set(capcoSettings.map(s => s.key));
      const rothcoKeys = new Set(rothcoSettings.map(s => s.key));
      
      const missingInCapco = [...rothcoKeys].filter(k => !capcoKeys.has(k));
      const missingInRothco = [...capcoKeys].filter(k => !rothcoKeys.has(k));

      if (missingInCapco.length > 0) {
        log(`\n  ⚠️  Missing keys in Capco globalSettings:`, 'yellow');
        missingInCapco.forEach(k => log(`     - ${k}`, 'yellow'));
      }

      if (missingInRothco.length > 0) {
        log(`\n  ⚠️  Missing keys in Rothco globalSettings:`, 'yellow');
        missingInRothco.forEach(k => log(`     - ${k}`, 'yellow'));
      }
    }
  } catch (error) {
    log(`  ⚠️  Error checking globalSettings: ${error.message}`, 'yellow');
  }

  log('\n✅ Comparison complete!', 'green');
  log('\n💡 Next steps:', 'cyan');
  log('   1. If tables are missing in Capco, run schema migration', 'blue');
  log('   2. If globalSettings differ, sync the settings', 'blue');
  log('   3. Check site-config.json is the same in both deployments', 'blue');
}

// Run comparison
compareSchemas().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
