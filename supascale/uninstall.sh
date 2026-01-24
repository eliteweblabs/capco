#!/bin/bash
#
# Supascale Web Uninstaller
# https://supascale.com
#
# This script removes Supascale Web from your server
# Run as root: sudo ./uninstall.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default installation directory
DEFAULT_INSTALL_DIR="/opt/supascale-web"
INSTALL_DIR=""

# Print colored messages
print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# Get installation directory
get_install_dir() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "                  Supascale Web Uninstaller"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    read -p "Installation directory [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}

    if [[ ! -d "$INSTALL_DIR" ]]; then
        print_error "Installation directory not found: $INSTALL_DIR"
        exit 1
    fi
}

# Confirm uninstallation
confirm_uninstall() {
    echo ""
    print_warning "This will remove Supascale Web and all its files."
    print_warning "Your Supabase projects will NOT be deleted."
    echo ""
    read -p "Are you sure you want to uninstall? [y/N]: " CONFIRM
    CONFIRM=${CONFIRM:-N}

    if [[ ! "$CONFIRM" =~ ^[Yy] ]]; then
        print_status "Uninstallation cancelled"
        exit 0
    fi

    echo ""
    read -p "Remove data directory and database? [y/N]: " REMOVE_DATA
    REMOVE_DATA=${REMOVE_DATA:-N}

    read -p "Remove log files? [Y/n]: " REMOVE_LOGS
    REMOVE_LOGS=${REMOVE_LOGS:-Y}

    read -p "Remove web server configuration? [y/N]: " REMOVE_WEB_SERVER
    REMOVE_WEB_SERVER=${REMOVE_WEB_SERVER:-N}
}

# Stop and remove PM2 process
remove_pm2() {
    print_status "Stopping PM2 process..."

    if command -v pm2 &> /dev/null; then
        # Find the user running PM2
        PM2_USER=$(stat -c '%U' "$INSTALL_DIR" 2>/dev/null || echo "")

        if [[ -n "$PM2_USER" ]]; then
            sudo -u "$PM2_USER" pm2 delete supascale-web 2>/dev/null || true
            sudo -u "$PM2_USER" pm2 save 2>/dev/null || true
        fi

        # Also try as root
        pm2 delete supascale-web 2>/dev/null || true
        pm2 save 2>/dev/null || true

        print_success "PM2 process stopped and removed"
    else
        print_warning "PM2 not found, skipping..."
    fi
}

# Remove web server configuration
remove_web_server_config() {
    if [[ ! "$REMOVE_WEB_SERVER" =~ ^[Yy] ]]; then
        return
    fi

    print_status "Removing web server configuration..."

    # Nginx
    if [[ -f /etc/nginx/sites-enabled/supascale ]]; then
        rm -f /etc/nginx/sites-enabled/supascale
        rm -f /etc/nginx/sites-available/supascale
        nginx -t && systemctl reload nginx 2>/dev/null || true
        print_success "Nginx configuration removed"
    fi

    # Apache
    if [[ -f /etc/apache2/sites-enabled/supascale.conf ]]; then
        a2dissite supascale 2>/dev/null || true
        rm -f /etc/apache2/sites-available/supascale.conf
        systemctl reload apache2 2>/dev/null || true
        print_success "Apache configuration removed"
    fi

    if [[ -f /etc/httpd/conf.d/supascale.conf ]]; then
        rm -f /etc/httpd/conf.d/supascale.conf
        systemctl reload httpd 2>/dev/null || true
        print_success "Apache (httpd) configuration removed"
    fi

    # Caddy - don't automatically remove as it might have other configs
    if grep -q "supascale" /etc/caddy/Caddyfile 2>/dev/null; then
        print_warning "Caddy configuration may contain Supascale settings."
        print_warning "Please manually review /etc/caddy/Caddyfile"
    fi
}

# Remove application files
remove_application() {
    print_status "Removing application files..."

    # Remove main installation directory
    if [[ -d "$INSTALL_DIR" ]]; then
        if [[ "$REMOVE_DATA" =~ ^[Yy] ]]; then
            rm -rf "$INSTALL_DIR"
        else
            # Keep data directory
            DATA_DIR="$INSTALL_DIR/data"
            if [[ -d "$DATA_DIR" ]]; then
                mkdir -p /tmp/supascale_backup
                mv "$DATA_DIR" /tmp/supascale_backup/
            fi
            rm -rf "$INSTALL_DIR"
            if [[ -d /tmp/supascale_backup/data ]]; then
                mkdir -p "$INSTALL_DIR"
                mv /tmp/supascale_backup/data "$INSTALL_DIR/"
                rmdir /tmp/supascale_backup 2>/dev/null || true
                print_warning "Data directory preserved at: $INSTALL_DIR/data"
            fi
        fi
        print_success "Application files removed"
    fi

    # Remove log files
    if [[ "$REMOVE_LOGS" =~ ^[Yy] ]]; then
        if [[ -d /var/log/supascale ]]; then
            rm -rf /var/log/supascale
            print_success "Log files removed"
        fi
    fi
}

# Print completion message
print_completion() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "                   Uninstallation Complete"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "  Supascale Web has been removed from your system."
    echo ""

    if [[ ! "$REMOVE_DATA" =~ ^[Yy] ]]; then
        echo "  Your data has been preserved at: $INSTALL_DIR/data"
        echo ""
    fi

    echo "  Note: The following were NOT removed:"
    echo "    - Your Supabase project directories"
    echo "    - Backup files in ~/.supascale_backups"
    echo "    - Node.js, PM2, Docker installations"
    echo ""

    if [[ ! "$REMOVE_WEB_SERVER" =~ ^[Yy] ]]; then
        echo "  Web server configuration was also preserved."
        echo ""
    fi

    echo "  Thank you for using Supascale!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
}

# Main uninstallation flow
main() {
    check_root
    get_install_dir
    confirm_uninstall
    remove_pm2
    remove_web_server_config
    remove_application
    print_completion
}

# Run main function
main "$@"
