#!/usr/bin/env node
/**
 * Diagnostic script to check why project templates aren't being applied
 * Run with: node scripts/diagnose-templates.js <projectId>
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const projectId = process.argv[2];

if (!projectId) {
  console.error('Usage: node scripts/diagnose-templates.js <projectId>');
  process.exit(1);
}

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SECRET:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('\n🔍 TEMPLATE DIAGNOSTICS');
  console.log('='.repeat(50));
  console.log(`Project ID: ${projectId}\n`);

  // 1. Check if projectItemTemplates table exists and has enabled templates
  console.log('1️⃣ Checking projectItemTemplates table...');
  const { data: templates, error: templatesError } = await supabase
    .from('projectItemTemplates')
    .select('*')
    .eq('enabled', true)
    .order('orderIndex', { ascending: true });

  if (templatesError) {
    console.error('   ❌ Error fetching templates:', templatesError.message);
    console.error('   💡 The table might not exist. Run:');
    console.error('      sql-queriers/create-project-item-templates-table.sql');
    return;
  }

  console.log(`   ✅ Found ${templates.length} enabled templates`);
  
  if (templates.length === 0) {
    console.error('   ❌ No enabled templates found!');
    console.error('   💡 Go to /project/settings and add some templates');
    return;
  }

  const punchlistTemplates = templates.filter(t => t.type === 'punchlist');
  const discussionTemplates = templates.filter(t => t.type === 'discussion');
  console.log(`      - ${punchlistTemplates.length} punchlist templates`);
  console.log(`      - ${discussionTemplates.length} discussion templates\n`);

  // 2. Check if project exists
  console.log('2️⃣ Checking project...');
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, title, address, authorId')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('   ❌ Project not found:', projectError.message);
    return;
  }

  console.log(`   ✅ Project found: "${project.title}"`);
  console.log(`      Address: ${project.address}`);
  console.log(`      Author ID: ${project.authorId}\n`);

  // 3. Check for existing punchlist items
  console.log('3️⃣ Checking existing punchlist items...');
  const { data: existingPunchlist, error: punchlistError } = await supabase
    .from('punchlist')
    .select('id, message, createdAt')
    .eq('projectId', projectId);

  if (punchlistError) {
    console.error('   ❌ Error checking punchlist:', punchlistError.message);
  } else {
    console.log(`   Found ${existingPunchlist.length} punchlist items`);
    if (existingPunchlist.length > 0) {
      console.log('   ⚠️ Project already has punchlist items!');
      console.log('   💡 The safeguard prevents duplicate templates.');
      existingPunchlist.forEach(item => {
        console.log(`      - "${item.message.substring(0, 50)}..." (${item.createdAt})`);
      });
    }
  }
  console.log('');

  // 4. Check for existing discussion items
  console.log('4️⃣ Checking existing discussion items...');
  const { data: existingDiscussion, error: discussionError } = await supabase
    .from('discussion')
    .select('id, message, createdAt')
    .eq('projectId', projectId);

  if (discussionError) {
    console.error('   ❌ Error checking discussion:', discussionError.message);
  } else {
    console.log(`   Found ${existingDiscussion.length} discussion items`);
    if (existingDiscussion.length > 0) {
      console.log('   ⚠️ Project already has discussion items!');
      console.log('   💡 The safeguard prevents duplicate templates.');
      existingDiscussion.forEach(item => {
        console.log(`      - "${item.message.substring(0, 50)}..." (${item.createdAt})`);
      });
    }
  }
  console.log('');

  // 5. Summary and recommendations
  console.log('📋 SUMMARY');
  console.log('='.repeat(50));
  
  if (existingPunchlist.length === 0 && existingDiscussion.length === 0) {
    console.log('❌ Templates were NOT applied to this project!');
    console.log('\n💡 Possible reasons:');
    console.log('   1. The API endpoint might have failed silently');
    console.log('   2. Check server logs for errors');
    console.log('   3. Verify supabaseAdmin is working correctly');
    console.log('\n🔧 To manually apply templates to this project:');
    console.log(`   Run: node scripts/apply-templates-to-project.js ${projectId}`);
  } else if (existingPunchlist.length !== punchlistTemplates.length || 
             existingDiscussion.length !== discussionTemplates.length) {
    console.log('⚠️ Templates were partially applied!');
    console.log(`   Expected: ${punchlistTemplates.length} punchlist + ${discussionTemplates.length} discussion`);
    console.log(`   Got: ${existingPunchlist.length} punchlist + ${existingDiscussion.length} discussion`);
  } else {
    console.log('✅ Templates were successfully applied!');
    console.log(`   ${existingPunchlist.length} punchlist items`);
    console.log(`   ${existingDiscussion.length} discussion items`);
  }
  
  console.log('');
}

diagnose().catch(console.error);
