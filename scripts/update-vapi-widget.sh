#!/bin/bash

# Update VAPI Widget Script
# Downloads the latest version of the VAPI widget from CDN

WIDGET_URL="https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js"
LOCAL_PATH="public/js/vapi-widget.umd.js"
BACKUP_PATH="public/js/vapi-widget.umd.js.backup"

echo "🔄 Updating VAPI Widget Script..."
echo "======================================"
echo ""

# Check if existing file exists
if [ -f "$LOCAL_PATH" ]; then
    echo "📦 Backing up existing file..."
    cp "$LOCAL_PATH" "$BACKUP_PATH"
    echo "   ✅ Backup created: $BACKUP_PATH"
    echo ""
fi

# Download new version
echo "⬇️  Downloading latest version from CDN..."
if curl -L -f -o "$LOCAL_PATH" "$WIDGET_URL" 2>&1; then
    FILE_SIZE=$(ls -lh "$LOCAL_PATH" | awk '{print $5}')
    echo "   ✅ Download complete: $FILE_SIZE"
    echo ""
    
    # Verify it's valid JavaScript
    if head -c 100 "$LOCAL_PATH" | grep -q "function\|var\|const\|let"; then
        echo "✅ File appears to be valid JavaScript"
        
        # Remove backup if download was successful
        if [ -f "$BACKUP_PATH" ]; then
            rm "$BACKUP_PATH"
            echo "🗑️  Removed backup (download successful)"
        fi
    else
        echo "❌ Downloaded file doesn't appear to be valid JavaScript!"
        echo "⚠️  Restoring backup..."
        
        if [ -f "$BACKUP_PATH" ]; then
            mv "$BACKUP_PATH" "$LOCAL_PATH"
            echo "   ✅ Backup restored"
        fi
        exit 1
    fi
else
    echo "❌ Download failed!"
    echo ""
    
    # Restore backup if download failed
    if [ -f "$BACKUP_PATH" ]; then
        echo "⚠️  Restoring backup..."
        mv "$BACKUP_PATH" "$LOCAL_PATH"
        echo "   ✅ Backup restored"
    fi
    
    echo ""
    echo "Possible reasons for failure:"
    echo "- CDN is blocked by firewall"
    echo "- Network connectivity issues"
    echo "- CDN is temporarily unavailable"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Update complete!"
echo ""
echo "The widget script is now up to date."
echo "Restart your dev server if it's running."
