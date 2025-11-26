/**
 * Test script for AI Document Generation API
 * 
 * Usage:
 *   node scripts/test-ai-document-generation.js
 * 
 * Make sure you have:
 *   1. A valid project ID from your database
 *   2. A valid template ID from document_templates table
 *   3. Your Railway app URL (or localhost:4321 for local)
 */

const API_URL = process.env.API_URL || 'http://localhost:4321';
const PROJECT_ID = process.env.PROJECT_ID || null; // Set this to a valid project ID
const TEMPLATE_ID = process.env.TEMPLATE_ID || null; // Set this to a valid template ID

async function testDocumentGeneration() {
  console.log('🧪 Testing AI Document Generation API\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Project ID: ${PROJECT_ID || 'NOT SET'}`);
  console.log(`Template ID: ${TEMPLATE_ID || 'NOT SET'}\n`);

  if (!PROJECT_ID || !TEMPLATE_ID) {
    console.error('❌ Error: PROJECT_ID and TEMPLATE_ID must be set');
    console.log('\nTo get these values:');
    console.log('1. Go to Supabase Dashboard → Table Editor');
    console.log('2. Get a project ID from the "projects" table');
    console.log('3. Get a template ID from the "document_templates" table');
    console.log('\nThen run:');
    console.log(`  PROJECT_ID=123 TEMPLATE_ID=uuid-here node scripts/test-ai-document-generation.js`);
    console.log('\nOr set them in your environment variables.');
    process.exit(1);
  }

  const requestBody = {
    projectId: parseInt(PROJECT_ID),
    templateId: TEMPLATE_ID,
    projectData: {
      facility_name: 'Test Fire Protection Facility',
      address: '123 Test Street, Test City, ST 12345',
      inspection_date: new Date().toISOString().split('T')[0],
      inspector_name: 'Test Inspector',
    },
    requirements: [
      'Include NFPA 72 compliance check',
      'Document all fire safety equipment',
      'Provide recommendations for improvements',
    ],
  };

  console.log('📤 Sending request...');
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  console.log('\n');

  try {
    const response = await fetch(`${API_URL}/api/documents/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to include authentication cookies
        // For testing, you may need to get session cookies from your browser
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log(`📥 Response status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      console.error('❌ Request failed');
      console.log('Response:', responseText);
      return;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse JSON response');
      console.log('Raw response:', responseText);
      return;
    }

    console.log('✅ Success! Document generated\n');
    console.log('Document ID:', data.document?.id);
    console.log('Model:', data.document?.metadata?.model);
    console.log('Tokens Used:', data.document?.metadata?.tokensUsed);
    console.log('Generated At:', data.document?.metadata?.generatedAt);
    console.log('\n📄 Document Content Preview (first 500 chars):');
    console.log('-'.repeat(60));
    console.log(data.document?.content?.substring(0, 500) + '...');
    console.log('-'.repeat(60));

  } catch (error) {
    console.error('❌ Error making request:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

// Run the test
testDocumentGeneration();

