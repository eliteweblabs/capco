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
# SOURCE_SUPABASE_REF = project ref from your Supabase project URL
# SOURCE_SUPABASE_DB_PASSWORD = from Supabase Dashboard > Project Settings > Database
: "${SOURCE_SUPABASE_REF:?Set SOURCE_SUPABASE_REF in clone-site-and-db.env}"
: "${SOURCE_SUPABASE_DB_PASSWORD:?Set SOURCE_SUPABASE_DB_PASSWORD in clone-site-and-db.env}"

# --- Required: Dest Supabase (create new project first at supabase.com) ---
: "${DEST_SUPABASE_REF:?Set DEST_SUPABASE_REF}"
: "${DEST_SUPABASE_DB_PASSWORD:?Set DEST_SUPABASE_DB_PASSWORD}"
: "${DEST_SUPABASE_ANON_KEY:?Set DEST_SUPABASE_ANON_KEY (from Supabase Dashboard > API)}"
: "${DEST_SUPABASE_SERVICE_ROLE_KEY:?Set DEST_SUPABASE_SERVICE_ROLE_KEY}"

# --- Optional: Railway (for env var checklist / manual steps) ---
DEST_RAILWAY_PROJECT_NAME="${DEST_RAILWAY_PROJECT_NAME:-New Client}"
DEST_RAILWAY_DOMAIN="${DEST_RAILWAY_DOMAIN:-}"
GITHUB_REPO="${GITHUB_REPO:-}"
USE_DOCKER_FOR_PG_DUMP="${USE_DOCKER_FOR_PG_DUMP:-1}"
SOURCE_DB_URL="postgresql://postgres:${SOURCE_SUPABASE_DB_PASSWORD}@db.${SOURCE_SUPABASE_REF}.supabase.co:5432/postgres"
DEST_DB_URL="postgresql://postgres:${DEST_SUPABASE_DB_PASSWORD}@db.${DEST_SUPABASE_REF}.supabase.co:5432/postgres"
DUMP_FILE="${SCRIPT_DIR}/clone-dump-$(date +%Y%m%d-%H%M%S).sql"

echo "[clone] Source: $SOURCE_SUPABASE_REF"
echo "[clone] Dest:   $DEST_SUPABASE_REF"
echo "[clone] Dump:   $DUMP_FILE"

# Resolve to IPv4 for Docker (avoids "Network is unreachable" on IPv6)
SOURCE_HOST="db.${SOURCE_SUPABASE_REF}.supabase.co"
DEST_HOST="db.${DEST_SUPABASE_REF}.supabase.co"
SOURCE_IP=""
DEST_IP=""
if command -v dig &>/dev/null; then
  SOURCE_IP=$(dig +short A "$SOURCE_HOST" 2>/dev/null | head -1)
  DEST_IP=$(dig +short A "$DEST_HOST" 2>/dev/null | head -1)
fi
[[ -z "$SOURCE_IP" ]] && SOURCE_IP="$SOURCE_HOST"
[[ -z "$DEST_IP" ]] && DEST_IP="$DEST_HOST"
SOURCE_DOCKER_URL="postgresql://postgres@${SOURCE_IP}:5432/postgres"
DEST_DOCKER_URL="postgresql://postgres@${DEST_IP}:5432/postgres"

# --- Step 1: Dump source database (try Docker, then local pg_dump) ---
echo "[clone] Step 1: Dumping source database..."
DUMP_OK=0

# Try Docker first (use IPv4 to avoid Docker IPv6 issues)
echo "[clone] Trying Docker (postgres:17)..."
if docker run --rm -e PGPASSWORD="$SOURCE_SUPABASE_DB_PASSWORD" postgres:17 \
  pg_dump "$SOURCE_DOCKER_URL" --no-owner --no-acl > "$DUMP_FILE" 2>/dev/null; then
  echo "[clone] Dump complete (Docker): $DUMP_FILE"
  DUMP_OK=1
fi

# Fallback: local pg_dump
if [[ "$DUMP_OK" -eq 0 ]] && command -v pg_dump &>/dev/null; then
  echo "[clone] Docker failed, trying local pg_dump..."
  if pg_dump "$SOURCE_DB_URL" --no-owner --no-acl -f "$DUMP_FILE" 2>/dev/null; then
    echo "[clone] Dump complete (local): $DUMP_FILE"
    DUMP_OK=1
  fi
fi

if [[ "$DUMP_OK" -eq 0 ]]; then
  echo "[clone] ERROR: Dump failed. Try: (1) Start Docker Desktop, or (2) brew install postgresql@17 && export PATH=\"\$(brew --prefix postgresql@17)/bin:\$PATH\""
  exit 1
fi

# --- Step 2: Restore to dest (try Docker, then local psql) ---
echo "[clone] Step 2: Restoring to destination database..."
RESTORE_OK=0

# Try Docker first (use IPv4)
echo "[clone] Trying Docker (postgres:17)..."
if cat "$DUMP_FILE" | docker run --rm -i -e PGPASSWORD="$DEST_SUPABASE_DB_PASSWORD" postgres:17 \
  psql "$DEST_DOCKER_URL" >/dev/null 2>&1; then
  echo "[clone] Restore complete (Docker)"
  RESTORE_OK=1
fi

# Fallback: local psql
if [[ "$RESTORE_OK" -eq 0 ]] && command -v psql &>/dev/null; then
  echo "[clone] Docker failed, trying local psql..."
  if psql "$DEST_DB_URL" -f "$DUMP_FILE" >/dev/null 2>&1; then
    echo "[clone] Restore complete (local)"
    RESTORE_OK=1
  fi
fi

if [[ "$RESTORE_OK" -eq 0 ]]; then
  echo "[clone] ERROR: Restore failed. Try starting Docker or: brew install postgresql@17"
  exit 1
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
