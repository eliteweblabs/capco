#!/bin/bash

# Supascale Update Script
# This script safely applies an update while preserving user data
#
# Usage: ./apply-update.sh <path-to-tarball>
#
# Key design: Keep the app running during backup/extraction so the
# frontend can display progress. Only restart at the very end.
#
# Directory structure (unified data folder):
#   /opt/supascale-web/                <- INSTALL_DIR
#   ├── data/                          <- USER DATA (backup this folder!)
#   │   ├── supascale.db*             <- Database files
#   │   ├── .env.local                <- Environment config
#   │   └── .update-state.json        <- Update tracking
#   ├── .build/
#   │   └── standalone/               <- App runs from here
#   │       ├── server.js             <- Entry point
#   │       ├── .next/                <- Compiled Next.js
#   │       ├── .env.local            <- SYMLINK to ../../data/.env.local
#   │       └── scripts/              <- This script lives here
#   ├── ecosystem.config.js           <- PM2 config
#   ├── .update-backup-*/             <- Backups during updates
#   └── .update-status.json           <- Progress for UI polling
#
# BACKUP INSTRUCTIONS FOR USERS:
#   To backup: cp -r /opt/supascale-web/data /path/to/backup/
#   To restore: Copy data folder back after reinstall

set -e

TARBALL_PATH="$1"

# Determine directory structure
# Script is in: /opt/supascale-web/.build/standalone/scripts/
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STANDALONE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_DIR="$(cd "$STANDALONE_DIR/../.." && pwd)"

# User data folder (this is what users backup!)
DATA_DIR="$INSTALL_DIR/data"

BACKUP_DIR="$INSTALL_DIR/.update-backup-$(date +%Y%m%d%H%M%S)"
LOG_FILE="$INSTALL_DIR/update.log"
STATUS_FILE="$INSTALL_DIR/.update-status.json"

# Temp directory for new version (extracted while app runs)
NEW_BUILD_DIR="$INSTALL_DIR/.update-new-build"

# PM2 process name
PM2_APP_NAME="supascale-web"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Update status for frontend polling
update_status() {
    local status="$1"
    local message="$2"
    local progress="$3"
    echo "{\"status\":\"$status\",\"message\":\"$message\",\"progress\":$progress,\"timestamp\":\"$(date -Iseconds)\"}" > "$STATUS_FILE"
}

# Track if we've started the swap (for rollback decisions)
SWAP_STARTED=false

# Error handler
error_exit() {
    log "ERROR: $1"
    update_status "error" "$1" 0

    # Clean up temp directories
    rm -rf "$NEW_BUILD_DIR" 2>/dev/null || true
    rm -rf "$INSTALL_DIR/.update-extract" 2>/dev/null || true

    # Attempt rollback if we started the swap and have a backup
    if [ "$SWAP_STARTED" = true ] && [ -d "$BACKUP_DIR/.build" ]; then
        log "Swap was in progress - attempting rollback..."
        rollback
    elif [ -d "$BACKUP_DIR" ]; then
        log "Error occurred before swap - backup preserved at $BACKUP_DIR"
        update_status "error" "$1 (Backup available, no changes were made to your installation)" 0
    fi

    exit 1
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."
    update_status "rolling_back" "Rolling back to previous version..." 0

    if [ -d "$BACKUP_DIR/.build" ]; then
        # Restore the entire .build directory
        rm -rf "$INSTALL_DIR/.build" 2>/dev/null || true
        cp -r "$BACKUP_DIR/.build" "$INSTALL_DIR/"
        log "  - Application files restored"
    fi

    # Recreate symlinks (data folder wasn't touched)
    create_data_symlinks

    # Restart application
    restart_application

    update_status "rolled_back" "Rollback complete. Previous version restored." 100
    log "Rollback complete"
}

