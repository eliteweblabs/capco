# CRITICAL PERFORMANCE ISSUE - ProjectItem.astro

## Problem

**Chrome is crashing due to excessive JavaScript execution**

### Root Cause
- `ProjectItem.astro` has **909 lines** including massive inline `<script>` tags
- Each project row creates its OWN copy of the entire script
- With 10 projects = 10 copies of the script (9,090 lines of JS)
- With 50 projects = 50 copies (45,450 lines of JS) **← CRASH**

### Symptoms
- Chrome Error Code 5 (resource/memory exhaustion)
- LCP (Largest Contentful Paint): 17-30 seconds
- Browser becomes unresponsive
- Cannot view source code in DevTools

## Immediate Solutions

### Option 1: Move Scripts to External File (RECOMMENDED)
Extract all script logic from ProjectItem.astro into `/src/scripts/project-item-handlers.js`:

```javascript
// project-item-handlers.js
export function initializeProjectItem(projectId) {
  const row = document.querySelector(`[data-project-id="${projectId}"]`);
  // ... all the logic here
}

// Call once per project instead of embedding entire script
```

### Option 2: Pagination
Limit dashboard to show only 10-20 projects at a time with pagination.

### Option 3: Virtual Scrolling
Only render visible projects in viewport.

## Files to Refactor

1. `/src/components/project/ProjectItem.astro` (909 lines)
   - Extract lines 507-906 (scripts) to external file
   - Keep only template/markup

2. Create `/src/scripts/project-item.ts`
   - Move `updateProjectField()` 
   - Move `adjustDueDate()`
   - Move `renderFileIcons()`
   - Move `updateStaffIcon_*()`
   - Make ONE global instance

3. Update `/src/components/project/ProjectList.astro`
   - Import the script ONCE at top
   - Initialize for each project with project ID only

## Temporary Workarounds

Until refactored:

1. **Reduce console logging** ✅ (Done)
2. **Remove debugging code** ✅ (Done)  
3. **Test with fewer projects** (limit to 5-10)
4. **Use Firefox** (better memory handling than Chrome)

## Performance Target

- LCP should be < 2.5s (currently 17s+)
- Dashboard should load ~50 projects without crash
- Total JS bundle for dashboard < 200KB

## Next Steps

1. Extract scripts from ProjectItem.astro
2. Create singleton project handler
3. Test with 50+ projects
4. Measure performance improvement
