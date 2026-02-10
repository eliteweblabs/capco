#!/bin/sh

# Initialize persistent content volume with default content
# This script runs during Docker build to populate the volume on first deploy

# Resolve script dir so we can find init-content.sh regardless of CWD (e.g. in Docker)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📦 [CONTENT-INIT] Initializing persistent content volume..."

VOLUME_PATH="/data/content"
PAGES_PATH="$VOLUME_PATH/pages"

# Create directory structure (may fail if volume not mounted or no write permission)
if ! mkdir -p "$PAGES_PATH" 2>/dev/null; then
  echo "⚠️ [CONTENT-INIT] Cannot create $PAGES_PATH (volume not mounted or read-only), skipping"
  exit 0
fi

# Check if volume already has content (subsequent deployments)
if [ -f "$PAGES_PATH/home.md" ]; then
  echo "✅ [CONTENT-INIT] Volume already contains content, skipping initialization"
  exit 0
fi

echo "🔄 [CONTENT-INIT] Volume is empty, copying default content..."

# Copy default content from git to volume (if it exists)
if [ -d "content/pages" ]; then
  echo "📋 [CONTENT-INIT] Copying content from git..."
  cp -r content/pages/*.md "$PAGES_PATH/" 2>/dev/null || true
fi

# If no git content, use init-content.sh to generate defaults (only if bash exists - Alpine has no bash)
if [ ! -f "$PAGES_PATH/home.md" ]; then
  echo "📝 [CONTENT-INIT] Generating default content..."
  if [ -f "$SCRIPT_DIR/init-content.sh" ] && [ -x "/bin/bash" ]; then
    chmod +x "$SCRIPT_DIR/init-content.sh"
    # Redirect output to volume instead of content/
    CONTENT_DIR="$VOLUME_PATH" "$SCRIPT_DIR/init-content.sh" default || true
  fi
  # Fallback if init-content.sh not run or failed (e.g. Alpine container has no bash)
  if [ ! -f "$PAGES_PATH/home.md" ]; then
    cat > "$PAGES_PATH/home.md" <<'EOF'
---
title: "Welcome"
description: "Welcome to our site"
template: "fullwidth"
---

# Welcome

Default home page content.
EOF
  fi
fi

echo "✅ [CONTENT-INIT] Persistent content initialized"
if [ -d "$PAGES_PATH" ]; then
  ls -la "$PAGES_PATH/"
else
  echo "⚠️ [CONTENT-INIT] $PAGES_PATH not present (volume may not be mounted)"
fi
