#!/usr/bin/env bash
# Batch fix broken imports - components that moved from common/ to ui/ or form/
# Run from project root: ./scripts/fix-broken-imports.sh
#
# Add new wrong->right mappings to the fixes array as components are reorganized.

set -e
cd "$(dirname "$0")/.."

# Replace wrong path segment with correct one (path prefix like ../ stays the same)
fixes=(
  "common/UserIcon.astro|ui/UserIcon.astro"
  "common/Tooltip.astro|ui/Tooltip.astro"
  "common/NumberStepper.astro|form/NumberStepper.astro"
)

count=0
for mapping in "${fixes[@]}"; do
  wrong="${mapping%%|*}"
  right="${mapping#*|}"
  echo "Fixing $wrong -> $right"
  while IFS= read -r f; do
    if [[ -f "$f" ]]; then
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|$wrong|$right|g" "$f"
      else
        sed -i "s|$wrong|$right|g" "$f"
      fi
      echo "  Updated: $f"
      ((count++)) || true
    fi
  done < <(grep -r -l "$wrong" src --include="*.astro" --include="*.ts" --include="*.tsx" 2>/dev/null || true)
done

echo "Done. Fixed $count files."
