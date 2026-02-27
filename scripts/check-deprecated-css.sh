#!/usr/bin/env bash
# Check entire project for deprecated or non-standard CSS (in .css and <style> in .astro/html).
# Run: npm run lint:css:deprecated   or   ./scripts/check-deprecated-css.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERNS=(
  "-webkit-overflow-scrolling"
  "-webkit-tap-highlight-color"
)

FOUND=0
for pattern in "${PATTERNS[@]}"; do
  # grep -r: portable (macOS and Linux); no --include so we search all under src
  output=$(grep -rn -- "$pattern" src 2>/dev/null || true)
  if [ -n "$output" ]; then
    if [ $FOUND -eq 0 ]; then
      echo "Deprecated/non-standard CSS usage:"
      echo ""
    fi
    echo "  Pattern: $pattern"
    echo "$output" | sed 's/^/    /'
    echo ""
    FOUND=1
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "No deprecated CSS patterns found."
  exit 0
fi
echo "Consider removing or replacing the above with standard CSS."
exit 1
