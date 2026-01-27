# Projects API Refactoring

## Summary

Consolidated duplicate code between `src/lib/api/_projects.ts` and `src/pages/api/projects/get.ts`.

## Changes Made

### 1. Enhanced `_projects.ts` Functions

#### `fetchProjectById()` - Now includes options
- Added `options` parameter with `includeFiles` and `includeInvoice` flags
- Handles file fetching (previously only in get.ts)
- Handles invoice fetching (previously only in get.ts)
- Returns consistent data structure with `author`, `assignedTo`, `authorProfile`, `assignedToProfile`
- Includes punchlist stats

#### `fetchProjects()` - Now includes file support
- Added `options` parameter with `includeFiles` flag
- Efficiently fetches all files for multiple projects in ONE query (vs N queries before)
- Groups files by projectId
- Returns consistent data structure

### 2. Simplified `get.ts` API Endpoint

#### Single Project Fetch
- **Before**: 120+ lines of duplicate logic
- **After**: 1 function call to `fetchProjectById()` with options

#### Multiple Projects Fetch
- **Before**: Used `Promise.all()` with N separate queries for profiles and files
- **After**: Single bulk query for profiles, single bulk query for files
- **Performance**: O(1) queries instead of O(N) queries

### 3. Performance Improvements

- **Profile Fetching**: One query for all profiles (was N queries)
- **File Fetching**: One query for all files (was N queries)
- **Files Grouping**: Done in memory after single query (efficient)

### 4. Benefits

✅ Eliminated ~200 lines of duplicate code
✅ Single source of truth for project fetching logic
✅ Better performance (fewer database queries)
✅ Easier to maintain and update
✅ Consistent data structure across all endpoints
✅ TypeScript type safety maintained

## Files Modified

- `src/lib/api/_projects.ts` - Enhanced with options and file fetching
- `src/pages/api/projects/get.ts` - Simplified to use shared functions
- `src/components/project/Dashboard.astro` - Fixed import path

## Migration Notes

All existing code using these functions will continue to work:
- `fetchProjects()` works without options (backward compatible)
- `fetchProjectById()` works without options (backward compatible)
- API responses maintain same structure
