#!/usr/bin/env bash
#
# Clone Site + DB
# Clones a Railway site and Supabase database to create a new deployment.
# Run: ./scripts/clone-site-and-db.sh (after sourcing .env or setting vars below)
#
# Required: Source clone-site-and-db.env or export vars before running.
# See clone-site-and-db.example.env for required variables.
#
set -euo pipefail

# --- Source env file if present ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/clone-site-and-db.env"
if [[ -f "$ENV_FILE" ]]; then
  echo "[clone] Loading env from $ENV_FILE"
  set -a
  source "$ENV_FILE"
  set +a
fi

# --- Required: Source Supabase ---
: "${SOURCE_SUPABASE_REF:?Set SOURCE_SUPABASE_REF (project ref from https://XXX.supabase.co)}"
: "${SOURCE_SUPABASE_DB_PASSWORD:?Set SOURCE_SUPABASE_DB_PASSWORD (from Supabase Dashboard > Project Settings > Database)}"

# --- Required: Dest Supabase (create new project first at supabase.com) ---
: "${DEST_SUPABASE_REF:?Set DEST_SUPABASE_REF}"
: "${DEST_SUPABASE_DB_PASSWORD:?Set DEST_SUPABASE_DB_PASSWORD}"
: "${DEST_SUPABASE_ANON_KEY:?Set DEST_SUPABASE_ANON_KEY (from Supabase Dashboard > API)}"
: "${DEST_SUPABASE_SERVICE_ROLE_KEY:?Set DEST_SUPABASE_SERVICE_ROLE_KEY}"

# --- Optional: Railway (for env var checklist / manual steps) ---
DEST_RAILWAY_PROJECT_NAME="${DEST_RAILWAY_PROJECT_NAME:-New Client}"
DEST_RAILWAY_DOMAIN="${DEST_RAILWAY_DOMAIN:-}"
GITHUB_REPO="${GITHUB_REPO:-}"
USE_DOCKER_FOR_PG_DUMP="${USE_DOCKER_FOR_PG_DUMP:-0}"

SOURCE_DB_URL="postgresql://postgres:${SOURCE_SUPABASE_DB_PASSWORD}@db.${SOURCE_SUPABASE_REF}.supabase.co:5432/postgres"
DEST_DB_URL="postgresql://postgres:${DEST_SUPABASE_DB_PASSWORD}@db.${DEST_SUPABASE_REF}.supabase.co:5432/postgres"
DUMP_FILE="${SCRIPT_DIR}/clone-dump-$(date +%Y%m%d-%H%M%S).sql"

echo "[clone] Source: $SOURCE_SUPABASE_REF"
echo "[clone] Dest:   $DEST_SUPABASE_REF"
echo "[clone] Dump:   $DUMP_FILE"

# --- Step 1: Dump source database ---
echo "[clone] Step 1: Dumping source database..."
if [[ "$USE_DOCKER_FOR_PG_DUMP" == "1" ]]; then
  docker run --rm -e PGPASSWORD="$SOURCE_SUPABASE_DB_PASSWORD" postgres:15 \
    pg_dump "postgresql://postgres@db.${SOURCE_SUPABASE_REF}.supabase.co:5432/postgres" \
    --no-owner --no-acl > "$DUMP_FILE"
else
  if ! command -v pg_dump &>/dev/null; then
    echo "[clone] pg_dump not found. Install: brew install postgresql  (or set USE_DOCKER_FOR_PG_DUMP=1)"
    exit 1
  fi
  pg_dump "$SOURCE_DB_URL" --no-owner --no-acl -f "$DUMP_FILE"
fi

echo "[clone] Dump complete: $DUMP_FILE"

# --- Step 2: Restore to dest ---
echo "[clone] Step 2: Restoring to destination database..."
if [[ "$USE_DOCKER_FOR_PG_DUMP" == "1" ]]; then
  cat "$DUMP_FILE" | docker run --rm -i -e PGPASSWORD="$DEST_SUPABASE_DB_PASSWORD" postgres:15 \
    psql "postgresql://postgres@db.${DEST_SUPABASE_REF}.supabase.co:5432/postgres"
else
  if ! command -v psql &>/dev/null; then
    echo "[clone] psql not found. Install: brew install postgresql  (or set USE_DOCKER_FOR_PG_DUMP=1)"
    exit 1
  fi
  psql "$DEST_DB_URL" -f "$DUMP_FILE"
fi

echo "[clone] Restore complete."

# --- Step 3: Output Railway checklist ---
echo ""
echo "=============================================="
echo "Database clone complete."
echo "=============================================="
echo ""
echo "Next: Set up Railway"
echo "  1. Create new project at railway.app from GitHub repo: ${GITHUB_REPO:-<your-repo>}"
echo "  2. Add these Variables:"
echo ""
echo "RAILWAY_PROJECT_NAME=\"$DEST_RAILWAY_PROJECT_NAME\""
echo "PUBLIC_SUPABASE_URL=\"https://${DEST_SUPABASE_REF}.supabase.co\""
echo "PUBLIC_SUPABASE_PUBLISHABLE=\"$DEST_SUPABASE_ANON_KEY\""
echo "SUPABASE_SECRET=\"$DEST_SUPABASE_SERVICE_ROLE_KEY\""
if [[ -n "$DEST_RAILWAY_DOMAIN" ]]; then
  echo "RAILWAY_PUBLIC_DOMAIN=\"$DEST_RAILWAY_DOMAIN\""
fi
echo ""
echo "See markdowns/MULTI_CLIENT_SETUP_GUIDE.md for full env var checklist."
echo ""
