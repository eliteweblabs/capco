#!/usr/bin/env node

/**
 * Update Project Dates Script
 * 
 * Updates existing demo projects with realistic updated_at dates
 * based on their status progression and project timeline
 * 
 * Run with: node scripts/update-project-dates.js
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('   - SUPABASE_URL or PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Status progression mapping - how many days each status typically takes
const STATUS_PROGRESSION = {
  10: { name: 'Quote Requested', minDays: 0, maxDays: 2 },
  20: { name: 'Quote Sent', minDays: 1, maxDays: 7 },
  30: { name: 'Project Awarded', minDays: 1, maxDays: 3 },
  40: { name: 'Site Survey Scheduled', minDays: 2, maxDays: 10 },
  50: { name: 'Design in Progress', minDays: 5, maxDays: 21 },
  60: { name: 'Permits Submitted', minDays: 3, maxDays: 14 },
  70: { name: 'Permits Approved', minDays: 7, maxDays: 30 },
  80: { name: 'Installation Started', minDays: 1, maxDays: 5 },
  90: { name: 'Installation in Progress', minDays: 5, maxDays: 30 },
  100: { name: 'Installation Complete', minDays: 1, maxDays: 3 },
  110: { name: 'Testing Phase', minDays: 2, maxDays: 7 },
  120: { name: 'Final Inspection', minDays: 3, maxDays: 14 },
  130: { name: 'Documentation', minDays: 1, maxDays: 7 },
  140: { name: 'Training Scheduled', minDays: 2, maxDays: 10 },
  150: { name: 'Training Complete', minDays: 1, maxDays: 2 },
  160: { name: 'Warranty Period', minDays: 30, maxDays: 90 },
  170: { name: 'Project Review', minDays: 1, maxDays: 5 },
  180: { name: 'Client Feedback', minDays: 3, maxDays: 14 },
  190: { name: 'Final Invoice', minDays: 1, maxDays: 3 },
  200: { name: 'Payment Received', minDays: 7, maxDays: 30 },
  210: { name: 'Closeout Documentation', minDays: 1, maxDays: 5 },
  220: { name: 'Project Complete', minDays: 0, maxDays: 1 }
};

/**
 * Calculate realistic updated_at date based on project status and created_at
 */
function calculateUpdatedDate(createdAt, status) {
  const created = new Date(createdAt);
  const statusInfo = STATUS_PROGRESSION[status];
  
  if (!statusInfo) {
    // For unknown statuses, just add a random amount of time
    const daysToAdd = faker.number.int({ min: 1, max: 30 });
    const updated = new Date(created);
    updated.setDate(updated.getDate() + daysToAdd);
    return updated.toISOString();
  }
  
  // Calculate how far along this status is in the project lifecycle
  const statusCodes = Object.keys(STATUS_PROGRESSION).map(Number).sort((a, b) => a - b);
  const statusIndex = statusCodes.indexOf(status);
  
  if (statusIndex === -1) {
    // Fallback for unknown status
    const daysToAdd = faker.number.int({ min: 1, max: 30 });
    const updated = new Date(created);
    updated.setDate(updated.getDate() + daysToAdd);
    return updated.toISOString();
  }
  
  // Calculate cumulative time for all statuses up to current one
  let totalMinDays = 0;
  let totalMaxDays = 0;
  
  for (let i = 0; i <= statusIndex; i++) {
    const code = statusCodes[i];
    const info = STATUS_PROGRESSION[code];
    totalMinDays += info.minDays;
    totalMaxDays += info.maxDays;
  }
  
  // Add some randomness to make it realistic
  const daysToAdd = faker.number.int({ 
    min: Math.max(1, totalMinDays), 
    max: totalMaxDays 
  });
  
  const updated = new Date(created);
  updated.setDate(updated.getDate() + daysToAdd);
  
  // Ensure updated_at is not in the future
  const now = new Date();
  if (updated > now) {
    return now.toISOString();
  }
  
  return updated.toISOString();
}

/**
 * Update project dates in database
 */
