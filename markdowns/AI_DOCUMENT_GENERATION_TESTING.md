# Testing AI Document Generation API

## Quick Test Guide

### Step 1: Get Required IDs

You need two IDs to test the API:

#### Get a Project ID
1. Go to Supabase Dashboard → **Table Editor** → `projects`
2. Pick any project and note its `id` (should be a number like `1`, `2`, `123`, etc.)

#### Get a Template ID
1. Go to Supabase Dashboard → **Table Editor** → `document_templates`
2. Pick any template and note its `id` (should be a UUID like `a1b2c3d4-...`)
3. Or run this SQL query:
   ```sql
   SELECT id, name, category FROM document_templates WHERE "isActive" = true;
   ```

### Step 2: Test via Browser Console (Easiest)

1. **Log into your Railway app** (or localhost if testing locally)
2. **Open browser DevTools** (F12 or Cmd+Option+I)
3. **Go to Console tab**
4. **Run this code** (replace `PROJECT_ID` and `TEMPLATE_ID`):

```javascript
// Replace these with your actual IDs
const PROJECT_ID = 1; // Your project ID number
const TEMPLATE_ID = 'your-template-uuid-here'; // Your template UUID

fetch('/api/documents/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important: includes cookies for auth
  body: JSON.stringify({
    projectId: PROJECT_ID,
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
    ],
  }),
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Success!', data);
    console.log('Document Content:', data.document?.content?.substring(0, 500));
  })
  .catch(err => console.error('❌ Error:', err));
```

### Step 3: Test via cURL (Command Line)

```bash
# Replace these values:
# - YOUR_RAILWAY_URL: Your Railway app URL (e.g., https://your-app.railway.app)
# - PROJECT_ID: Your project ID number
# - TEMPLATE_ID: Your template UUID
# - SESSION_COOKIE: Get from browser DevTools → Application → Cookies

curl -X POST https://YOUR_RAILWAY_URL/api/documents/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION_COOKIE" \
  -d '{
    "projectId": PROJECT_ID,
    "templateId": "TEMPLATE_ID",
    "projectData": {
      "facility_name": "Test Facility",
      "address": "123 Test St",
      "inspection_date": "2025-01-15"
    }
  }'
```

### Step 4: Test via Node.js Script

```bash
# Set environment variables
export PROJECT_ID=1
export TEMPLATE_ID=your-template-uuid-here
export API_URL=https://your-app.railway.app

# Run the test script
node scripts/test-ai-document-generation.js
```

**Note**: The Node.js script requires authentication cookies. For easier testing, use the browser console method above.

## Expected Response

On success, you should get:

```json
{
  "success": true,
  "document": {
    "id": "uuid-here",
    "content": "Generated document content...",
    "metadata": {
      "tokensUsed": 1234,
      "model": "claude-3-opus-20240229",
      "generatedAt": "2025-01-15T12:00:00.000Z"
    }
  }
}
```

## Troubleshooting

### Error: "Authentication required"
- Make sure you're logged into the app
- If using cURL, include valid session cookies
- Check that `ANTHROPIC_API_KEY` is set in Railway environment variables

### Error: "Project not found"
- Verify the project ID exists in your `projects` table
- Make sure you're using a numeric project ID (not a UUID)

### Error: "Insufficient permissions"
- Verify you're the project author OR an Admin user
- Check your user role in the `profiles` table

### Error: "AI API key not configured"
- Go to Railway Dashboard → Your Service → Variables
- Add `ANTHROPIC_API_KEY` with your Anthropic API key
- Redeploy if necessary

### Error: "Failed to save document"
- Check Supabase connection
- Verify RLS policies are correctly set up
- Check Supabase logs for detailed error messages

## Verify Database Records

After a successful generation, check:

```sql
-- Check generated document
SELECT id, "projectId", "templateId", "createdAt" 
FROM ai_generated_documents 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Check AI generation history
SELECT id, model, "tokensUsed", "createdAt" 
FROM ai_generations 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

## Next Steps

Once testing works:
1. Build frontend components to use this API
2. Create a UI for selecting templates and projects
3. Display generated documents
4. Add document editing capabilities
5. Implement PDF export functionality

