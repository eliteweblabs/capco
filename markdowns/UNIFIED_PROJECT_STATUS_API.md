# Unified Project Status API

## Overview

The new `/api/project-statuses` endpoint consolidates all project status-related functionality into a single, comprehensive API that returns:

- Raw database statuses
- Role-based processed statuses 
- Form select options
- Placeholder-processed project actions

## API Endpoint

```
GET /api/project-statuses
```

### Query Parameters (Optional)

For placeholder processing in project actions:

- `projectId` - Project ID for placeholder replacement
- `projectAddress` - Project address for placeholder replacement  
- `clientName` - Client name for placeholder replacement
- `clientEmail` - Client email for placeholder replacement

### Response Format

```typescript
{
  success: boolean;
  statuses: any[]; // Raw statuses from database
  statusesMap: Record<number, any>; // Raw statuses as map
  roleBasedStatuses: Record<number, UnifiedProjectStatus>; // Role-processed statuses
  selectOptions: Array<{ value: string; label: string }>; // For form selects
  userRole: string;
}
```

### UnifiedProjectStatus Interface

```typescript
interface UnifiedProjectStatus {
  status_code: number;
  admin_status_name: string;
  client_status_name: string;
  admin_project_action: string | null;
  client_project_action: string | null;
  admin_status_tab: string;
  client_status_tab: string;
  status_color: string;
  // Role-based processed values
  status_name: string; // Role-appropriate name
  status_tab: string; // Role-appropriate tab
  project_action: string | null; // Role-appropriate action with placeholders processed
  status_slug: string; // Generated slug
}
```

## Usage Examples

### 1. Basic Status Fetching

```javascript
const response = await fetch('/api/project-statuses');
const data = await response.json();

if (data.success) {
  // Use role-based statuses for UI
  const currentStatus = data.roleBasedStatuses[project.status];
  console.log(currentStatus.status_name); // Role-appropriate name
  console.log(currentStatus.project_action); // Processed with placeholders
}
```

### 2. With Placeholder Data

```javascript
const url = new URL('/api/project-statuses', window.location.origin);
url.searchParams.set('projectId', '123');
url.searchParams.set('projectAddress', '123 Main St');
url.searchParams.set('clientName', 'John Doe');
url.searchParams.set('clientEmail', 'john@example.com');

const response = await fetch(url);
const data = await response.json();

// project_action will have placeholders replaced:
// "Please review {{PROJECT_ADDRESS}}" becomes "Please review 123 Main St"
```

### 3. Form Select Options

```javascript
const response = await fetch('/api/project-statuses');
const data = await response.json();

if (data.success) {
  // Ready-to-use select options
  data.selectOptions.forEach(option => {
    console.log(option.value, option.label);
  });
}
```

## Migration Guide

### From Multiple APIs

**Before:**
```javascript
// Multiple API calls needed
const statusResponse = await fetch('/api/get-project-statuses');
const processedResponse = await fetch('/api/process-client-status');
// Manual form option generation
```

**After:**
```javascript
// Single API call
const response = await fetch('/api/project-statuses');
const data = await response.json();
// Everything included: raw, processed, and form options
```

### Component Updates

**HeroProject.astro** - Now automatically fetches status options if not provided
**Project Template** - Uses unified API with fallback to legacy method

## Features

✅ **Role-Based Processing** - Returns appropriate status names/actions for user role
✅ **Placeholder Processing** - Automatically processes `{{PROJECT_ID}}`, `{{CLIENT_NAME}}`, etc.
✅ **Form Select Ready** - Includes pre-formatted options for dropdowns
✅ **Backward Compatible** - Legacy endpoints redirect to unified API
✅ **Comprehensive Data** - Raw + processed data in single response
✅ **Authentication** - Respects user permissions and RLS policies

## Available Placeholders

- `{{PROJECT_ID}}` - Project ID number
- `{{PROJECT_ADDRESS}}` - Project address
- `{{CLIENT_NAME}}` - Client's company name or full name
- `{{CLIENT_EMAIL}}` - Client's email address
- `{{STATUS_NAME}}` - Current status name
- `{{CONTRACT_URL}}` - Link to contract tab
- `{{SITE_URL}}` - Base site URL

## Performance Benefits

- **Reduced API Calls** - Single request instead of multiple
- **Server-Side Processing** - Placeholders processed on server
- **Cached Results** - Role-based processing cached per user
- **Optimized Queries** - Single database query for all status data
