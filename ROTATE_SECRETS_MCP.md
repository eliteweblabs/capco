# 🔐 Secret Rotation via Railway & Supabase MCP

## Exposed Secrets (Commit 978c9e2)
- ✅ Resend API Key: `re_HY32mGph_EZW1cR77aFPHbxMzuqVnJZ1t`
- ✅ Database Password: `lufrxnscQtSvxKcHfCGHWWujIfIbuoPV`
- ✅ NEXTAUTH_SECRET: `/SCksXir+IDf0EQHTGPAnNWbyJTAoiAL=`
- ⚠️ CALENDSO_ENCRYPTION_KEY: `RUz5gpR+GS/kAL2PTuKqg8hpnKcxXJ5j=` (WARNING: Will decrypt existing data!)
- ✅ VAPI_API_KEY: `77cb0a47-2427-44ac-996d-e6ed2ca03bbf`

## Generated New Secrets
- NEXTAUTH_SECRET: `GachqUFYL+tMUfbit7h7gQnmVMeDeFY+fknM8liY6Uw=`
- CALENDSO_ENCRYPTION_KEY: `ixnxwRVZQjvOgU0tbB6DixhZG3kDY5mpYMop15A5Wng=`

## Rotation Steps

### 1. External API Keys (Manual - Must be done first)

#### Resend API Key
1. Go to https://resend.com/api-keys
2. Revoke: `re_HY32mGph_EZW1cR77aFPHbxMzuqVnJZ1t`
3. Create new API key
4. **Then** update Railway variable (see below)

#### VAPI API Key  
1. Go to VAPI dashboard
2. Revoke: `77cb0a47-2427-44ac-996d-e6ed2ca03bbf`
3. Generate new API key
4. **Then** update Railway variable (see below)

### 2. Database Password (Manual - Change in Railway first)
1. Go to Railway → Postgres service → Settings → Change Password
2. Update `DATABASE_URL` and `DATABASE_DIRECT_URL` variables

### 3. Railway Variables (Can be done via MCP)

After completing steps 1-2, use Railway MCP tools to update:

```bash
# NEXTAUTH_SECRET (ready to update)
railway variables set NEXTAUTH_SECRET="GachqUFYL+tMUfbit7h7gQnmVMeDeFY+fknM8liY6Uw=" --service cal.com

# CALENDSO_ENCRYPTION_KEY (WARNING: Will decrypt existing encrypted data!)
railway variables set CALENDSO_ENCRYPTION_KEY="ixnxwRVZQjvOgU0tbB6DixhZG3kDY5mpYMop15A5Wng=" --service cal.com

# EMAIL_SERVER_PASSWORD (after rotating Resend key)
railway variables set EMAIL_SERVER_PASSWORD="NEW_RESEND_KEY_HERE" --service cal.com

# VAPI_API_KEY (after rotating VAPI key)
railway variables set VAPI_API_KEY="NEW_VAPI_KEY_HERE" --service cal.com
```

### 4. Supabase

The exposed secrets don't include Supabase-specific keys, but you should verify:
- Check Supabase project settings
- Ensure no Supabase service role keys were exposed
- Review RLS policies if database was compromised

## ⚠️ Critical Warnings

1. **CALENDSO_ENCRYPTION_KEY**: Changing this will decrypt all existing encrypted data in Cal.com. Backup first!
2. **Database Password**: Update in Railway PostgreSQL settings BEFORE updating DATABASE_URL
3. **External Keys**: Must be revoked in their dashboards first, then updated in Railway

## Next Steps

1. Rotate external API keys (Resend, VAPI) in their dashboards
2. Change database password in Railway
3. Use Railway MCP tools to update variables (see commands above)
4. Remove secrets from git history (see SECURITY_FIX.md)

