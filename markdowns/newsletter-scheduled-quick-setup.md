# Quick Setup: Scheduled Newsletters

## 1. Run Database Migration

```bash
psql -d your_database < sql-queriers/migrate-newsletters-add-scheduling.sql
```

## 2. Start the Scheduler (Development)

```bash
npm run newsletter:scheduler
```

Keep this running in a separate terminal while testing.

## 3. Test It Out

1. Go to `/admin/newsletters`
2. Create a new newsletter
3. Turn OFF draft mode, keep it active
4. Save the newsletter
5. Click the "Schedule" button
6. Enter a time 2-3 minutes from now: `2026-01-24 12:30`
7. Watch the scheduler logs - it will send automatically!

## 4. Production Deployment

### Railway (Easiest)

Create `Procfile` in project root:

```
web: npm run start
scheduler: npm run newsletter:scheduler
```

Push to GitHub, Railway will auto-detect and run both processes.

### Alternative: PM2 (VPS)

```bash
pm2 start npm --name "newsletter-scheduler" -- run newsletter:scheduler
pm2 save
pm2 startup
```

## That's It!

Your newsletters will now send automatically at the scheduled time. The scheduler checks every minute for newsletters ready to go.

## Environment Variables Required

```bash
PUBLIC_SUPABASE_URL=...
SUPABASE_SECRET=...
PUBLIC_SITE_URL=...
EMAIL_API_KEY=...
FROM_EMAIL=...
FROM_NAME=...
```

All should already be configured if your app is working!