# Create symlinks from standalone to data folder
create_data_symlinks() {
    log "Creating data folder symlinks..."

    local target_standalone="$INSTALL_DIR/.build/standalone"

    # Symlink .env.local from standalone to data folder
    rm -f "$target_standalone/.env.local" 2>/dev/null || true
    if [ -f "$DATA_DIR/.env.local" ]; then
        ln -sf "../../data/.env.local" "$target_standalone/.env.local"
        log "  - Symlinked .env.local"

        # Verify symlink was created and is valid
        if [ -L "$target_standalone/.env.local" ] && [ -e "$target_standalone/.env.local" ]; then
            log "  - Symlink verified: points to existing file"
        else
            log "ERROR: Symlink creation failed or target doesn't exist!"
            # Try to copy the file directly as fallback
            log "  - Attempting direct copy as fallback..."
            rm -f "$target_standalone/.env.local" 2>/dev/null || true
            cp "$DATA_DIR/.env.local" "$target_standalone/.env.local"
            log "  - Direct copy completed"
        fi
    else
        log "ERROR: $DATA_DIR/.env.local not found!"
        log "       The application will likely fail to start."
        log "       Please check your installation and create .env.local manually if needed."
    fi

    log "Symlinks created"
}

# Backup current application (for rollback only - data folder is NOT touched)
backup_application() {
    log "Backing up current application for rollback..."
    update_status "backing_up" "Creating backup for rollback..." 15

    mkdir -p "$BACKUP_DIR"

    # Backup the entire .build directory (app code only)
    if [ -d "$INSTALL_DIR/.build" ]; then
        cp -r "$INSTALL_DIR/.build" "$BACKUP_DIR/"
        log "  - Application files backed up"
    fi

    # Backup ecosystem config
    if [ -f "$INSTALL_DIR/ecosystem.config.js" ]; then
        cp "$INSTALL_DIR/ecosystem.config.js" "$BACKUP_DIR/"
        log "  - PM2 config backed up"
    fi

    log "Application backup complete"
    log "NOTE: User data in $DATA_DIR is preserved (not copied)"
}

# Verify data folder exists and has required files
verify_data_folder() {
    log "Verifying data folder..."
    update_status "preparing" "Verifying data folder..." 10

    if [ ! -d "$DATA_DIR" ]; then
        mkdir -p "$DATA_DIR"
        log "  - Created data folder: $DATA_DIR"
    fi

    # Check for database
    if [ ! -f "$DATA_DIR/supascale.db" ]; then
        log "WARNING: Database not found in data folder (may be new installation)"
    fi

    log "Data folder verified: $DATA_DIR"
}

# Migrate old installations to new unified data folder structure
# Old structure: .env.local directly in .build/standalone/
# New structure: .env.local in data/ folder with symlink from standalone
migrate_old_installation() {
    log "Checking for old installation structure..."
    update_status "preparing" "Checking installation structure..." 12

    local old_env="$INSTALL_DIR/.build/standalone/.env.local"

    # Check if .env.local exists and is NOT a symlink (old installation)
    if [ -f "$old_env" ] && [ ! -L "$old_env" ]; then
        log "  - Found old installation with .env.local in standalone folder"

        # Migrate .env.local to data folder if it doesn't exist there
        if [ ! -f "$DATA_DIR/.env.local" ]; then
            log "  - Migrating .env.local to data folder..."
            cp "$old_env" "$DATA_DIR/.env.local"
            log "  - Migration complete: .env.local moved to $DATA_DIR/"
        else
            log "  - Data folder already has .env.local, keeping existing"
        fi
    elif [ -L "$old_env" ]; then
        log "  - Installation already uses new structure (symlink found)"
    elif [ -f "$DATA_DIR/.env.local" ]; then
        log "  - .env.local found in data folder"
    else
        log "WARNING: No .env.local found in either location!"
        log "         The application may fail to start after update."
        log "         Please check $DATA_DIR/.env.local exists."
    fi

    # Also migrate database if it's in the old location
    local old_db="$INSTALL_DIR/.build/standalone/data/supascale.db"
    if [ -f "$old_db" ] && [ ! -f "$DATA_DIR/supascale.db" ]; then
        log "  - Migrating database from old location..."
        cp "$old_db" "$DATA_DIR/supascale.db"
        # Also copy WAL and SHM files if they exist
        [ -f "$old_db-wal" ] && cp "$old_db-wal" "$DATA_DIR/supascale.db-wal"
        [ -f "$old_db-shm" ] && cp "$old_db-shm" "$DATA_DIR/supascale.db-shm"
        log "  - Database migration complete"
    fi
}

