# 🔧 Fallback Mode Configuration

## How to Enable/Disable Fallback Mode

### Method 1: Environment Variable (Recommended)

Add to your `.env` file:

```bash
# Enable fallback mode for development/testing
FALLBACK_MODE=true

# Disable fallback mode for production
FALLBACK_MODE=false
```

### Method 2: Direct Toggle

Edit `src/lib/supabase-fallback.ts` and change:

```typescript
export const FALLBACK_MODE = true; // or false
```

## What Fallback Mode Does

✅ **Provides mock data** when Supabase is unavailable  
✅ **Simulates API responses** for testing new features  
✅ **Allows development** without touching live database  
✅ **Logs all operations** with `[FALLBACK]` prefix

## Available Fallback APIs

- `get-project-statuses-fallback.ts` - Project status configurations
- `get-staff-users-fallback.ts` - Staff/admin user list
- `update-project-fallback/[id].ts` - Project updates (simulated)

## Mock Data Included

- **2 sample projects** (Office Building, Warehouse)
- **5 project statuses** (Submitted → Completed)
- **3 staff users** (Admin, 2 Staff members)
- **3 sample discussions** (with internal/external flags)

## Testing Staff Assignment Emails

In fallback mode:

1. Staff assignments are **simulated** (no DB changes)
2. Email notifications are **still sent** (real emails)
3. Success toasts show **"fallback mode"** indicator
4. All debug logs include **`[FALLBACK]`** prefix

## Switching Back to Live Mode

1. Set `FALLBACK_MODE=false` in `.env`
2. Restart your development server
3. Verify Supabase connectivity with: `curl http://localhost:4321/api/check-supabase-status`

## Benefits for Development

🚀 **Fast iteration** - No database delays  
🔒 **Safe testing** - No risk to production data  
📧 **Email testing** - Real emails with mock data  
🎯 **Feature development** - Test UI changes quickly  
🐛 **Debugging** - Consistent, predictable data

## Production Notes

⚠️ **Never enable in production**  
⚠️ **Always verify FALLBACK_MODE=false before deployment**  
⚠️ **Use for development and staging only**
