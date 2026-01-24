# Listmonk Integration Guide

## Overview

Listmonk is now integrated into your Astro app for professional newsletter management. This integration is **white-labeled** - users stay in your app with your Supabase authentication.

**Listmonk URL**: https://listmonk-firstbranch.up.railway.app/admin/

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Your Astro App (White-labeled UI)         │
│  - Uses Supabase Auth                       │
│  - Custom newsletter admin interface        │
│  - Only admins can access                   │
└──────────────┬──────────────────────────────┘
               │ API Calls
               ▼
┌─────────────────────────────────────────────┐
│  Server-side API Proxies                    │
│  /api/listmonk/subscribers                  │
│  /api/listmonk/campaigns                    │
│  /api/listmonk/sync                         │
│  - Keeps credentials secure                 │
│  - Enforces admin-only access               │
└──────────────┬──────────────────────────────┘
               │ Authenticated Requests
               ▼
┌─────────────────────────────────────────────┐
│  Listmonk on Railway                        │
│  - Manages subscribers                       │
│  - Sends emails                             │
│  - Tracks campaigns                         │
└─────────────────────────────────────────────┘
```

---

## What's Been Created

### 1. **TypeScript Client Library** (`src/lib/listmonk.ts`)
A comprehensive wrapper around the Listmonk API with functions for:
- **Subscribers**: Create, read, update, delete
- **Lists**: Manage mailing lists
- **Campaigns**: Create and send email campaigns
- **Templates**: Email templates
- **Sync**: Sync Supabase profiles to Listmonk

### 2. **API Endpoints**

#### `/api/listmonk/subscribers` (GET, POST, PUT, DELETE)
Manage newsletter subscribers
- GET: List all subscribers (with pagination/search)
- POST: Create new subscriber
- PUT: Update subscriber
- DELETE: Remove subscriber

#### `/api/listmonk/campaigns` (GET, POST, PUT, DELETE)
Manage email campaigns
- GET: List campaigns or get specific campaign
- POST: Create new campaign
- PUT: Update campaign
- DELETE: Remove campaign

#### `/api/listmonk/sync` (POST)
Sync Supabase users to Listmonk
- **Single**: Sync one profile
- **Bulk**: Sync all profiles at once

---

## Usage Examples

### Frontend Usage

```javascript
// Fetch all subscribers
const response = await fetch('/api/listmonk/subscribers');
const data = await response.json();

// Create a subscriber
await fetch('/api/listmonk/subscribers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    lists: [1], // List IDs
    attribs: {
      role: 'Client',
      phone: '555-1234'
    }
  })
});

// Create a campaign
await fetch('/api/listmonk/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'January Newsletter',
    subject: 'Welcome to 2026!',
    lists: [1],
    content_type: 'richtext',
    body: '<h1>Hello!</h1><p>Welcome to our newsletter</p>',
    send_at: '2026-02-01T09:00:00Z' // Optional: schedule
  })
});

// Sync all Supabase users to Listmonk
await fetch('/api/listmonk/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'bulk' })
});
```

### Server-side Usage (in API routes)

```typescript
import { listmonk } from '../../lib/listmonk';

// Get all subscribers
const subscribers = await listmonk.subscribers.list({
  page: 1,
  per_page: 50
});

// Create campaign
const campaign = await listmonk.campaigns.create({
  name: 'Welcome Email',
  subject: 'Welcome!',
  lists: [1],
  body: '<h1>Welcome</h1>'
});

// Send campaign immediately
await listmonk.campaigns.updateStatus(campaign.id, 'running');

// Sync a specific profile
await listmonk.sync.profile({
  id: 'user-uuid',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'Client'
});
```

---

## Syncing Users

### Initial Sync
Sync all existing Supabase profiles to Listmonk:

```bash
# Make API call to sync endpoint
curl -X POST https://yoursite.com/api/listmonk/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "bulk"}' \
  --cookie "your-auth-cookie"
```

### Auto-sync New Users
Add this to your user signup flow:

```typescript
// After creating user in Supabase
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Sync to Listmonk
await fetch('/api/listmonk/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'single',
    profileId: profile.id
  })
});
```

---

## Next Steps

### 1. Update NewsletterManager Component
Replace the current `NewsletterManager.astro` component with UI that calls these endpoints.

### 2. Create Lists in Listmonk
Log into Listmonk admin and create lists:
- **All Users** (public, single opt-in)
- **Clients** (private)
- **Admins** (private)

### 3. Create Email Templates
Design email templates in Listmonk with your branding.

### 4. Test the Integration
```bash
# Sync users
curl -X POST http://localhost:4321/api/listmonk/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "bulk"}'