# Extract and prepare the new version (app still running!)
extract_and_prepare() {
    log "Extracting update..."
    update_status "extracting" "Extracting new version..." 40

    # Create temp extraction directory
    EXTRACT_DIR="$INSTALL_DIR/.update-extract"
    rm -rf "$EXTRACT_DIR"
    rm -rf "$NEW_BUILD_DIR"
    mkdir -p "$EXTRACT_DIR"

    # Extract tarball
    tar -xzf "$TARBALL_PATH" -C "$EXTRACT_DIR"

    # Find the extracted directory (handle nested tarballs like supascale-web-1.0.1/)
    EXTRACTED_CONTENT=$(ls "$EXTRACT_DIR")
    EXTRACT_SOURCE="$EXTRACT_DIR"

    if [ -d "$EXTRACT_DIR/$EXTRACTED_CONTENT" ] && [ $(echo "$EXTRACTED_CONTENT" | wc -l) -eq 1 ]; then
        # Nested structure - tarball contains a directory
        EXTRACT_SOURCE="$EXTRACT_DIR/$EXTRACTED_CONTENT"
        log "  - Found nested tarball structure: $EXTRACTED_CONTENT"
    fi

    # Verify the extracted content has the expected structure
    if [ ! -d "$EXTRACT_SOURCE/.build/standalone" ]; then
        error_exit "Invalid update package: missing .build/standalone directory"
    fi

    update_status "extracting" "Preparing new version..." 50

    # Copy new .build to temp location (app still running from old .build!)
    log "  - Preparing new application files..."
    cp -r "$EXTRACT_SOURCE/.build" "$NEW_BUILD_DIR"

    # Copy scripts to standalone folder if present in package
    if [ -d "$EXTRACT_SOURCE/scripts" ]; then
        cp -r "$EXTRACT_SOURCE/scripts" "$NEW_BUILD_DIR/standalone/"
        log "  - Included scripts in new build"
    fi

    # Update ecosystem.config.js if present
    if [ -f "$EXTRACT_SOURCE/ecosystem.config.js" ]; then
        cp "$EXTRACT_SOURCE/ecosystem.config.js" "$INSTALL_DIR/"
        log "  - Updated PM2 config"
    fi

    # Clean up extraction directory
    rm -rf "$EXTRACT_DIR"
    rm -f "$TARBALL_PATH"

    log "Extraction complete - new version ready"
}

# Quick swap and restart (the only part that requires downtime)
swap_and_restart() {
    log "Applying update..."
    update_status "applying" "Installing new version..." 70

    # Check for permission issues before attempting swap
    local current_user=$(whoami)

    # Check if we can write to the install directory
    if [ ! -w "$INSTALL_DIR" ]; then
        log "ERROR: Cannot write to install directory: $INSTALL_DIR"
        log "Current user: $current_user"
        log "Directory owner: $(stat -c '%U:%G' "$INSTALL_DIR" 2>/dev/null || stat -f '%Su:%Sg' "$INSTALL_DIR" 2>/dev/null)"
        error_exit "Permission error: Cannot write to $INSTALL_DIR. The update process needs write access to this directory."
    fi

    # Check if we can delete the .build directory
    if [ -d "$INSTALL_DIR/.build" ] && [ ! -w "$INSTALL_DIR/.build" ]; then
        log "ERROR: Cannot write to .build directory"
        log "Current user: $current_user"
        log ".build owner: $(stat -c '%U:%G' "$INSTALL_DIR/.build" 2>/dev/null || stat -f '%Su:%Sg' "$INSTALL_DIR/.build" 2>/dev/null)"
        error_exit "Permission error: Cannot write to .build directory. Run 'sudo chown -R $current_user:$current_user $INSTALL_DIR' to fix."
    fi

    # Check for files owned by other users (more informative error)
    local bad_files=$(find "$INSTALL_DIR/.build" ! -user "$current_user" 2>/dev/null | head -5)
    if [ -n "$bad_files" ]; then
        log "ERROR: Some files are not owned by $current_user:"
        log "$bad_files"
        # Show who owns them
        local owner=$(stat -c '%U' "$(echo "$bad_files" | head -1)" 2>/dev/null || stat -f '%Su' "$(echo "$bad_files" | head -1)" 2>/dev/null)
        log "Files are owned by: $owner"
        error_exit "Permission error: Some files are owned by '$owner' but the update is running as '$current_user'. Run 'sudo chown -R $current_user:$current_user $INSTALL_DIR' to fix."
    fi

    # Mark that we're starting the swap (for rollback if needed)
    SWAP_STARTED=true

    # Quick swap: remove old .build, move new .build into place
    rm -rf "$INSTALL_DIR/.build"
    mv "$NEW_BUILD_DIR" "$INSTALL_DIR/.build"

    log "  - New version installed"

    # Create symlinks from standalone to data folder
    update_status "restoring" "Configuring data links..." 80
    create_data_symlinks

    # Restart the application
    update_status "restarting" "Restarting application..." 90
    restart_application
}

