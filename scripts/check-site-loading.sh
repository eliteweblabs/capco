#!/usr/bin/env bash
# Quick check that key pages return 200. Run after making changes to confirm site still loads.
# Usage: ./scripts/check-site-loading.sh [base_url]
# Default base: http://localhost:4321

BASE="${1:-http://localhost:4321}"
PAGES="/ /contact /auth/login"
FAIL=0

for path in $PAGES; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}${path}")
  if [ "$code" = "200" ]; then
    echo "OK $code $path"
  else
    echo "FAIL $code $path"
    FAIL=1
  fi
done

[ $FAIL -eq 0 ] && echo "Site loading check passed." || { echo "Site loading check failed."; exit 1; }
