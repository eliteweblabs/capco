#!/bin/bash

# Pull Railway Workspace Configuration
# This script exports all Railway variables and configuration for the current project

echo "📥 Pulling Railway workspace configuration..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "⚠️  Not logged in. Running 'railway login'..."
    railway login
fi

# Create output directory
OUTPUT_DIR="railway-export-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"
echo "📁 Export directory: $OUTPUT_DIR"

# Check if project is linked
if ! railway status &> /dev/null; then
    echo "⚠️  No project linked. Available projects:"
    railway list
    echo ""
    echo "🔗 Please link to a project first:"
    echo "   railway link"
    echo ""
    echo "   OR specify a project ID:"
    echo "   railway link <project-id>"
    exit 1
fi

# Get project info
echo "📊 Getting project information..."
railway status > "$OUTPUT_DIR/project-status.txt" 2>&1
echo "✅ Project status saved to $OUTPUT_DIR/project-status.txt"

# Export all variables (JSON format)
echo "📝 Exporting environment variables..."
railway variables --json > "$OUTPUT_DIR/variables.json" 2>&1

# Also export in KV format for easier reading
railway variables --kv > "$OUTPUT_DIR/variables.kv" 2>&1
echo "✅ Variables exported to:"
echo "   - $OUTPUT_DIR/variables.json (JSON format)"
echo "   - $OUTPUT_DIR/variables.kv (Key=Value format)"

# Export variables per service (if multiple services)
echo "🔍 Checking for services..."
SERVICES=$(railway status 2>/dev/null | grep -i "service" || echo "")

if [ ! -z "$SERVICES" ]; then
    echo "📦 Found multiple services. Exporting variables per service..."
    mkdir -p "$OUTPUT_DIR/services"
    
    # Try to get service list (this might vary by Railway CLI version)
    # For now, we'll export project-level variables
    railway variables > "$OUTPUT_DIR/services/all-services-variables.txt" 2>&1
fi

# Export project information
echo "📋 Exporting project details..."
railway list --json > "$OUTPUT_DIR/projects-list.json" 2>&1 || railway list > "$OUTPUT_DIR/projects-list.txt" 2>&1

# Create a summary file
echo "📄 Creating summary..."
cat > "$OUTPUT_DIR/README.md" << EOF
# Railway Workspace Export

Generated: $(date)

## Files

- \`variables.json\` - All environment variables in JSON format
- \`variables.kv\` - All environment variables in Key=Value format (for .env files)
- \`project-status.txt\` - Current project status and information
- \`projects-list.json\` or \`projects-list.txt\` - List of all Railway projects

## Usage

### Import variables to a new project:

\`\`\`bash
# Option 1: Use the KV file with railway CLI
railway variables --set "\$(cat variables.kv)"

# Option 2: Manually set variables from the JSON file
# Open variables.json and set each variable
railway variables --set "KEY=VALUE"
\`\`\`

### Restore to local .env file:

\`\`\`bash
cp variables.kv .env
# Then edit .env to remove any Railway-specific variables you don't need locally
\`\`\`

## Important Notes

- **Sensitive values**: All variable values are exported. Keep this directory secure!
- **Service-specific variables**: Some variables may be service-specific. Check Railway dashboard for details.
- **Railway references**: Variables like \`\${{RAILWAY_PUBLIC_DOMAIN}}\` are Railway-specific and won't work locally.

EOF

echo ""
echo "✅ Export complete!"
echo ""
echo "📁 Files saved to: $OUTPUT_DIR"
echo ""
echo "⚠️  SECURITY WARNING: These files contain sensitive credentials!"
echo "   - Keep them secure and don't commit to git"
echo "   - Consider adding to .gitignore: railway-export-*/"
echo ""
echo "📖 See $OUTPUT_DIR/README.md for usage instructions"



