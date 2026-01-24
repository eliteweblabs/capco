#!/bin/bash

# Supascale Podman Fix Script
# Fixes the "short-name resolution enforced but cannot prompt without a TTY" error
# Run with: sudo bash scripts/fix-podman.sh

set -e

REGISTRIES_CONF="/etc/containers/registries.conf"

echo "=================================="
echo "Supascale Podman Registry Fix"
echo "=================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo "Error: This script must be run as root (sudo)"
    echo "Usage: sudo bash $0"
    exit 1
fi

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo "Error: Podman is not installed"
    exit 1
fi

echo "Current Podman version: $(podman --version)"
echo ""

# Backup existing config
if [[ -f "$REGISTRIES_CONF" ]]; then
    BACKUP="${REGISTRIES_CONF}.backup.$(date +%Y%m%d%H%M%S)"
    cp "$REGISTRIES_CONF" "$BACKUP"
    echo "✓ Backed up existing config to: $BACKUP"
fi

# Create or update registries.conf
echo ""
echo "Configuring Podman for Docker Hub compatibility..."

# Check if docker.io is already in unqualified-search-registries
if grep -q 'unqualified-search-registries.*docker.io' "$REGISTRIES_CONF" 2>/dev/null; then
    echo "✓ docker.io is already configured in unqualified-search-registries"
else
    # Add docker.io to unqualified-search-registries
    echo "" >> "$REGISTRIES_CONF"
    echo "# Added by Supascale for Docker Hub compatibility" >> "$REGISTRIES_CONF"
    echo 'unqualified-search-registries = ["docker.io"]' >> "$REGISTRIES_CONF"
    echo "✓ Added docker.io to unqualified-search-registries"
fi

# Change short-name-mode from enforcing to permissive
if grep -q 'short-name-mode.*=.*"enforcing"' "$REGISTRIES_CONF" 2>/dev/null; then
    sed -i 's/short-name-mode.*=.*"enforcing"/short-name-mode = "permissive"/g' "$REGISTRIES_CONF"
    echo "✓ Changed short-name-mode from 'enforcing' to 'permissive'"
elif ! grep -q 'short-name-mode' "$REGISTRIES_CONF" 2>/dev/null; then
    echo 'short-name-mode = "permissive"' >> "$REGISTRIES_CONF"
    echo "✓ Added short-name-mode = permissive"
else
    echo "✓ short-name-mode is already set (not enforcing)"
fi

echo ""
echo "=================================="
echo "Configuration Complete!"
echo "=================================="
echo ""
echo "You can verify the configuration with:"
echo "  podman info --format '{{.Registries.Search}}'"
echo ""
echo "It should show: [docker.io]"
echo ""
echo "Now try starting your project again in Supascale."