# Get subscribers
curl http://localhost:4321/api/listmonk/subscribers

# Create test campaign
curl -X POST http://localhost:4321/api/listmonk/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "subject": "Test Email",
    "lists": [1],
    "body": "<h1>Test</h1>"
  }'
```

---

## Security Features

✅ **Credentials never exposed** - Stored in `.env`, never sent to client
✅ **Admin-only access** - All endpoints check for Admin role
✅ **Supabase auth** - Uses your existing authentication
✅ **Server-side validation** - All requests validated on server
✅ **HTTPS only** - Railway enforces HTTPS for Listmonk

---

## Environment Variables

Already added to your `.env`:

```bash
LISTMONK_URL=https://listmonk-firstbranch.up.railway.app
LISTMONK_USERNAME=Rothco
LISTMONK_PASSWORD=vyrkam-tenfI0-sujgiz
```

**IMPORTANT**: Add these to your Railway deployment environment variables!

---

## Listmonk Features You Can Use

### Subscriber Management
- Import/export subscribers
- Custom attributes (store any data with subscribers)
- Segmentation by lists
- Blocklist management

### Campaign Management
- Rich text editor
- HTML emails
- Scheduled sending
- Campaign analytics (opens, clicks, bounces)
- A/B testing

### Templates
- Reusable email templates
- Variable substitution (`{{ .Subscriber.Name }}`)
- Custom CSS
- Responsive design

### Automation
- Webhooks for events
- API for programmatic access
- Transactional emails
- Auto-responders

---

## Listmonk Template Variables

Use these in your email templates:

```html
<h1>Hello {{ .Subscriber.Name }}!</h1>
<p>Your email: {{ .Subscriber.Email }}</p>

<!-- Custom attributes -->
<p>Role: {{ .Subscriber.Attribs.role }}</p>
<p>Phone: {{ .Subscriber.Attribs.phone }}</p>

<!-- Campaign info -->
<p>Campaign: {{ .Campaign.Name }}</p>

<!-- Unsubscribe link -->
<a href="{{ UnsubscribeURL }}">Unsubscribe</a>
```

---

## Common Workflows

### Send Welcome Email
```javascript
// When new user signs up
await fetch('/api/listmonk/subscribers', {
  method: 'POST',
  body: JSON.stringify({
    email: newUser.email,
    name: newUser.name,
    lists: [1], // Welcome series list
    status: 'enabled'
  })
});
```

### Monthly Newsletter
```javascript
// Create campaign
const campaign = await fetch('/api/listmonk/campaigns', {
  method: 'POST',
  body: JSON.stringify({
    name: 'January 2026 Newsletter',
    subject: 'Monthly Update',
    lists: [1], // All users list
    template_id: 1, // Your newsletter template
    body: '... newsletter content ...',
    send_at: '2026-02-01T09:00:00Z'
  })
});

// Campaign is automatically scheduled
```

### Project Update Email
```javascript
// Send to specific project clients
const projectClients = await getProjectClients(projectId);
const emails = projectClients.map(c => c.email);

// Create temporary list or use subscriber filter
// Then send campaign
```

---

## Troubleshooting

### "Unauthorized" error
- Check that user is logged in
- Verify user has Admin role
- Check Supabase session is valid

### "Listmonk credentials not configured"
- Add environment variables to `.env`
- Restart dev server
- For production, add to Railway environment variables

### Subscribers not syncing
- Check Supabase profiles table has email addresses
- Verify profiles have required fields (id, email, name)
- Check API endpoint logs for errors

### Emails not sending
- Verify Listmonk email settings in admin panel
- Check Listmonk logs on Railway
- Confirm campaign status is "running"

---

## Resources

- **Listmonk Docs**: https://listmonk.app/docs
- **Listmonk API**: https://listmonk.app/docs/apis/apis
- **Your Listmonk Admin**: https://listmonk-firstbranch.up.railway.app/admin/

---

## Want to Customize?

The integration is fully customizable:

1. **Update API endpoints** - Add more features from Listmonk API
2. **Create custom UI** - Build your own newsletter manager interface
3. **Add webhooks** - React to Listmonk events (bounces, unsubscribes)
4. **Custom templates** - Design branded email templates
5. **Automation** - Create auto-responders and drip campaigns

---

Generated: January 23, 2026
Status: ✅ Ready to use
