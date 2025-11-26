# AI Document Generation System

**AI-powered document generation feature integrated into the fire protection management system**

## Quick Start

1. **Install dependencies**: `npm install` (includes `@anthropic-ai/sdk`)
2. **Set up Anthropic API**: Get API key from [console.anthropic.com](https://console.anthropic.com)
3. **Configure environment**: Add `ANTHROPIC_API_KEY` to your environment variables
4. **Run database migration**: Execute `sql-queriers/create-ai-document-generation-schema.sql` in Supabase
5. **Test the API**: POST to `/api/documents/generate` with project data

## Documentation

- **[Setup Instructions](./AI_DOCUMENT_GENERATION_SETUP.md)** - Complete setup guide
- **[Architecture](./AI_DOCUMENT_GENERATION_ARCHITECTURE.md)** - System design and structure
- **[Context & History](./AI_DOCUMENT_GENERATION_CONTEXT.md)** - Project background

## Features

- ✅ AI-powered document generation using Anthropic Claude API
- ✅ Template-based system for different document types
- ✅ Integration with existing projects and authentication
- ✅ Cost tracking and generation history
- ✅ Row-level security (RLS) for data protection
- ✅ Multi-step document refinement support

## File Structure

```
src/
├── lib/
│   └── ai/
│       └── agent.ts                    # AI agent service
└── pages/
    └── api/
        └── documents/
            └── generate.ts             # Document generation API endpoint

sql-queriers/
└── create-ai-document-generation-schema.sql  # Database migration

markdowns/
├── AI_DOCUMENT_GENERATION_README.md    # This file
├── AI_DOCUMENT_GENERATION_SETUP.md     # Setup instructions
├── AI_DOCUMENT_GENERATION_ARCHITECTURE.md  # Architecture docs
└── AI_DOCUMENT_GENERATION_CONTEXT.md   # Context & history
```

## API Usage

### Generate Document

```typescript
POST /api/documents/generate

{
  "projectId": 123,
  "templateId": "uuid-of-template",
  "projectData": {
    "facility_name": "Test Facility",
    "address": "123 Test St",
    "inspection_date": "2025-01-15"
  },
  "requirements": ["Include NFPA 72 compliance"]
}
```

## Database Tables

- `document_templates` - Document templates with AI prompts
- `ai_generated_documents` - Generated documents storage
- `ai_generations` - Generation history and cost tracking

## Requirements

- Node.js 18+
- Supabase account (already configured)
- Anthropic API key
- Existing authentication system

## Next Steps

1. Run the database migration
2. Set up your Anthropic API key
3. Test the API endpoint
4. Build frontend components to use the API
5. Customize templates and prompts

---

**Ready to get started?** See [Setup Instructions](./AI_DOCUMENT_GENERATION_SETUP.md) for detailed steps.

