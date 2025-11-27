# 🧠 AI Agent Memory System

This document explains how the AI agent's memory/knowledge system works and how to manage it.

## 📊 Database Schema

### 1. `ai_agent_knowledge` Table

Stores general knowledge entries that can be used across all conversations or for specific projects.

**Columns:**

- `id` (UUID) - Primary key
- `title` (TEXT) - Entry title
- `content` (TEXT) - Entry content/knowledge
- `category` (TEXT) - Optional category (e.g., "company_policy", "nfpa_standards", "procedures")
- `tags` (TEXT[]) - Array of tags for searching
- `priority` (INTEGER) - Higher priority entries shown first (default: 0)
- `isActive` (BOOLEAN) - Whether entry is active (default: true)
- `authorId` (UUID) - User who created the entry
- `projectId` (INTEGER) - Optional: project-specific knowledge (NULL = global)
- `createdAt` (TIMESTAMPTZ) - Creation timestamp
- `updatedAt` (TIMESTAMPTZ) - Last update timestamp
- `metadata` (JSONB) - Additional metadata

**Usage:**

- **Global knowledge**: `projectId = NULL` - Available to all conversations
- **Project-specific**: `projectId = <project_id>` - Only available when that project is in context

### 2. `ai_agent_project_memory` Table

Stores Claude.ai-style project memory with "Purpose & Context" and "Current State" sections.

**Columns:**

- `id` (UUID) - Primary key
- `projectId` (INTEGER) - Project ID (unique, one memory per project)
- `purposeContext` (TEXT) - "Purpose & Context" section
- `currentState` (TEXT) - "Current State" section
- `authorId` (UUID) - User who created/updated the memory
- `createdAt` (TIMESTAMPTZ) - Creation timestamp
- `updatedAt` (TIMESTAMPTZ) - Last update timestamp

**Usage:**

- One memory entry per project
- Automatically loaded when `projectId` is in the conversation context

## 🔄 How Memory is Loaded

### Flow:

1. **User sends message** → `/api/agent/chat`
2. **API extracts context** → Includes `projectId` if available
3. **Agent processes query** → Calls `buildSystemPrompt(context)`
4. **System prompt builder**:
   - Loads project memory (if `projectId` exists)
   - Loads knowledge base (global + project-specific if `projectId` exists)
   - Formats into system prompt sections
5. **System prompt sent to Claude** → Includes all memory/knowledge

### Code Location:

- **Loading**: `src/lib/ai/unified-agent.ts`
  - `loadKnowledgeBase()` - Lines 154-183
  - `loadProjectMemory()` - Lines 188-203
  - `buildSystemPrompt()` - Lines 208-294

## 📝 Memory Format in System Prompt

### Project Memory Section:

```
## Project Memory

### Purpose & Context
{projectMemory.purposeContext}

### Current State
{projectMemory.currentState}
```

### Knowledge Base Section:

```
## Knowledge Base

### {entry.title} ({entry.category})
{entry.content}

### {entry.title} ({entry.category})
{entry.content}
...
```

## 🔧 Managing Memory

### Adding General Knowledge

**Via API:**

```javascript
POST /api/agent/knowledge
{
  "title": "Company Policy",
  "content": "We always prioritize safety...",
  "category": "company_policy",
  "tags": ["policy", "safety"],
  "priority": 10
}
```

**Via SQL:**

```sql
INSERT INTO ai_agent_knowledge (title, content, category, priority, "isActive")
VALUES (
  'Company Policy',
  'We always prioritize safety...',
  'company_policy',
  10,
  true
);
```

### Adding Project-Specific Knowledge

**Via API:**

```javascript
POST /api/agent/knowledge
{
  "title": "Project Specific Info",
  "content": "This project requires...",
  "projectId": 123,
  "category": "project_info"
}
```

### Managing Project Memory

**Via API:**

```javascript
POST /api/agent/project-memory
{
  "projectId": 123,
  "purposeContext": "This project is for...",
  "currentState": "Currently working on..."
}
```

**Via SQL:**

```sql
INSERT INTO ai_agent_project_memory ("projectId", "purposeContext", "currentState")
VALUES (
  123,
  'This project is for...',
  'Currently working on...'
)
ON CONFLICT ("projectId") DO UPDATE SET
  "purposeContext" = EXCLUDED."purposeContext",
  "currentState" = EXCLUDED."currentState";
```

## 🔍 Debugging Memory Loading

### Check Logs

The agent logs memory loading:

- `✅ [UNIFIED-AGENT] Loaded X knowledge entries`
- `✅ [UNIFIED-AGENT] Loaded project memory for project X`
- `⚠️ [UNIFIED-AGENT] No knowledge entries found!`

### Verify Database

```sql
-- Check knowledge entries
SELECT id, title, category, "isActive", "projectId"
FROM ai_agent_knowledge
ORDER BY priority DESC, "createdAt" DESC;

-- Check project memory
SELECT "projectId", "purposeContext", "currentState"
FROM ai_agent_project_memory;
```

### Test API Endpoints

- `GET /api/agent/knowledge` - List knowledge entries
- `GET /api/agent/project-memory?projectId=123` - Get project memory

## ⚠️ Common Issues

### 1. No Knowledge Loading

**Symptoms:** Agent doesn't use knowledge entries
**Causes:**

- RLS policies blocking access
- `isActive = false`
- No entries in database
- `projectId` filter too restrictive

**Solution:**

- Check RLS policies allow authenticated users to SELECT
- Verify entries have `isActive = true`
- Check logs for errors

### 2. Project Memory Not Loading

**Symptoms:** Project memory not appearing in responses
**Causes:**

- No memory entry for project
- `projectId` not passed in context
- RLS policies blocking access

**Solution:**

- Verify memory exists: `SELECT * FROM ai_agent_project_memory WHERE "projectId" = X`
- Check context includes `projectId`
- Verify RLS policies allow access

### 3. Too Much/Little Knowledge

**Symptoms:** System prompt too long or missing entries
**Causes:**

- Limit too low (currently 50 entries)
- Priority ordering not working
- Category filter too restrictive

**Solution:**

- Adjust limit in `loadKnowledgeBase()` (currently 50)
- Check priority values are set correctly
- Remove category filter if needed

## 📚 Related Files

- **Database Schema**: `sql-queriers/create-ai-agent-knowledge-base.sql`
- **Agent Code**: `src/lib/ai/unified-agent.ts`
- **API Endpoints**:
  - `src/pages/api/agent/knowledge.ts`
  - `src/pages/api/agent/project-memory.ts`
- **Documentation**: `markdowns/AI_AGENT_KNOWLEDGE_MANAGEMENT.md`

## 🎯 Best Practices

1. **Use Categories**: Organize knowledge with categories for easier management
2. **Set Priorities**: Higher priority entries appear first
3. **Keep Active**: Set `isActive = false` to temporarily disable entries
4. **Project-Specific**: Use `projectId` for knowledge that only applies to specific projects
5. **Regular Updates**: Keep project memory current with latest state
6. **Test Loading**: Check logs to verify memory is loading correctly
