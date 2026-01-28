# Project Refresh System - Quick Reference

## TL;DR

Every 5 seconds, the system checks the database for project updates and automatically refreshes elements on the page with a blue flash animation.

## Add Auto-Refresh to Any Element

```astro
<span 
  data-refresh="true"
  data-project-id={project.id}
  data-meta="fieldName"
  data-meta-value={project.fieldName}
>
  {project.fieldName}
</span>
```

## Control the Refresh Manager

```javascript
// Stop
window.projectRefreshManager.stop();

// Start  
window.projectRefreshManager.start();

// Refresh now
window.projectRefreshManager.refreshProject(123);

// Change interval
window.projectRefreshManager = new ProjectRefreshManager({ interval: 10000 });
```

## Listen for Updates

```javascript
document.addEventListener('projectRefreshed', (event) => {
  const { projectId, project } = event.detail;
  // Do something
});
```

## Add New Field to API

In `/src/pages/api/projects/refresh.ts`:

```typescript
return {
  id: project.id,
  yourNewField: project.yourNewField, // Add this line
  // ... other fields
};
```

## Files to Know

- **API**: `/src/pages/api/projects/refresh.ts`
- **Manager**: `/src/lib/project-refresh-manager.ts`
- **Docs**: `/markdowns/polling-refresh-system.md`
- **Summary**: `/markdowns/polling-refresh-implementation-summary.md`

## Currently Auto-Refreshing

- ✅ Punchlist count (ProjectItem)
- ✅ Due date (ProjectItem)

## Debug

Check console for: `📊 [REFRESH]` logs

## Common Issues

**Not updating?** → Check all 4 data attributes are present  
**Too slow?** → Decrease interval (default 5000ms)  
**Too fast/server load?** → Increase interval  
**Wrong format?** → Match `data-meta-value` to API response format
