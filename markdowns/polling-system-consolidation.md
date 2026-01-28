# Polling System Consolidation

**Date**: Jan 28, 2026  
**Issue**: Excessive Disk IO usage causing Railway warning

## Problem

The site had **TWO** polling systems running simultaneously:

1. **ProjectRefreshManager** (`src/lib/project-refresh-manager.ts`)
   - Polling interval: 10 seconds
   - Queries: 4,320 per day (12 hours × 6 per minute)
   - Auto-started on page load
   
2. **Generic RefreshManager** (`src/lib/refresh-manager.ts`)
   - Polling interval: 15 seconds
   - Queries: 2,880 per day
   - (May not have been active)

**Total**: ~7,200+ database queries per day with just **one developer** working 12 hours.

### Impact
- Railway sent Disk IO warning
- One person = ~125,000+ queries per month
- Would struggle to support 10-20 concurrent users on hobby tier
- Not scalable

## Solution

### 1. Disabled ProjectRefreshManager ✅
- **File**: `src/lib/project-refresh-manager.ts`
- Added deprecation warning in header
- Disabled auto-start functionality
- Kept file for reference only

### 2. Removed Import ✅
- **File**: `src/components/ui/App.astro` (line ~2404)
- Commented out import: `import "../../lib/project-refresh-manager"`
- Added note to use generic refresh-manager instead

### 3. Cleaned Up References ✅
- **File**: `src/components/project/ProjectItem.astro`
- Removed 3 references to `projectRefreshManager`:
  - Line 535: `pauseProject()` call
  - Line 598: `resumeProject()` call after save
  - Line 613: `resumeProject()` call on error
- These were unnecessary - the debounced save prevents conflicts

### 4. Increased Generic Interval ✅
- **File**: `src/lib/refresh-manager.ts` (line 23)
- Changed from 15 seconds → **30 seconds**
- Reduces queries by 50%

## Results

### Before
```
ProjectRefreshManager: 6 queries/min = 4,320/day
Generic RefreshManager: 4 queries/min = 2,880/day
Total: ~7,200 queries/day (one developer)
```

### After
```
ProjectRefreshManager: DISABLED = 0/day
Generic RefreshManager: 2 queries/min = 2,880/day
Total: ~2,880 queries/day (one developer)
```

**Reduction**: 60% fewer queries! (~86,400 queries/month vs ~125,000+)

## Next Steps (Recommended)

### Short-term
1. ✅ Switch to local Supabase for development (already configured in `.env`)
2. Monitor disk IO usage on production
3. Consider increasing interval to 60s for production

### Long-term
Replace polling entirely with **Supabase Realtime subscriptions**:

```typescript
// Example: Listen for changes instead of polling
supabase
  .channel('projects')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'projects' },
    (payload) => {
      // Update UI only when data actually changes
      refreshManager.updateField(payload.new);
    }
  )
  .subscribe();
```

Benefits:
- **Zero wasted queries** - only updates when data changes
- **True real-time** - instant updates, not 30s delay
- **Scales to hundreds of users** - no polling overhead
- **Lower costs** - minimal database load

## Files Modified

1. `src/lib/project-refresh-manager.ts` - Deprecated
2. `src/components/ui/App.astro` - Removed import
3. `src/components/project/ProjectItem.astro` - Removed references
4. `src/lib/refresh-manager.ts` - Increased interval to 30s

## Testing

After deploying:
1. Verify no console errors about missing `projectRefreshManager`
2. Check that project fields still auto-update (every 30s now)
3. Monitor Railway Disk IO metrics
4. Should see ~60% reduction in database queries

## Related Documentation

- `markdowns/complete-polling-system-final.md` - Original polling system docs
- `markdowns/refresh-quick-reference.md` - How to use refresh system
- `markdowns/polling-refresh-system.md` - Implementation details
