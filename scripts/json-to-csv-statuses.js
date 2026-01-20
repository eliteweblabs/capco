#!/usr/bin/env node

/**
 * Convert JSON statuses data to CSV format
 * Usage: node scripts/json-to-csv-statuses.js < input.json > output.csv
 * Or: node scripts/json-to-csv-statuses.js input.json output.csv
 */

import fs from 'fs';
import path from 'path';

// CSV headers (camelCase column names)
const headers = [
  'statusCode',
  'status',
  'statusColor',
  'adminStatusName',
  'adminStatusSlug',
  'adminStatusTab',
  'adminStatusAction',
  'adminEmailSubject',
  'adminEmailContent',
  'clientStatusName',
  'clientStatusSlug',
  'clientStatusTab',
  'clientStatusAction',
  'clientEmailSubject',
  'clientEmailContent',
  'emailToRoles',
  'adminVisible',
  'clientVisible',
  'estTime',
  'buttonText',
  'buttonLink',
  'modalAdmin',
  'modalClient',
  'modalAutoRedirectAdmin',
  'modalAutoRedirectClient',
  'createdAt',
  'updatedAt'
];

// Escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convert arrays/objects to JSON string
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  } else {
    value = String(value);
  }
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  
  return value;
}

// Convert to CSV
function convertToCSV(data) {
  const statuses = data[0]?.json_agg || data;
  
  // Output header row
  console.log(headers.join(','));
  
  // Output data rows
  statuses.forEach((status) => {
    const row = headers.map((header) => {
      let value = status[header];
      
      // Handle special cases
      if (header === 'emailToRoles' && Array.isArray(value)) {
        value = JSON.stringify(value);
      } else if (header === 'adminVisible' || header === 'clientVisible') {
        value = value === true ? 'true' : value === false ? 'false' : '';
      }
      
      return escapeCSV(value);
    });
    
    console.log(row.join(','));
  });
}

// Get input from command line args or stdin
if (process.argv[2]) {
  // Read from file
  const inputFile = process.argv[2];
  const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  convertToCSV(jsonData);
} else {
  // Read from stdin
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  process.stdin.on('end', () => {
    const jsonData = JSON.parse(input);
    convertToCSV(jsonData);
  });
}
