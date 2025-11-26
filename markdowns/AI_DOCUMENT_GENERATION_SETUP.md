# AI Document Generation System - Setup Instructions

Complete step-by-step guide to set up the AI-powered document generation feature in your Astro application.

## Prerequisites

- **Node.js** 18+ installed
- **Supabase account** (already configured)
- **Anthropic API key** ([Get one](https://console.anthropic.com))

## Step 1: Install Dependencies

The `@anthropic-ai/sdk` package has already been added to `package.json`. Install it:

```bash
npm install
```

## Step 2: Set Up Anthropic API

### 2.1 Get API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create Key**
5. Name it (e.g., "fire-protection-agent")
6. Copy the key (starts with `sk-ant-...`) - You won't see it again!

### 2.2 Set Usage Limits (Optional)
- Set spending limits in Anthropic dashboard
- Monitor usage to avoid unexpected costs

## Step 3: Configure Environment Variables

Add the Anthropic API key to your environment variables:

### For Local Development
Add to your `.env` or `.env.local` file:

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### For Production (Railway/Other)
Add the environment variable in your deployment platform:
- Variable name: `ANTHROPIC_API_KEY`
- Value: Your API key from Anthropic

**Note**: The code checks both `import.meta.env.ANTHROPIC_API_KEY` and `process.env.ANTHROPIC_API_KEY` to work in both Astro and Node.js contexts.

## Step 4: Run Database Migration

### 4.1 Run the Migration
1. Go to Supabase Dashboard → **SQL Editor**
2. Open `sql-queriers/create-ai-document-generation-schema.sql`
3. Copy and paste the entire SQL into the editor
4. Click "Run"

### 4.2 Verify Tables Created
In Supabase Dashboard → **Table Editor**, you should see:
- `document_templates` - Document templates for AI generation
- `ai_generated_documents` - Generated documents storage
- `ai_generations` - Generation history and cost tracking

### 4.3 Verify Sample Templates
Check that sample templates were inserted:
- Fire Safety Inspection Report
- NFPA Compliance Certificate
- Fire Protection System Design Report

## Step 5: Test the API Endpoint

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test API Endpoint
Use curl or a tool like Postman:

```bash
curl -X POST http://localhost:4321/api/documents/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "projectId": 1,
    "templateId": "YOUR_TEMPLATE_UUID",
    "projectData": {
      "facility_name": "Test Facility",
      "address": "123 Test St",
      "inspection_date": "2025-01-15"
    }
  }'
```

**Note**: You'll need to:
1. Be authenticated (have valid session cookies)
2. Use an existing project ID from your `projects` table
3. Use a template ID from the `document_templates` table

### 5.3 Get Template IDs
Query the templates table in Supabase:

```sql
SELECT id, name, category FROM document_templates WHERE is_active = true;
```

## Step 6: Integration with Existing System

### 6.1 Project Structure
The AI agent is integrated into the existing structure:
- **AI Agent**: `src/lib/ai/agent.ts`
- **API Route**: `src/pages/api/documents/generate.ts`
- **Database Migration**: `sql-queriers/create-ai-document-generation-schema.sql`

### 6.2 Authentication
The API uses the existing authentication system:
- Uses `checkAuth` from `src/lib/auth.ts`
- Respects Admin/Client role permissions
- Clients can only generate documents for their own projects
- Admins can generate documents for any project

### 6.3 Database Integration
- Uses existing `projects` table (serial ID, `author_id`)
- New tables reference existing projects
- RLS policies follow existing patterns

## Step 7: Customize for Your Needs

### 7.1 Update Document Templates
Add or modify templates in Supabase:

```sql
INSERT INTO document_templates (name, category, description, prompt_template, fields)
VALUES (
  'Your Template Name',
  'inspection', -- or 'compliance', 'report', 'certification'
  'Template description',
  'Your prompt template with {{placeholders}}',
  '["field1", "field2"]'::jsonb
);
```

### 7.2 Customize AI Prompts
Edit `src/lib/ai/agent.ts` to refine prompts for your specific document types.

### 7.3 Build Frontend Components
Create Astro components to:
- List available templates
- Form for document generation
- Display generated documents
- Manage templates (Admin only)

## Step 8: Troubleshooting

### Issue: "AI API key not configured"
**Solution**: 
- Check that `ANTHROPIC_API_KEY` is set in environment variables
- Restart the development server after adding the variable
- For production, ensure the variable is set in your deployment platform

### Issue: "Project not found"
**Solution**: 
- Verify the project ID exists in the `projects` table
- Ensure you're using a numeric project ID (not UUID)

### Issue: "Insufficient permissions"
**Solution**: 
- Verify you're authenticated
- Check that you're the project author or an Admin
- Verify RLS policies are correctly configured

### Issue: "Database connection not available"
**Solution**: 
- Check that `SUPABASE_SECRET` is configured
- Verify `supabaseAdmin` client is initialized
- Check Supabase connection in `src/lib/supabase-admin.ts`

### Issue: Database migration fails
**Solution**: 
- Check SQL syntax in migration file
- Ensure you have proper permissions in Supabase
- Verify tables don't already exist (use `CREATE TABLE IF NOT EXISTS`)
- Check for foreign key conflicts

## Next Steps

1. ✅ Setup complete? Read `AI_DOCUMENT_GENERATION_ARCHITECTURE.md` for system design
2. ✅ Ready to customize? Start building your frontend components
3. ✅ Need help? Review the code files and comments

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Anthropic API Docs**: https://docs.anthropic.com
- **Astro Docs**: https://docs.astro.build

---

**You're all set!** The AI document generation system is now integrated and ready to use. 🚀

