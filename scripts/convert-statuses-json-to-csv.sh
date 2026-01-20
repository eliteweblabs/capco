#!/bin/bash

# Convert JSON statuses to CSV
# Usage: ./scripts/convert-statuses-json-to-csv.sh input.json output.csv

INPUT_FILE="${1:-/dev/stdin}"
OUTPUT_FILE="${2:-statuses.csv}"

# Use Node.js to convert JSON to CSV
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('${INPUT_FILE}', 'utf8'));
const statuses = data[0]?.json_agg || data;

const headers = [
  'statusCode', 'status', 'statusColor', 'adminStatusName', 'adminStatusSlug',
  'adminStatusTab', 'adminStatusAction', 'adminEmailSubject', 'adminEmailContent',
  'clientStatusName', 'clientStatusSlug', 'clientStatusTab', 'clientStatusAction',
  'clientEmailSubject', 'clientEmailContent', 'emailToRoles', 'adminVisible',
  'clientVisible', 'estTime', 'buttonText', 'buttonLink', 'modalAdmin',
  'modalClient', 'modalAutoRedirectAdmin', 'modalAutoRedirectClient',
  'createdAt', 'updatedAt'
];

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') value = JSON.stringify(value);
  value = String(value);
  if (value.includes(',') || value.includes('\"') || value.includes('\n')) {
    return '\"' + value.replace(/\"/g, '\"\"') + '\"';
  }
  return value;
}

const csv = [
  headers.join(','),
  ...statuses.map(s => headers.map(h => {
    let v = s[h];
    if (h === 'emailToRoles' && Array.isArray(v)) v = JSON.stringify(v);
    if (h === 'adminVisible' || h === 'clientVisible') {
      v = v === true ? 'true' : v === false ? 'false' : '';
    }
    return escapeCSV(v);
  }).join(','))
].join('\n');

fs.writeFileSync('${OUTPUT_FILE}', csv);
console.log('✅ CSV file created: ${OUTPUT_FILE}');
console.log('📊 Rows:', statuses.length);
"
