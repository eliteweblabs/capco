# SECURITY ALERT: Sensitive Data in Git History

## Issue

The file `supabase/seed.sql.backup` was previously committed to git and contains:

- OAuth access tokens
- Refresh tokens
- Session data

## Immediate Actions Taken

1. ✅ Deleted `supabase/seed.sql.backup` and `supabase/seed_full.sql.backup`
2. ✅ Added backup patterns to `.gitignore`
3. ✅ Staging deletion for commit

## Required Actions

### If this repository is private and not pushed:

Just commit the deletion:

```bash
git add .
git commit -m "Remove sensitive backup files with OAuth tokens"
```

### If this repository has been pushed to a remote:

You MUST remove the file from git history:

#### Option 1: Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo
brew install git-filter-repo  # macOS
# or
pip install git-filter-repo

# Remove file from all history
git filter-repo --path supabase/seed.sql.backup --invert-paths --force

# Force push to all remotes
git push origin --force --all
git push origin --force --tags
```

#### Option 2: Using BFG Repo-Cleaner

```bash
# Install BFG
brew install bfg  # macOS

# Clone a fresh copy
cd /tmp
git clone --mirror YOUR_REPO_URL repo-mirror.git
cd repo-mirror.git

# Remove the file
bfg --delete-files seed.sql.backup

# Clean up and push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### Revoke OAuth Tokens

Since the backup file contained OAuth tokens, you should:

1. **Google OAuth**: Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and revoke any tokens for your OAuth app
2. **Supabase**: If these were production tokens, rotate your Supabase project's JWT secrets

## Prevention

- The `.gitignore` now includes patterns to prevent future backup files from being committed
- Never commit files with `*.backup` extension
- Always review `git status` before committing to catch sensitive files

## Files Now Ignored

```
supabase/seed*.backup
supabase/*.backup
*_full.sql*
```

## Current Status

- ❌ File still exists in git history (commit 87858207)
- ✅ File deleted from working directory
- ✅ Pattern added to .gitignore
- ⚠️ **ACTION REQUIRED**: Remove from git history if pushed to remote

---

Generated: 2026-01-29
