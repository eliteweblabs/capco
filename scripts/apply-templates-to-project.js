#!/usr/bin/env node
/**
 * Manually apply templates to an existing project
 * Run with: node scripts/apply-templates-to-project.js <projectId>
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const projectId = process.argv[2];

if (!projectId) {
  console.error('Usage: node scripts/apply-templates-to-project.js <projectId>');
  process.exit(1);
}

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function replacePlaceholders(message, project) {
  let processed = message;
  
  // Replace common placeholders
  const replacements = {
    '{{PROJECT_ID}}': project.id || '',
    '{{PROJECT_TITLE}}': project.title || '',
    '{{PROJECT_ADDRESS}}': project.address || '',
    '{{RAILWAY_PUBLIC_DOMAIN}}': process.env.RAILWAY_PUBLIC_DOMAIN || 'https://rothcobuilt.com',
    '{{CLIENT_NAME}}': project.authorProfile?.firstName 
      ? `${project.authorProfile.firstName} ${project.authorProfile.lastName || ''}`.trim()
      : 'Client',
    '{{CLIENT_EMAIL}}': project.authorProfile?.email || '',
    '{{COMPANY_NAME}}': project.authorProfile?.companyName || '',
  };
  
  for (const [placeholder, value] of Object.entries(replacements)) {
    processed = processed.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return processed;
}

async function applyTemplates() {
  console.log('\n🔧 APPLYING TEMPLATES TO PROJECT');
  console.log('='.repeat(50));
  console.log(`Project ID: ${projectId}\n`);

  // 1. Fetch project
  console.log('1️⃣ Fetching project...');
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    console.error('   ❌ Project not found:', projectError?.message);
    process.exit(1);
  }

  console.log(`   ✅ Found: "${project.title}"`);
  console.log(`      Address: ${project.address}`);
  
  // Fetch author profile separately
  if (project.authorId) {
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('id, firstName, lastName, companyName, email, role')
      .eq('id', project.authorId)
      .single();
    
    if (authorProfile) {
      project.authorProfile = authorProfile;
    }
  }
  console.log('');

  // 2. Check if templates already exist
  console.log('2️⃣ Checking existing items...');
  const { data: existingPunchlist } = await supabase
    .from('punchlist')
    .select('id')
    .eq('projectId', projectId);

  const { data: existingDiscussion } = await supabase
    .from('discussion')
    .select('id')
    .eq('projectId', projectId);

  if ((existingPunchlist?.length || 0) > 0 || (existingDiscussion?.length || 0) > 0) {
    console.log('   ⚠️ Project already has items!');
    console.log(`      Punchlist: ${existingPunchlist?.length || 0}`);
    console.log(`      Discussion: ${existingDiscussion?.length || 0}`);
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('   Continue and add more? (y/n): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'y') {
      console.log('   Cancelled.');
      process.exit(0);
    }
  }
  console.log('');

  // 3. Fetch enabled templates
  console.log('3️⃣ Fetching templates...');
  const { data: templates, error: templatesError } = await supabase
    .from('projectItemTemplates')
    .select('*')
    .eq('enabled', true)
    .order('orderIndex', { ascending: true });

  if (templatesError || !templates || templates.length === 0) {
    console.error('   ❌ No enabled templates found');
    process.exit(1);
  }

  const punchlistTemplates = templates.filter(t => t.type === 'punchlist');
  const discussionTemplates = templates.filter(t => t.type === 'discussion');

  console.log(`   ✅ Found ${templates.length} templates`);
  console.log(`      - ${punchlistTemplates.length} punchlist`);
  console.log(`      - ${discussionTemplates.length} discussion`);
  console.log('');

  // 4. Apply punchlist templates
  console.log('4️⃣ Applying punchlist templates...');
  let punchlistCount = 0;
  
  for (const template of punchlistTemplates) {
    try {
      const processedMessage = await replacePlaceholders(template.message, project);
      
      const { error: insertError } = await supabase.from('punchlist').insert({
        projectId: parseInt(projectId),
        authorId: 'ca78589d-a9b6-4b98-a137-a1facaeb7a2c', // Admin user
        message: processedMessage,
        internal: template.internal || false,
        markCompleted: template.markCompleted || false,
        companyName: template.companyName || 'CAPCo Fire',
      });

      if (insertError) {
        console.error(`   ❌ Failed: "${template.title}" - ${insertError.message}`);
      } else {
        console.log(`   ✅ Added: "${template.title}"`);
        punchlistCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error: "${template.title}" - ${error.message}`);
    }
  }
  console.log('');

  // 5. Apply discussion templates
  console.log('5️⃣ Applying discussion templates...');
  let discussionCount = 0;
  
  for (const template of discussionTemplates) {
    try {
      const processedMessage = await replacePlaceholders(template.message, project);
      
      const { error: insertError } = await supabase.from('discussion').insert({
        projectId: parseInt(projectId),
        authorId: 'ca78589d-a9b6-4b98-a137-a1facaeb7a2c', // Admin user
        message: processedMessage,
        internal: template.internal || false,
        markCompleted: template.markCompleted || false,
        companyName: template.companyName || 'CAPCo Fire',
      });

      if (insertError) {
        console.error(`   ❌ Failed: "${template.title}" - ${insertError.message}`);
      } else {
        console.log(`   ✅ Added: "${template.title}"`);
        discussionCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error: "${template.title}" - ${error.message}`);
    }
  }
  console.log('');

  // 6. Summary
  console.log('📋 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully applied ${punchlistCount + discussionCount} templates`);
  console.log(`   - ${punchlistCount} punchlist items`);
  console.log(`   - ${discussionCount} discussion items`);
  console.log('');
}

applyTemplates().catch(console.error);