# Restart the application with PM2
restart_application() {
    log "Restarting application..."

    cd "$INSTALL_DIR"

    # Restart with PM2 using the ecosystem config
    if command -v pm2 &> /dev/null; then
        if [ -f "$INSTALL_DIR/ecosystem.config.js" ]; then
            pm2 restart ecosystem.config.js 2>&1 | tee -a "$LOG_FILE" || \
            pm2 start ecosystem.config.js 2>&1 | tee -a "$LOG_FILE"
            log "  - Restarted via PM2 ecosystem config"
        else
            # Fallback: restart by name or start fresh
            pm2 restart "$PM2_APP_NAME" 2>&1 | tee -a "$LOG_FILE" || \
            pm2 start "$INSTALL_DIR/.build/standalone/server.js" --name "$PM2_APP_NAME" \
                --cwd "$INSTALL_DIR/.build/standalone" 2>&1 | tee -a "$LOG_FILE"
            log "  - Restarted via PM2"
        fi
        pm2 save 2>/dev/null || true
    else
        # Fallback: kill old process and start new one
        pkill -f "node.*server.js" 2>/dev/null || true
        sleep 1
        cd "$INSTALL_DIR/.build/standalone"
        NODE_ENV=production nohup node server.js > "$INSTALL_DIR/app.log" 2>&1 &
        log "  - Started in background (no PM2)"
    fi

    log "Application restarted"
}

# Clean up old backups (keep last 3)
cleanup_old_backups() {
    log "Cleaning up old backups..."

    cd "$INSTALL_DIR"
    ls -dt .update-backup-* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true

    # Clean up update downloads
    rm -rf "$INSTALL_DIR/.build/standalone/.updates" 2>/dev/null || true

    log "Cleanup complete"
}

# Main update process
main() {
    log "=========================================="
    log "Starting Supascale update"
    log "=========================================="
    update_status "preparing" "Preparing update..." 5

    # Validate arguments
    if [ -z "$TARBALL_PATH" ]; then
        error_exit "Usage: $0 <path-to-tarball>"
    fi

    if [ ! -f "$TARBALL_PATH" ]; then
        error_exit "Tarball not found: $TARBALL_PATH"
    fi

    log "Tarball: $TARBALL_PATH"
    log "Install directory: $INSTALL_DIR"
    log "Data directory: $DATA_DIR"
    log "Standalone directory: $STANDALONE_DIR"

    # Phase 1: Preparation (app keeps running, UI shows progress)
    verify_data_folder
    migrate_old_installation
    backup_application
    extract_and_prepare

    # Phase 2: Quick swap and restart (brief downtime)
    swap_and_restart

    # Phase 3: Cleanup
    cleanup_old_backups

    update_status "complete" "Update complete! Click Refresh to load the new version." 100

    log "=========================================="
    log "Update complete!"
    log "=========================================="
    log ""
    log "Your data folder was preserved: $DATA_DIR"
    log "To backup your installation, simply copy this folder."
    log "=========================================="
}

# Run main function
main "$@"
