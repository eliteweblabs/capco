#!/bin/bash
# Load client knowledge based on active site config
# Usage: ./scripts/load-client-knowledge.sh

set -e

# Find config file
if [ -f "site-config.json" ]; then
    CONFIG_FILE="site-config.json"
elif [ -f "public/data/config-*.json" ]; then
    CONFIG_FILE=$(ls public/data/config-*.json | head -1)
else
    echo "❌ No config file found"
    exit 1
fi

# Get config key from filename
CONFIG_KEY=$(basename "$CONFIG_FILE" .json | sed 's/config-//')
CLIENT_KNOWLEDGE="knowledge/clients/${CONFIG_KEY}.md"

if [ -f "$CLIENT_KNOWLEDGE" ]; then
    echo "Loading knowledge: $CLIENT_KNOWLEDGE"
    cat "$CLIENT_KNOWLEDGE"
else
    echo "No knowledge file found: $CLIENT_KNOWLEDGE"
    exit 1
fi