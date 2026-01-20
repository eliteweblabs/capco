#!/usr/bin/env node

/**
 * Quick JSON to CSV converter for projectStatuses
 * Paste your JSON data into the jsonData variable below and run:
 * node scripts/convert-json-to-csv.js > statuses.csv
 */

const jsonData = [
  {
    "json_agg": [
      // Paste your JSON array here
    ]
  }
];

// Extract statuses array
const statuses = jsonData[0]?.json_agg || jsonData;

// CSV headers (camelCase)
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

// Output CSV
console.log(headers.join(','));

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
