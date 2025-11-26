# AI Agent Knowledge Management Guide

## Overview

The AI agent has a knowledge base system that allows you to manually add information to its memory. This is similar to Claude.ai's project memory feature, but designed for general knowledge that applies across all conversations.

## Adding Knowledge Entries

### Method 1: Browser Console (Easiest)

1. **Log into your application**
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Run the script:**

```javascript
// Copy and paste the addJayKnowledge function from scripts/add-jay-knowledge.js
// Then run:
addJayKnowledge();
```

### Method 2: Direct API Call (cURL)

```bash
curl -X POST https://your-domain.com/api/agent/knowledge \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Jay's Purpose & Context",
    "content": "Jay is a licensed fire protection engineer...",
    "category": "purpose_context",
    "tags": ["jay", "cap-design-group"],
    "priority": 10
  }'
```

### Method 3: Using the API Endpoint

**POST** `/api/agent/knowledge`

**Request Body:**
```json
{
  "title": "Entry Title",
  "content": "Detailed content here...",
  "category": "optional_category",
  "tags": ["tag1", "tag2"],
  "priority": 5
}
```

**Response:**
```json
{
  "success": true,
  "entry": {
    "id": "uuid",
    "title": "Entry Title",
    "content": "Detailed content here...",
    "category": "optional_category",
    "tags": ["tag1", "tag2"],
    "priority": 5,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

## Knowledge Entry Structure

### Required Fields
- **title**: Short descriptive title
- **content**: The actual knowledge content (can be long-form text)

### Optional Fields
- **category**: Category for organization (e.g., "purpose_context", "current_state", "learnings", "tools")
- **tags**: Array of tags for easier searching (e.g., `["jay", "nfpa13", "automation"]`)
- **priority**: Number (higher = shown first, default: 0)
- **projectId**: Optional - link to specific project (null for general knowledge)
- **metadata**: JSON object for additional data

## Categories

Suggested categories:
- `purpose_context` - Background and objectives
- `current_state` - Current work and status
- `learnings` - Key insights and principles
- `approach` - Methodology and patterns
- `tools` - Tools and resources used
- `company_policy` - Company-specific policies
- `nfpa_standards` - NFPA code information
- `procedures` - Standard procedures

## Priority Levels

- **10**: Critical information (always shown first)
- **5**: Important information (default)
- **0**: Standard information
- **-5**: Less important (shown last)

## Managing Knowledge Entries

### List All Entries

**GET** `/api/agent/knowledge?category=purpose_context&limit=50`

### Update Entry

**PUT** `/api/agent/knowledge?id={entry-id}`

```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "priority": 8
}
```

### Delete Entry

**DELETE** `/api/agent/knowledge?id={entry-id}`

## Project-Specific Memory

For project-specific memory (like Claude.ai's project memory), use the project memory API:

**GET** `/api/agent/project-memory?projectId={id}` - Get project memory
**POST** `/api/agent/project-memory` - Create/update project memory

```json
{
  "projectId": 123,
  "purposeContext": "Purpose & context for this project...",
  "currentState": "Current state of this project..."
}
```

## How Knowledge is Used

The AI agent automatically includes:
1. **Project-specific memory** (if `projectId` is provided in context)
2. **General knowledge base** entries (filtered by category if relevant)
3. **All active entries** ordered by priority

Knowledge entries are included in the system prompt, so the agent has access to this information in every conversation.

## Example: Adding Jay's Knowledge

See `scripts/add-jay-knowledge.js` for a complete example of adding structured knowledge entries.

The script breaks down Jay's profile into logical sections:
- Purpose & Context
- Current State
- Key Learnings & Principles
- Approach & Patterns
- Tools & Resources

Each section is added as a separate knowledge entry with appropriate categories and tags.

## Best Practices

1. **Break down large content** into logical sections
2. **Use descriptive titles** that summarize the content
3. **Add relevant tags** for easier searching
4. **Set appropriate priorities** (10 for critical, 5 for important)
5. **Use categories** to organize related information
6. **Keep content focused** - one concept per entry
7. **Update entries** rather than creating duplicates

## Troubleshooting

### "Authentication required" error
- Make sure you're logged into the application
- Check that your session cookie is being sent

### "Access denied" error
- Only admins can manage all knowledge entries
- Users can only edit their own entries

### Knowledge not appearing in conversations
- Check that `isActive` is `true`
- Verify the entry has appropriate `category` and `tags`
- Ensure `priority` is set correctly

