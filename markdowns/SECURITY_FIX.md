# 🚨 CRITICAL SECURITY FIX - Exposed Secrets

## Issue
Commit `978c9e2` exposed sensitive credentials in `calcom-export-20251123-200842/` directory:
- Resend API Key
- Database Password  
- NEXTAUTH_SECRET
- CALENDSO_ENCRYPTION_KEY
- VAPI_API_KEY

## Immediate Actions Required

### 1. Remove Files from Git History

**Option A: Using git-filter-repo (Recommended)**
```bash
# Install git-filter-repo first
pip install git-filter-repo

# Remove the directory from all git history
git filter-repo --path calcom-export-20251123-200842/ --invert-paths

# Force push to remote (WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

**Option B: Using BFG Repo-Cleaner**
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-folders calcom-export-20251123-200842
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

**Option C: Manual git filter-branch**
```bash
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch calcom-export-20251123-200842' \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

### 2. Rotate All Exposed Secrets

#### Resend API Key
1. Go to https://resend.com/api-keys
2. Revoke key: `re_HY32mGph_EZW1cR77aFPHbxMzuqVnJZ1t`
3. Create new API key
4. Update in Railway/environment variables

#### Database Password
1. Change Railway PostgreSQL password
2. Update `DATABASE_URL` and `DATABASE_DIRECT_URL` in Railway

#### NEXTAUTH_SECRET
1. Generate new secret: `openssl rand -base64 32`
2. Update in Railway: `NEXTAUTH_SECRET`

#### CALENDSO_ENCRYPTION_KEY  
1. Generate new key: `openssl rand -base64 32`
2. Update in Railway: `CALENDSO_ENCRYPTION_KEY`
3. **WARNING**: This will decrypt existing encrypted data - backup first!

#### VAPI_API_KEY
1. Go to VAPI dashboard
2. Revoke key: `77cb0a47-2427-44ac-996d-e6ed2ca03bbf`
3. Generate new API key
4. Update in Railway: `VAPI_API_KEY`

### 3. Verify .gitignore
The `.gitignore` has been updated to exclude `calcom-export-*/` directories.

### 4. Check for Other Exposed Secrets
Run GitGuardian scan or similar tool to check for other exposed secrets.

## Prevention
- Never commit export files containing credentials
- Use environment variables for all secrets
- Add export directories to .gitignore before committing
- Use pre-commit hooks to scan for secrets

