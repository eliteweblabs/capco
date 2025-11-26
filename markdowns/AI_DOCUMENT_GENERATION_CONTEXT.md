# AI Document Generation System - Project Context & History

## Background

This AI-powered document generation system was originally designed as a standalone package for a fire protection document generation company. The system has now been integrated into the main Astro-based fire protection management application.

## Current Implementation

The AI document generation feature is now fully integrated into the existing application:

1. **Integrated with Existing Database** - Uses the existing `projects` table (serial ID, `author_id`)
2. **Astro Framework** - Adapted from Next.js to work with Astro API routes
3. **Supabase Integration** - Uses existing Supabase client configuration
4. **Authentication** - Uses existing authentication system with Admin/Client roles

## What This System Includes

### 1. **AI Agent Service**
Located in `src/lib/ai/agent.ts`:
- Generates fire protection documents using Anthropic Claude API
- Supports multi-step refinement
- Tracks generation history and costs
- Ensures compliance with fire protection standards

### 2. **Database Schema**
New tables added to existing Supabase database:
- `document_templates` - Pre-defined document templates with AI prompts
- `ai_generated_documents` - Generated documents storage
- `ai_generations` - Generation history and cost tracking

See `sql-queriers/create-ai-document-generation-schema.sql` for the migration.

### 3. **API Endpoints**
Astro API route at `src/pages/api/documents/generate.ts`:
- POST `/api/documents/generate` - Generate document via AI agent

### 4. **Integration Points**
- Uses existing `supabaseAdmin` client from `src/lib/supabase-admin.ts`
- Uses existing `checkAuth` helper from `src/lib/auth.ts`
- Follows existing RLS policy patterns (Admin full access, Clients access own projects)

## Why This Approach Works

### ✅ Legal & Ownership
- You own all the code
- You can use Claude API commercially (check Anthropic's terms)
- You control your Supabase database
- You can brand and market it as your own

### ✅ Technical Benefits
- Leverages existing Supabase investment
- Uses industry-leading AI (Claude)
- Integrated with existing project management system
- Scalable architecture
- Production-ready foundation

### ✅ Business Benefits
- Can be monetized (SaaS, pay-per-use, etc.)
- White-label potential
- Customizable for different clients
- Professional-grade solution

## Customization Points

You'll want to customize:

1. **Document Templates** - Add templates specific to your use cases (via Supabase Dashboard or SQL)
2. **AI Prompts** - Refine prompts in `src/lib/ai/agent.ts` for your specific document types
3. **Business Logic** - Add custom workflows and validations in the API route
4. **UI/UX** - Build frontend components to interact with the API
5. **Integrations** - Add any third-party services you need

## Next Steps

1. Run the database migration: `sql-queriers/create-ai-document-generation-schema.sql`
2. Set up Anthropic API key in environment variables
3. Install dependencies: `npm install`
4. Build frontend components to use the API
5. Customize templates and prompts for your needs

## Questions to Consider

Before deploying, think about:

- **Target Market**: Who will use this? (Fire protection companies, inspectors, consultants?)
- **Pricing Model**: Subscription? Pay-per-document? Enterprise?
- **Document Types**: What specific documents do you need to generate?
- **Compliance**: What fire codes/standards must you comply with?
- **Features**: What features differentiate your product?

---

This system is now integrated and ready to use. See `AI_DOCUMENT_GENERATION_SETUP.md` for setup instructions.

