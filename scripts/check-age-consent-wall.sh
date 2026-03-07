#!/usr/bin/env bash
# Verify age consent wall appears when plugins.ageConsent is true.
# Usage: ./scripts/check-age-consent-wall.sh [base_url]
# Use ?showAgeWall=1 to force show (bypasses localStorage).

BASE="${1:-http://localhost:4321}"
URL="${BASE}/?showAgeWall=1"

echo "Checking age consent wall at: $URL"
HTML=$(curl -sL "$URL")

if echo "$HTML" | grep -q 'id="age-consent-wall"'; then
  echo "✅ Age consent wall element found in HTML"
  if echo "$HTML" | grep -q 'data-age-consent-given'; then
    echo "⚠️  data-age-consent-given is set (wall would be hidden by CSS)"
  else
    echo "✅ No data-age-consent-given (wall will be visible)"
  fi
  exit 0
else
  echo "❌ Age consent wall element NOT found"
  echo "   Check: 1) plugins.ageConsent in config, 2) not on /contact or /auth, 3) config file loads (RAILWAY_PROJECT_NAME)"
  exit 1
fi
