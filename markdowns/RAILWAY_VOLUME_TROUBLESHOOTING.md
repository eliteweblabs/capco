# Railway Volume Mount Path Troubleshooting

## Common Issues with Red Validation Errors

### Issue 1: Mount Path Format

Railway requires:
- ✅ **Absolute path** starting with `/`
- ✅ **No trailing slash** (use `/app/content` not `/app/content/`)
- ✅ **Valid directory name** (no special characters except `-` and `_`)

**Try these paths:**
- `/app/content-persistent` ✅
- `/app/data/content` ✅
- `/data/content` ✅
- `/app/content` ✅

**Avoid:**
- `content-persistent` ❌ (not absolute)
- `/app/content-persistent/` ❌ (trailing slash)
- `/app/content persistent` ❌ (spaces)

### Issue 2: Path Conflicts

The mount path cannot conflict with:
- Your working directory (`/app`)
- System directories (`/bin`, `/etc`, `/usr`)
- Existing volume mounts

**Solution:** Use a subdirectory:
- Instead of `/app`, use `/app/data` or `/app/storage`

### Issue 3: Volume Name Already Exists

If you see red text, the volume name might already be taken.

**Solution:**
- Use a unique name: `content-storage-{your-project-name}`
- Or check existing volumes and delete/reuse

### Issue 4: Railway UI Validation

Sometimes Railway's UI is strict about paths.

**Try this step-by-step:**

1. **Volume Name Field:**
   ```
   content-storage
   ```
   (no spaces, lowercase, hyphens OK)

2. **Mount Path Field:**
   ```
   /app/content-persistent
   ```
   (absolute path, no trailing slash)

3. **Size:** 
   ```
   1
   ```
   (GB, minimum 1)

### Quick Fix: Try Alternative Paths

If `/app/content-persistent` shows red, try:

1. `/app/data/content`
2. `/app/storage/content`  
3. `/data/content`
4. `/app/persistent-content`

Then update your code to match:

```typescript
// In src/lib/content.ts
const volumePath = "/app/data/content/pages"; // Match your mount path
```

### Verify Setup

After creating the volume:

1. Check it appears in the Volumes list
2. Verify mount path matches what you entered
3. Deploy and check logs for volume mount confirmation

### If Still Red

1. **Clear the field** completely
2. **Type fresh**: `/app/content-persistent`
3. **Check for hidden characters** (copy/paste can introduce issues)
4. **Try a simpler path** first: `/app/content`
5. **Check Railway status** - sometimes UI bugs, refresh page

### Alternative: Use Railway CLI

If UI keeps showing red, create volume via CLI:

```bash
railway volume create \
  --name content-storage \
  --mount-path /app/content-persistent \
  --size 1
```

Then attach to your service in the dashboard.

