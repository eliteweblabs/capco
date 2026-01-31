# Gmail Integration Troubleshooting

**Issue**: Assistant says "I am currently unable to access your email inbox"

## Diagnosis Steps

### 1. Check if Gmail is actually connected

Run this in Supabase SQL Editor:

```sql
SELECT
  user_id,
  email_address,
  expires_at,
  created_at,
  updated_at
FROM gmail_tokens
WHERE user_id = 'd807fb34-a10c-4d76-bc20-13b421c44bf7'; -- Your user ID
```

**Expected**: Should return 1 row with your email address and valid tokens

### 2. Check server logs

Look for these log messages in the terminal where you're running the dev server:

```
[---VAPI-WEBHOOK] Getting unread emails for user
❌ [VAPI-WEBHOOK] Error getting emails: [error message]
```

### 3. Common Issues & Fixes

#### Issue A: Tokens expired

**Symptoms**: Gmail was connected but stopped working after a while  
**Fix**: Disconnect and reconnect Gmail on the voice assistant page

#### Issue B: Wrong user ID

**Symptoms**: User metadata not being passed correctly  
**Fix**: Check that you're logged in as the same user who connected Gmail

#### Issue C: RLS policies blocking access

**Symptoms**: Database query fails silently  
**Fix**: Run this SQL to check RLS:

```sql
-- Test if you can read your own tokens
SELECT * FROM gmail_tokens WHERE user_id = auth.uid();
```

If this returns empty, the RLS policies might be wrong.

#### Issue D: Missing environment variables

**Symptoms**: Gmail OAuth fails
**Check**:

```bash
# These must be set in .env:
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
PUBLIC_URL=http://localhost:4321 (or your tunnel URL)
```

### 4. Test Gmail API directly

Try accessing this URL while logged in:

```
https://cowardly-duck-66.loca.lt/api/gmail/status
```

**Expected response**:

```json
{
  "success": true,
  "connected": true,
  "emailAddress": "your@email.com"
}
```

If this fails, Gmail isn't actually connected properly.

### 5. Manual test of getUnreadEmails

Create a test file: `/src/pages/api/test-gmail.ts`

```typescript
import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { getUnreadEmails } from "../../lib/gmail";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { currentUser } = await checkAuth(cookies);

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emails = await getUnreadEmails(currentUser.id, 5);

    return new Response(
      JSON.stringify({
        success: true,
        count: emails.length,
        emails: emails.map((e) => ({
          from: e.from,
          subject: e.subject,
          snippet: e.snippet,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

Then visit: `https://cowardly-duck-66.loca.lt/api/test-gmail`

This will show the exact error!

## Next Steps

1. Check the SQL query (step 1) - are there tokens stored?
2. Visit `/api/gmail/status` - does it say connected?
3. Check browser console for errors when saying "check my email"
4. Create the test endpoint and see the actual error

Let me know what you find! 🔍