async function updateProjectDates() {
  console.log('🗓️  Starting project date updates...');
  
  try {
    // Fetch all projects that need date updates
    console.log('📊 Fetching existing projects...');
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, created_at, updated_at, status, title')
      .order('id');
    
    if (fetchError) {
      throw new Error(`Failed to fetch projects: ${fetchError.message}`);
    }

    if (!projects || projects.length === 0) {
      console.log('📭 No projects found to update.');
      return { updated: 0, skipped: 0 };
    }

    console.log(`   Found ${projects.length} projects`);
    
    // Process projects in batches
    const batchSize = 10;
    let updated = 0;
    let skipped = 0;
    
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(projects.length/batchSize)}...`);
      
      for (const project of batch) {
        try {
          // Skip if project already has a realistic updated_at (not null and not equal to created_at)
          if (project.updated_at && project.updated_at !== project.created_at) {
            const createdDate = new Date(project.created_at);
            const updatedDate = new Date(project.updated_at);
            const timeDiff = Math.abs(updatedDate.getTime() - createdDate.getTime());
            
            // If updated_at is more than 1 minute different from created_at, skip
            if (timeDiff > 60000) { // 1 minute in milliseconds
              console.log(`   ⏭️  Skipping project ${project.id}: already has realistic updated_at`);
              skipped++;
              continue;
            }
          }
          
          // Calculate new updated_at date
          const newUpdatedAt = calculateUpdatedDate(project.created_at, project.status);
          
          // Update the project
          const { error: updateError } = await supabase
            .from('projects')
            .update({ updated_at: newUpdatedAt })
            .eq('id', project.id);
          
          if (updateError) {
            console.error(`   ❌ Failed to update project ${project.id}:`, updateError.message);
            continue;
          }
          
          const statusInfo = STATUS_PROGRESSION[project.status];
          const statusName = statusInfo ? statusInfo.name : `Status ${project.status}`;
          
          console.log(`   ✅ Updated project ${project.id}: ${statusName}`);
          console.log(`      📅 ${new Date(project.created_at).toLocaleDateString()} → ${new Date(newUpdatedAt).toLocaleDateString()}`);
          updated++;
          
        } catch (projectError) {
          console.error(`   ❌ Error processing project ${project.id}:`, projectError.message);
        }
      }
      
      // Small delay between batches to be nice to the database
      if (i + batchSize < projects.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Summary
    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Updated: ${updated} projects`);
    console.log(`   ⏭️  Skipped: ${skipped} projects`);
    console.log(`   📈 Success Rate: ${((updated / projects.length) * 100).toFixed(1)}%`);
    
    if (updated > 0) {
      // Fetch some sample updated projects to show the results
      const { data: sampleProjects } = await supabase
        .from('projects')
        .select('id, title, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (sampleProjects && sampleProjects.length > 0) {
        console.log('\n📋 Sample Updated Projects:');
        sampleProjects.forEach(project => {
          const statusInfo = STATUS_PROGRESSION[project.status];
          const statusName = statusInfo ? statusInfo.name : `Status ${project.status}`;
          const daysDiff = Math.ceil((new Date(project.updated_at) - new Date(project.created_at)) / (1000 * 60 * 60 * 24));
          
          console.log(`   📝 ${project.id}: ${project.title.substring(0, 40)}...`);
          console.log(`      📊 ${statusName} (${daysDiff} days progression)`);
        });
      }
    }
    
    return { updated, skipped };
    
  } catch (error) {
    console.error('💥 Update failed:', error.message);
    return { updated: 0, skipped: 0 };
  }
}

// Main execution
async function main() {
  console.log('🚀 CAPCo Project Date Update Script');
  console.log('====================================\n');
  
  const result = await updateProjectDates();
  
  if (result.updated > 0) {
    console.log('\n🎉 Date updates completed successfully!');
    console.log('\n💡 Benefits:');
    console.log('   - Projects now have realistic progression timelines');
    console.log('   - Updated_at dates reflect status-based progression');
    console.log('   - Timeline data supports better project analytics');
    console.log('   - More believable demo data for client presentations');
  } else {
    console.log('\n🔍 No updates were needed.');
    console.log('   - Projects may already have realistic dates');
    console.log('   - Run the import script first if no projects exist');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateProjectDates, calculateUpdatedDate };
