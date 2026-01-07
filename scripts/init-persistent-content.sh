#!/bin/sh

# Initialize persistent content volume with default content
# This script runs during Docker build to populate the volume on first deploy

echo "📦 [CONTENT-INIT] Initializing persistent content volume..."

VOLUME_PATH="/data/content"
PAGES_PATH="$VOLUME_PATH/pages"

# Create directory structure
mkdir -p "$PAGES_PATH"

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

# If no git content, use init-content.sh to generate defaults
if [ ! -f "$PAGES_PATH/home.md" ]; then
  echo "📝 [CONTENT-INIT] Generating default content..."
  if [ -f "scripts/init-content.sh" ]; then
    chmod +x scripts/init-content.sh
    # Redirect output to volume instead of content/
    CONTENT_DIR="$VOLUME_PATH" scripts/init-content.sh default || true
  else
    # Create minimal default home.md
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
ls -la "$PAGES_PATH/"
