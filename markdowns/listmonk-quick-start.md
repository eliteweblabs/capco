# 🚀 Listmonk Quick Start

## 1. Verify Environment Variables

Check that these are in your `.env` file:

```bash
LISTMONK_URL=https://listmonk-firstbranch.up.railway.app
LISTMONK_USERNAME=Rothco
LISTMONK_PASSWORD=vyrkam-tenfI0-sujgiz
```

**For Production**: Add to Railway environment variables!

---

## 2. Create Your First Mailing List

1. Go to: https://listmonk-firstbranch.up.railway.app/admin/
2. Login with credentials above
3. Navigate to **Lists** → **New List**
4. Create:
   - Name: "All Users"
   - Type: Public
   - Opt-in: Single
5. Note the List ID (probably `1`)

---

## 3. Sync Your Users

### Option A: Via Browser Console (Development)

```javascript
fetch("/api/listmonk/sync", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ mode: "bulk" }),
})
  .then((r) => r.json())
  .then((data) => console.log("Synced:", data));
```

### Option B: Via cURL

```bash
curl -X POST http://localhost:4321/api/listmonk/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"mode": "bulk"}'
```

---

## 4. Create Your First Campaign

### Via Browser Console

```javascript
fetch("/api/listmonk/campaigns", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    name: "Welcome Email",
    subject: "Welcome to Rothco Built!",
    lists: [1], // Your list ID
    content_type: "richtext",
    body: "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
  }),
})
  .then((r) => r.json())
  .then((data) => console.log("Campaign:", data));
```

### Via Listmonk Admin

1. Go to **Campaigns** → **New Campaign**
2. Fill in details
3. Save as draft

---

## 5. Send a Test Campaign

### Option 1: Send Immediately (API)

```javascript
// After creating campaign, get its ID from response
const campaignId = 1;

fetch("/api/listmonk/campaigns", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    id: campaignId,
    status: "running",
  }),
});
```

### Option 2: Via Listmonk Admin

1. Go to **Campaigns**
2. Find your campaign
3. Click **Start Campaign**

---

## 6. Check Results

Go to Listmonk admin and view:

- **Dashboard**: Overall stats
- **Campaigns**: Campaign analytics
- **Subscribers**: Who received emails

---

## Common Operations

### Add Single Subscriber

```javascript
fetch("/api/listmonk/subscribers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    email: "user@example.com",
    name: "John Doe",
    lists: [1],
    status: "enabled",
  }),
});
```

### Schedule Campaign

```javascript
fetch("/api/listmonk/campaigns", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    name: "Scheduled Newsletter",
    subject: "Monthly Update",
    lists: [1],
    body: "<h1>Update</h1>",
    send_at: "2026-02-01T09:00:00Z", // ISO format
  }),
});
```

### Get All Subscribers

```javascript
fetch("/api/listmonk/subscribers")
  .then((r) => r.json())
  .then((data) => console.log(data));
```

---

## Troubleshooting

### "Unauthorized" error

- Make sure you're logged in as Admin
- Check browser console for auth errors

### "Listmonk credentials not configured"

- Verify `.env` file has all three variables
- Restart dev server: `npm run dev`

### Emails not sending

- Check Listmonk **Settings** → **SMTP**
- Verify SMTP credentials in Railway
- Check Listmonk logs on Railway

### Subscribers not syncing

- Verify Supabase profiles have email addresses
- Check browser console for errors
- Try single sync first: `{ mode: 'single', profileId: 'uuid' }`

---

## Next Steps

1. ✅ **Design Email Template** in Listmonk
2. ✅ **Create Segment Lists** (Clients, Admins, etc.)
3. ✅ **Set Up Welcome Automation**
4. ✅ **Build Custom UI** in NewsletterManager component
5. ✅ **Schedule Regular Campaigns**

---

## Need Help?

Check these files:

- `markdowns/listmonk-integration-guide.md` - Full documentation
- `markdowns/accomplishments-2026-01-23.md` - What was done today
- Listmonk Docs: https://listmonk.app/docs

---

_Quick Start Guide - January 23, 2026_
