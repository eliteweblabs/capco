# Setup Instructions

Complete step-by-step guide to get your Fire Protection Document Generation Agent running.

## Prerequisites

- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **Git** installed
- **Supabase account** (free tier works) ([Sign up](https://supabase.com))
- **Anthropic API key** ([Get one](https://console.anthropic.com))

## Step 1: Extract and Initialize Project

### 1.1 Extract Package
Extract this package to your desired location:
```bash
# Example: Extract to your projects folder
cd ~/projects
# Extract the package here
```

### 1.2 Initialize Next.js Project
```bash
# Navigate to the extracted folder
cd fire-protection-agent-package

# Initialize Next.js (if not already done)
npx create-next-app@latest . --typescript --tailwind --app --no-git

# Or if you prefer to start fresh:
npx create-next-app@latest fire-protection-agent --typescript --tailwind --app
# Then copy all files from this package into that folder
```

### 1.3 Install Dependencies
```bash
npm install @anthropic-ai/sdk @supabase/supabase-js
npm install -D @types/node @types/react typescript
```

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and name your project (e.g., "fire-protection-agent")
4. Set a database password (save this!)
5. Choose a region close to you
6. Wait for project to be created (~2 minutes)

### 2.2 Get Supabase Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### 2.3 Run Database Migration
1. Install Supabase CLI (optional but recommended):
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Or manually run the SQL:
   - Go to Supabase Dashboard → **SQL Editor**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy and paste the entire SQL into the editor
   - Click "Run"

### 2.4 Verify Tables Created
In Supabase Dashboard → **Table Editor**, you should see:
- `projects`
- `document_templates`
- `documents`
- `ai_generations`

## Step 3: Set Up Anthropic API

### 3.1 Get API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create Key**
5. Name it (e.g., "fire-protection-agent")
6. Copy the key (starts with `sk-ant-...`) - You won't see it again!

### 3.2 Set Usage Limits (Optional)
- Set spending limits in Anthropic dashboard
- Monitor usage to avoid unexpected costs

## Step 4: Configure Environment Variables

### 4.1 Create `.env.local` File
In your project root, create `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2 Add to `.gitignore`
Make sure `.env.local` is in your `.gitignore`:
```
.env.local
.env*.local
```

## Step 5: Test the Setup

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test API Endpoint
Create a test file `test-api.js`:

```javascript
const testGeneration = async () => {
  const response = await fetch('http://localhost:3000/api/documents/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: 'test-project-id',
      templateId: 'test-template-id',
      projectData: {
        facility_name: 'Test Facility',
        address: '123 Test St',
        inspection_date: '2025-01-15',
      },
    }),
  });
  
  const data = await response.json();
  console.log(data);
};

testGeneration();
```

Or use curl:
```bash
curl -X POST http://localhost:3000/api/documents/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-id",
    "templateId": "test-template-id",
    "projectData": {
      "facility_name": "Test Facility",
      "address": "123 Test St"
    }
  }'
```

## Step 6: Create Your First Project (Optional)

### 6.1 Via Supabase Dashboard
1. Go to **Table Editor** → `projects`
2. Click **Insert** → **Insert row**
3. Fill in:
   - `name`: "My First Project"
   - `user_id`: (you'll need to create a user first via Supabase Auth)

### 6.2 Via API
Create an API route `api/projects/create.ts` or use Supabase client directly.

## Step 7: Customize for Your Needs

### 7.1 Update Document Templates
Edit `supabase/migrations/001_initial_schema.sql` to add your templates, or insert via Supabase Dashboard.

### 7.2 Customize AI Prompts
Edit `lib/ai/agent.ts` to refine prompts for your specific document types.

### 7.3 Build Frontend
Create your Next.js pages/components for:
- Project management UI
- Document generation form
- Document preview/editor
- User authentication

## Step 8: Deploy (When Ready)

### 8.1 Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 8.2 Set Environment Variables in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.local`

### 8.3 Deploy Database
Your Supabase database is already hosted, so no additional deployment needed!

## Troubleshooting

### Issue: "Cannot find module '@anthropic-ai/sdk'"
**Solution**: Run `npm install` again

### Issue: "Invalid API key" from Anthropic
**Solution**: Check that `ANTHROPIC_API_KEY` in `.env.local` is correct and starts with `sk-ant-`

### Issue: "Invalid Supabase URL"
**Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` includes `https://` and your project ref

### Issue: Database migration fails
**Solution**: 
- Check SQL syntax in migration file
- Ensure you have proper permissions in Supabase
- Try running SQL directly in Supabase SQL Editor

### Issue: RLS policies blocking queries
**Solution**: 
- Check that you're authenticated (if using RLS)
- Verify RLS policies match your use case
- Temporarily disable RLS for testing (not recommended for production)

## Next Steps

1. ✅ Setup complete? Read `ARCHITECTURE.md` to understand the system
2. ✅ Ready to customize? Start building your frontend
3. ✅ Need help? Review the code files and comments

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Anthropic API Docs**: https://docs.anthropic.com
- **Next.js Docs**: https://nextjs.org/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

---

**You're all set!** Start building your fire protection document generation agent. 🚀

