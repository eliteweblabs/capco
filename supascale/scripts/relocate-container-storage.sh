#!/bin/bash
#
# Relocate Podman Container Storage
#
# This script moves Podman's container storage from the default location
# (/var/lib/containers/storage) to a new location with more disk space.
#
# Usage: sudo ./relocate-container-storage.sh [new-path]
# Example: sudo ./relocate-container-storage.sh /data/containers/storage
#
# WARNING: This will remove all existing container images and containers.
# Projects will need to re-pull their images on next start.
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root"
    echo "Usage: sudo $0 [new-storage-path]"
    exit 1
fi

# Check for Podman
if ! command -v podman &> /dev/null; then
    print_error "Podman is not installed. This script is only for Podman systems."
    exit 1
fi

# Get current storage location
CURRENT_STORAGE=$(podman info --format '{{.Store.GraphRoot}}' 2>/dev/null || echo "/var/lib/containers/storage")
DEFAULT_NEW_PATH="/data/containers/storage"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "           Podman Container Storage Relocation Tool"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Current storage location: $CURRENT_STORAGE"

# Show current disk usage
current_used=$(du -sh "$CURRENT_STORAGE" 2>/dev/null | cut -f1 || echo "N/A")
echo "Current storage usage: $current_used"
echo ""

# Check /var partition space
var_avail=$(df -BG /var 2>/dev/null | awk 'NR==2 {gsub("G",""); print $4}')
if [[ -n "$var_avail" ]]; then
    echo "Available space on /var: ${var_avail}GB"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get new storage path
if [[ -n "$1" ]]; then
    NEW_STORAGE="$1"
else
    read -e -p "Enter new storage path [$DEFAULT_NEW_PATH]: " NEW_STORAGE
    NEW_STORAGE=${NEW_STORAGE:-$DEFAULT_NEW_PATH}
fi

# Validate new path
if [[ "$NEW_STORAGE" == "$CURRENT_STORAGE" ]]; then
    print_error "New path is the same as current storage location"
    exit 1
fi

# Check if new location has enough space
new_dir=$(dirname "$NEW_STORAGE")
if [[ -d "$new_dir" ]]; then
    new_avail=$(df -BG "$new_dir" 2>/dev/null | awk 'NR==2 {gsub("G",""); print $4}')
    if [[ -n "$new_avail" ]]; then
        echo "Available space at new location: ${new_avail}GB"
        if [[ "$new_avail" -lt 15 ]]; then
            print_warning "Less than 15GB available. Supabase needs ~10-15GB for images."
            read -e -p "Continue anyway? [y/N]: " CONTINUE
            if [[ ! "$CONTINUE" =~ ^[Yy] ]]; then
                exit 0
            fi
        fi
    fi
fi

echo ""
print_warning "This operation will:"
echo "  1. Stop all running containers"
echo "  2. Remove all existing container images and containers"
echo "  3. Configure Podman to use the new storage location"
echo "  4. Images will be re-downloaded when projects are started"
echo ""
read -e -p "Are you sure you want to continue? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy] ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# Step 1: Stop all containers
print_status "Stopping all containers..."
podman stop -a 2>/dev/null || true
print_success "Containers stopped"

# Step 2: Create new storage directory
print_status "Creating new storage directory..."
mkdir -p "$NEW_STORAGE"
chown root:root "$NEW_STORAGE"
chmod 755 "$NEW_STORAGE"
print_success "Created $NEW_STORAGE"

# Step 3: Backup and update storage.conf
STORAGE_CONF="/etc/containers/storage.conf"
print_status "Updating storage configuration..."

if [[ -f "$STORAGE_CONF" ]]; then
    cp "$STORAGE_CONF" "${STORAGE_CONF}.bak.$(date +%Y%m%d%H%M%S)"
    print_status "Backed up existing config to ${STORAGE_CONF}.bak.*"
fi

cat > "$STORAGE_CONF" << EOF
# Podman storage configuration
# Modified by relocate-container-storage.sh on $(date)
# Previous location: $CURRENT_STORAGE
# New location: $NEW_STORAGE

[storage]
driver = "overlay"
graphroot = "$NEW_STORAGE"
runroot = "/run/containers/storage"

[storage.options]
additionalimagestores = []
size = ""

[storage.options.overlay]
mountopt = "nodev,metacopy=on"
EOF

print_success "Updated $STORAGE_CONF"

# Step 4: Reset Podman to apply new storage
print_status "Resetting Podman storage (this clears all images)..."
podman system reset --force 2>/dev/null || true
print_success "Podman storage reset complete"

# Step 5: Clean up old storage (optional)
echo ""
read -e -p "Remove old storage at $CURRENT_STORAGE to free space? [y/N]: " CLEANUP
if [[ "$CLEANUP" =~ ^[Yy] ]]; then
    print_status "Removing old storage..."
    rm -rf "$CURRENT_STORAGE" 2>/dev/null || true
    print_success "Old storage removed"
fi

# Step 6: Update .env.local if it exists
ENV_LOCATIONS=(
    "/opt/supascale-web/data/.env.local"
    "/opt/supascale-web/.build/standalone/.env.local"
)

for env_file in "${ENV_LOCATIONS[@]}"; do
    if [[ -f "$env_file" ]]; then
        print_status "Updating $env_file..."
        if grep -q "CONTAINER_STORAGE_PATH" "$env_file"; then
            sed -i "s|CONTAINER_STORAGE_PATH=.*|CONTAINER_STORAGE_PATH=$NEW_STORAGE|g" "$env_file"
        else
            echo "CONTAINER_STORAGE_PATH=$NEW_STORAGE" >> "$env_file"
        fi
        print_success "Updated container storage path in .env.local"
        break
    fi
done

# Verify new configuration
echo ""
print_status "Verifying new configuration..."
NEW_ROOT=$(podman info --format '{{.Store.GraphRoot}}' 2>/dev/null)
if [[ "$NEW_ROOT" == "$NEW_STORAGE" ]]; then
    print_success "Podman is now using: $NEW_ROOT"
else
    print_warning "Podman reports storage at: $NEW_ROOT"
    print_warning "Expected: $NEW_STORAGE"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                     Migration Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Container storage has been moved to: $NEW_STORAGE"
echo ""
echo "Next steps:"
echo "  1. Start your Supascale projects (they will re-download images)"
echo "  2. First start will take longer as images are pulled"
echo ""
echo "═══════════════════════════════════════════════════════════════"
