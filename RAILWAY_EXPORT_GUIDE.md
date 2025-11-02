# 📥 Pull Railway Workspace Configuration

This guide shows you how to export/download your entire Railway workspace configuration, including all environment variables.

## Quick Start

1. **Link to your Railway project** (if not already linked):
   ```bash
   railway link
   ```
   Select your project from the list (e.g., "CAPCO Design Group")

2. **Run the export script**:
   ```bash
   ./scripts/pull-railway-workspace.sh
   ```

3. **Find your exported files** in the `railway-export-YYYYMMDD-HHMMSS/` directory

## What Gets Exported

- ✅ **All environment variables** (JSON and Key=Value formats)
- ✅ **Project status** and configuration
- ✅ **List of all Railway projects**
- ✅ **Summary README** with usage instructions

## Export Files

The script creates a timestamped directory with:

```
railway-export-20251102-001234/
├── variables.json          # All variables in JSON format
├── variables.kv             # All variables in Key=Value format (.env style)
├── project-status.txt       # Current project information
├── projects-list.json       # All Railway projects
└── README.md                # Usage instructions
```

## Manual Export (Alternative)

If you prefer to export manually:

### Export Variables (JSON)
```bash
railway variables --json > railway-variables.json
```

### Export Variables (Key=Value format)
```bash
railway variables --kv > railway-variables.kv
```

### Export to .env file
```bash
railway variables --kv > .env.railway
# Then manually review and clean up
```

## Using Exported Variables

### Import to a New Railway Project

1. Link to the new project:
   ```bash
   railway link <new-project-id>
   ```

2. Set variables from the export:
   ```bash
   # Read each line from the KV file and set it
   while IFS='=' read -r key value; do
     railway variables --set "$key=$value"
   done < railway-export-*/variables.kv
   ```

### Restore to Local Development

```bash
# Copy to your .env file (review first!)
cp railway-export-*/variables.kv .env.local

# Edit to remove Railway-specific variables:
# - Remove RAILWAY_* variables (except RAILWAY_PUBLIC_DOMAIN if needed)
# - Remove service-specific variables you don't need locally
# - Keep database URLs, API keys, etc.
```

## Important Notes

⚠️ **Security**:
- Exported files contain **sensitive credentials** (API keys, passwords, secrets)
- **NEVER commit** these files to git (they're already in .gitignore)
- Store securely and delete when no longer needed
- Use encryption for long-term storage

⚠️ **Railway-Specific Variables**:
Some variables won't work outside Railway:
- `${{RAILWAY_PUBLIC_DOMAIN}}` - Only available in Railway
- `${{RAILWAY_PRIVATE_DOMAIN}}` - Only available in Railway
- Service references like `plausible-db:5432` - Only work within Railway network

⚠️ **Service-Specific Variables**:
Some variables are tied to specific services. Check Railway dashboard → Variables → Service dropdown to see which service each variable belongs to.

## Troubleshooting

### "Project not found. Run railway link"
- Make sure you're logged in: `railway login`
- Link to a project: `railway link`
- Or link to a specific project: `railway link <project-id>`

### "No variables found"
- Check you're linked to the correct project: `railway status`
- Verify variables exist in Railway dashboard
- Try exporting with service flag: `railway variables --service <service-name> --json`

### Variables missing after export
- Some variables might be service-specific
- Export per service: `railway variables --service <service-name> --json`
- Check Railway dashboard to see which variables belong to which service

## Railway CLI Commands Reference

```bash
# Authentication
railway login
railway whoami

# Project management
railway link [project-id]     # Link to a project
railway list                   # List all projects
railway status                 # Show current project status

# Variables
railway variables              # Show all variables
railway variables --json       # Export as JSON
railway variables --kv         # Export as Key=Value
railway variables --service X  # Show variables for specific service

# View/Export
railway open                   # Open Railway dashboard
railway logs                   # View deployment logs
```

## Alternative: Railway Dashboard Export

You can also manually export variables from Railway Dashboard:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Go to **Variables** tab
4. Click **"..."** menu → **Export** (if available)
5. Copy variables manually

**Note**: Railway Dashboard doesn't have a built-in "Export All" feature, which is why the CLI script is useful!




