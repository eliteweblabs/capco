#!/bin/bash

# Generate SITE_CONFIG_JSON environment variable value from site-config.json
# Usage: ./scripts/get-site-config-env.sh

if [ ! -f "site-config.json" ]; then
  echo "❌ Error: site-config.json not found"
  exit 1
fi

echo "📋 Generating SITE_CONFIG_JSON environment variable value..."
echo ""
echo "Copy this value and add it to Railway as SITE_CONFIG_JSON:"
echo ""
echo "─────────────────────────────────────────────────────────"
cat site-config.json | jq -c . 2>/dev/null || cat site-config.json | tr -d '\n' | tr -d ' '
echo ""
echo "─────────────────────────────────────────────────────────"
echo ""
echo "💡 To copy to clipboard (macOS):"
echo "   cat site-config.json | jq -c . | pbcopy"
echo ""
echo "💡 To copy to clipboard (Linux):"
echo "   cat site-config.json | jq -c . | xclip -selection clipboard"
echo ""
