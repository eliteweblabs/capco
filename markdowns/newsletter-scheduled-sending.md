# Newsletter Scheduled Sending

## Overview

Automatic scheduled sending for newsletters using **node-cron** - a lightweight, production-ready task scheduler for Node.js.

## Why node-cron?

**node-cron** is the best choice for this use case because:

- ✅ **Lightweight** - Only 7KB, no heavy dependencies
- ✅ **Reliable** - Used in production by thousands of apps
- ✅ **Simple** - Easy cron syntax, minimal configuration
- ✅ **Node Native** - Runs in your existing Node.js process
- ✅ **No External Services** - No need for Redis, external queues, or paid services
- ✅ **Works with Railway** - Runs as a background process in your deployment

### Alternatives Considered

- **node-schedule**: Heavier, more complex API
- **bull/bullmq**: Requires Redis, overkill for simple scheduling
- **agenda**: Requires MongoDB, too heavyweight
- **External services** (AWS EventBridge, etc.): Unnecessary complexity and cost

## Features

### 1. Schedule Newsletters

- Set specific date and time for sending
- Must be at least 5 minutes in the future
- Visual "⏰ Scheduled" badge on scheduled newsletters
- Shows scheduled time in list view

### 2. Auto-Processing

- Scheduler checks every minute for newsletters ready to send
- Automatically sends at scheduled time
- Marks as sent and clears schedule after sending
- Tracks success/failure for each send

### 3. Safety Features

- Must not be in draft mode
- Must be active
- Must be scheduled in the future
- Validation on both client and server

## Database Schema Changes

### New Fields

```sql
-- Add to newsletters table
scheduledFor TIMESTAMP WITH TIME ZONE  -- When to send
isScheduled BOOLEAN DEFAULT false      -- Is this scheduled?
```

### Migration

Run this if you already have the newsletters table:

```bash
psql -d your_database < sql-queriers/migrate-newsletters-add-scheduling.sql
```

Or for new tables, use the updated:

```bash
psql -d your_database < sql-queriers/create-newsletters-table.sql
```

## Setup Instructions

### 1. Install Dependencies

Already done! node-cron was added to package.json:

```bash
npm install node-cron @types/node-cron
```

### 2. Update Database

Run the migration script:

```bash
psql -d your_database < sql-queriers/migrate-newsletters-add-scheduling.sql
```

Or if creating fresh:

```bash
psql -d your_database < sql-queriers/create-newsletters-table.sql
```

### 3. Configure Environment

Make sure these are set in your `.env`:

```bash
PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SECRET=your_supabase_secret_key
PUBLIC_SITE_URL=http://localhost:4321  # Or your production URL
EMAIL_API_KEY=your_resend_api_key
FROM_EMAIL=your@email.com
FROM_NAME=Your Company Name
```

### 4. Run the Scheduler

**Development:**

```bash
npm run newsletter:scheduler
```

**Production (Railway):**
The scheduler needs to run as a separate process. Add a new service in Railway:

1. **Create Procfile** in your project root:

```
web: npm run start
scheduler: npm run newsletter:scheduler
```

2. **Or use Railway's run command**:
   - In Railway dashboard
   - Add new "Background Process"
   - Command: `npm run newsletter:scheduler`

**Alternative: PM2 (Recommended for VPS)**

```bash
# Install PM2
npm install -g pm2

# Start scheduler
pm2 start npm --name "newsletter-scheduler" -- run newsletter:scheduler

# Save config
pm2 save

# Auto-start on boot
pm2 startup
```

## How to Use

### From UI (Admin Dashboard)

1. **Create Newsletter**
   - Go to `/admin/newsletters`
   - Create newsletter with title, subject, content
   - Choose recipients
   - Turn OFF draft mode
   - Save

2. **Schedule for Later**
   - Click "Schedule" button on newsletter
   - Enter date and time (e.g., `2026-01-25 14:30`)
   - Confirm
   - Newsletter shows "⏰ Scheduled" badge

3. **Send Immediately** (Alternative)
   - Click "Send" button to send right away
   - No scheduling, immediate delivery

### From API

**Schedule a Newsletter:**

```bash
curl -X POST http://localhost:4321/api/newsletters/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "scheduledFor": "2026-01-25T14:30:00Z"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Newsletter scheduled for 1/25/2026, 2:30:00 PM",
  "data": {
    /* newsletter object */
  }
}
```

## Scheduler Behavior

### Cron Schedule

```javascript
cron.schedule("* * * * *", processScheduledNewsletters);
```

- Runs **every minute**
- Checks for newsletters where `scheduledFor <= NOW()`
- Sends all matching newsletters
- Updates `lastSentAt` and clears `isScheduled`

### What Happens

1. **Every Minute:**
   - Query for scheduled newsletters ready to send
   - Filter: `isScheduled=true`, `isActive=true`, `isDraft=false`, `scheduledFor <= NOW()`

2. **For Each Newsletter:**
   - Call `/api/newsletters/send` with `isScheduled=true` flag
   - Send to all targeted recipients
   - Mark as sent (`isScheduled=false`)
   - Update `lastSentAt` and `sentCount`

3. **Error Handling:**
   - If send fails, logs error and continues
   - Newsletter remains scheduled for retry on next run
   - Check logs for failures

### Timezone Configuration

Default timezone: `America/New_York`

To change, edit `scripts/newsletter-scheduler.ts`:

```typescript
cron.schedule("* * * * *", processScheduledNewsletters, {
  scheduled: true,
  timezone: "America/Los_Angeles", // Change this
});
```

