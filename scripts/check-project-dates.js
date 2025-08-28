#!/usr/bin/env node

/**
 * Check Project Dates Script
 * 
 * Checks the actual created_at and updated_at values in the database
 * to help debug timestamp display issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProjectDates() {
  console.log('🔍 Checking Project Dates in Database');
  console.log('=====================================\n');
  
  try {
    // Fetch a sample of projects with their dates
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, status, created_at, updated_at')
      .order('id')
      .limit(10);
    
    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    if (!projects || projects.length === 0) {
      console.log('📭 No projects found in database.');
      return;
    }

    console.log(`📊 Found ${projects.length} projects (showing first 10):\n`);
    
    projects.forEach(project => {
      const created = new Date(project.created_at);
      const updated = new Date(project.updated_at);
      const timeDiff = Math.abs(updated.getTime() - created.getTime());
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      
      console.log(`📝 Project ${project.id}: ${project.title.substring(0, 50)}...`);
      console.log(`   📅 Created:  ${project.created_at}`);
      console.log(`   📅 Updated:  ${project.updated_at}`);
      console.log(`   ⏱️  Time Diff: ${daysDiff} days, ${hoursDiff % 24} hours, ${minutesDiff % 60} minutes`);
      console.log(`   📊 Status: ${project.status}`);
      console.log('');
    });

    // Check if created_at and updated_at are different
    const sameTimestamps = projects.filter(p => p.created_at === p.updated_at).length;
    const differentTimestamps = projects.length - sameTimestamps;
    
    console.log('📈 Summary:');
    console.log(`   🟰 Same timestamps: ${sameTimestamps} projects`);
    console.log(`   📈 Different timestamps: ${differentTimestamps} projects`);
    
    if (sameTimestamps > 0) {
      console.log('\n⚠️  Some projects have identical created_at and updated_at timestamps.');
      console.log('   This could mean:');
      console.log('   - The projects were just created and never updated');
      console.log('   - The database default is setting both to the same value');
      console.log('   - The update script conditions need adjustment');
    }

    // Check the database schema for these columns
    console.log('\n🔍 Checking database schema...');
    const { data: schema, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'projects')
      .in('column_name', ['created_at', 'updated_at']);
    
    if (schema && schema.length > 0) {
      console.log('📋 Column Information:');
      schema.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
      });
    }

  } catch (error) {
    console.error('💥 Error checking project dates:', error.message);
  }
}

// Run the check
checkProjectDates();
