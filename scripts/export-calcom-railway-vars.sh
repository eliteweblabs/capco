#!/bin/bash
# Export env vars from Cal.com production Railway project
# https://calcom-web-app-production-0b16.up.railway.app
#
# Prerequisites:
#   1. Run: railway login --browserless
#   2. Ensure Railway CLI is installed: https://docs.railway.com/guides/cli
#
# Usage:
#   ./scripts/export-calcom-railway-vars.sh

OUTPUT_FILE="${1:-/tmp/calcom-production-vars.env}"

echo "Exporting Cal.com Railway variables..."
echo "You'll be prompted to select the project (choose calcom-web-app-production)"
echo ""

# Must be run from a directory - use /tmp to avoid affecting rothcobuilt link
WORK_DIR="/tmp/calcom-export-$$"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR" || exit 1

# Link to Cal.com project (interactive - select calcom-web-app-production)
railway link || { rm -rf "$WORK_DIR"; exit 1; }

# Export variables in KEY=VALUE format (run in linked dir)
railway variable list --kv > "$OUTPUT_FILE" 2>/dev/null

# Cleanup work dir
cd - >/dev/null || true
rm -rf "$WORK_DIR"

if [[ -s "$OUTPUT_FILE" ]]; then
  echo "✅ Variables exported to: $OUTPUT_FILE"
  wc -l < "$OUTPUT_FILE" | xargs echo "   Variables count:"
else
  echo "❌ Export failed or no variables found"
  exit 1
fi