[See all timezone options](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Monitoring

### Check Scheduler Status

```bash
# If using PM2
pm2 status
pm2 logs newsletter-scheduler

# Or check process
ps aux | grep newsletter-scheduler
```

### Check Logs

The scheduler logs to console:

```
[NEWSLETTER-SCHEDULER] 🚀 Newsletter scheduler started (runs every minute)
[NEWSLETTER-SCHEDULER] ⏰ Timezone: America/New_York
[NEWSLETTER-SCHEDULER] 🔍 Checking for scheduled newsletters...
[NEWSLETTER-SCHEDULER] ✅ No newsletters to send
[NEWSLETTER-SCHEDULER] 📧 Found 1 newsletter(s) to send
[NEWSLETTER-SCHEDULER] 📤 Sending newsletter: Monthly Update
[NEWSLETTER-SCHEDULER] ✅ Sent: Monthly Update (150 recipients)
```

### Common Issues

**Scheduler not running:**

- Check `pm2 status` or process status
- Verify environment variables are set
- Check Railway background process logs

**Newsletters not sending:**

- Verify newsletter is NOT in draft mode
- Verify newsletter is active
- Check `scheduledFor` is in the past
- Check email API credentials

**Time zone issues:**

- Scheduler timezone must match your expected timezone
- Database stores UTC, converts for display
- Use `toISOString()` for consistent formatting

## Production Deployment

### Railway (Recommended)

1. Add `Procfile` to your project
2. Or add background process in Railway dashboard
3. Environment variables auto-sync from main service

### VPS/Docker

Use PM2 or Docker Compose:

**docker-compose.yml:**

```yaml
services:
  web:
    build: .
    command: npm run start

  scheduler:
    build: .
    command: npm run newsletter:scheduler
    environment:
      - PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL}
      - SUPABASE_SECRET=${SUPABASE_SECRET}
      # ... other env vars
```

### Heroku

Add to `Procfile`:

```
web: npm run start
scheduler: npm run newsletter:scheduler
```

Then:

```bash
heroku ps:scale scheduler=1
```

## API Reference

### POST /api/newsletters/schedule

Schedule a newsletter for future sending.

**Request:**

```json
{
  "id": 1,
  "scheduledFor": "2026-01-25T14:30:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Newsletter scheduled for 1/25/2026, 2:30:00 PM",
  "data": {
    /* newsletter object with isScheduled=true */
  }
}
```

**Errors:**

- `400`: Scheduled time must be in the future
- `400`: Newsletter is not active or in draft mode
- `404`: Newsletter not found
- `401`: Unauthorized (admin only)

### POST /api/newsletters/send

Send newsletter immediately or via scheduler.

**Request:**

```json
{
  "id": 1,
  "isScheduled": false // true when called by scheduler
}
```

When `isScheduled=true`, auth check is skipped (internal call).

## Testing

### Test Scheduled Send

1. Create newsletter (turn off draft, make active)
2. Schedule for 2 minutes from now
3. Wait 2 minutes
4. Check newsletter list - should show as sent
5. Check recipient inbox

### Test Scheduler

```bash
# Start scheduler in dev
npm run newsletter:scheduler

# In another terminal, schedule a newsletter
curl -X POST http://localhost:4321/api/newsletters/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "scheduledFor": "2026-01-24T12:00:00Z"
  }'

# Watch scheduler logs
# Should process and send within 1 minute
```

## Performance Considerations

### Frequency

- Current: Every minute
- Can adjust cron expression for different intervals
- More frequent = lower latency, higher CPU
- Less frequent = higher latency, lower CPU

### Recommendations

- **Every minute**: Good for most use cases (current setting)
- **Every 5 minutes**: Lower load, acceptable delay (`*/5 * * * *`)
- **Every 15 minutes**: Minimal load, higher delay (`*/15 * * * *`)

### Scaling

For very high volume:

- Consider batch processing (100 newsletters per run)
- Use queue system (Bull + Redis)
- Separate scheduler per service/region
- Monitor database query performance

## Future Enhancements

Potential improvements:

- [ ] Recurring schedules (daily/weekly/monthly)
- [ ] Batch size limits for large sends
- [ ] Retry logic for failed sends
- [ ] Email delivery tracking/webhooks
- [ ] A/B testing for scheduled sends
- [ ] Smart send time optimization
- [ ] Pause/resume scheduled sends
- [ ] Scheduler health monitoring dashboard

## Troubleshooting

### Newsletter not sending at scheduled time

**Check 1: Is scheduler running?**

```bash
pm2 status
# or
ps aux | grep newsletter-scheduler
```

**Check 2: Is newsletter configured correctly?**

- `isDraft = false`
- `isActive = true`
- `isScheduled = true`
- `scheduledFor` is in the past

**Check 3: Check logs**

```bash
pm2 logs newsletter-scheduler
```

**Check 4: Database query**

```sql
SELECT id, title, "isScheduled", "scheduledFor", "isDraft", "isActive"
FROM newsletters
WHERE "isScheduled" = true;
```

### Emails not being delivered

Check `/api/newsletters/send` logs for errors:

- Email API key valid?
- Recipients have valid emails?
- Rate limits hit?

### Scheduler crashes

Common causes:

- Missing environment variables
- Database connection issues
- Invalid newsletter data

Check logs and restart:

```bash
pm2 restart newsletter-scheduler
```

## Summary

✅ **Installed**: node-cron for scheduling
✅ **Database**: Added `scheduledFor` and `isScheduled` fields  
✅ **UI**: Schedule button and datetime picker
✅ **API**: `/api/newsletters/schedule` endpoint
✅ **Scheduler**: Background process checks every minute
✅ **Production Ready**: Works with Railway, PM2, Docker

The scheduler runs autonomously, processing newsletters at their scheduled time with no manual intervention needed!
