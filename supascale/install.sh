#!/bin/bash
#
# Supascale Web Installer
# https://www.supascale.app
#
# This script installs Supascale Web on a Linux server
# Run as root: sudo ./install.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version
VERSION="1.0.0"

# Default values
DEFAULT_INSTALL_DIR="/opt/supascale-web"
DEFAULT_APP_PORT="3000"
DEFAULT_CONTAINER_STORAGE="/var/lib/containers/storage"

# Computed defaults (set after determining user)
INSTALL_DIR=""
PROJECTS_DIR=""
BACKUPS_DIR=""
DATA_DIR=""
APP_PORT=""
DOMAIN=""
ENABLE_SSL="n"
WEB_SERVER="none"
SETUP_FIREWALL="y"
TARGET_USER=""
LICENSE_EMAIL=""
UPDATE_TOKEN=""
SERVER_HOST=""

# OS Detection
OS_TYPE=""        # "debian", "rhel", "fedora", or "unknown"
OS_VERSION=""     # e.g., "9" for RHEL 9, "22.04" for Ubuntu
CONTAINER_RUNTIME=""  # "docker" or "podman"
CONTAINER_STORAGE=""  # Custom storage path for containers (Podman only)

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

# Tech humor for long operations
TECH_JOKES=(
    "Mass layoffs... we are sending our interns to launch a Mars rocket and a submarine."
    "Asking AI to write code is like asking a magic 8-ball for architectural advice."
    "The cloud is just someone else's computer having a bad day."
    "There are only 2 hard problems in CS: cache invalidation, naming things, and off-by-one errors."
    "It works on my machine! ...ships laptop to production."
    "A QA engineer walks into a bar. Orders 1 beer. Orders 0 beers. Orders 99999999 beers. Orders -1 beers. Orders a lizard."
    "Why do programmers prefer dark mode? Because light attracts bugs."
    "The best thing about a boolean is even if you're wrong, you're only off by a bit."
    "Software development is 90% reading Stack Overflow, 10% copying from Stack Overflow."
    "Debugging: Being the detective in a crime movie where you are also the murderer."
    "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'"
    "Programming is 10% writing code and 90% figuring out why it doesn't work."
    "The code works, nobody knows why. The code breaks, nobody knows why."
    "In theory, there's no difference between theory and practice. In practice, there is."
    "99 little bugs in the code, 99 little bugs. Take one down, patch it around... 127 little bugs in the code."
    "I don't always test my code, but when I do, I do it in production."
    "Weeks of coding can save you hours of planning."
    "Documentation is like sex: when it's good, it's very good; when it's bad, it's better than nothing."
    "A programmer's wife tells him: 'Go to the store and buy a loaf of bread. If they have eggs, buy a dozen.' He comes home with 12 loaves."
    "Why do Java developers wear glasses? Because they don't C#."
    "Docker: Works on my machine? Then we'll ship your machine!"
    "git push --force: Because collaboration is overrated."
    "The cloud: Where your data lives until the bill is due."
    "Kubernetes: It's not complexity, it's job security."
    "Microservices: Turning one problem into 47 smaller, distributed problems."
    "Technical debt is like a mortgage, except nobody remembers taking out the loan."
    "The sprint is almost over and we're only 3 sprints behind."
    "Agile: Moving fast in circles while looking productive."
    "DevOps: When you want developers to be woken up at 3am too."
    "AI will replace programmers any day now, says article from 1960."
)

# Spinner with jokes for long operations
run_with_spinner() {
    local pid=$1
    local message=$2
    local spinner='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    local joke_interval=10
    local last_joke_time=$SECONDS
    local joke_shown=false

    while kill -0 "$pid" 2>/dev/null; do
        local spin_char="${spinner:$i:1}"
        printf "\r${BLUE}[%s]${NC} %s" "$spin_char" "$message"

        # Show a joke every 10 seconds
        local elapsed=$((SECONDS - last_joke_time))
        if [[ $elapsed -ge $joke_interval ]]; then
            local random_joke="${TECH_JOKES[$RANDOM % ${#TECH_JOKES[@]}]}"
            printf "\r%-80s" " "  # Clear line
            printf "\r${YELLOW}    💡 %s${NC}\n" "$random_joke"
            printf "${BLUE}[%s]${NC} %s" "$spin_char" "$message"
            last_joke_time=$SECONDS
            joke_shown=true
        fi

        i=$(( (i + 1) % ${#spinner} ))
        sleep 0.1
    done

    # Clear spinner line
    printf "\r%-80s\r" " "
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# Detect the target user (who ran sudo)
detect_user() {
    if [[ -n "$SUDO_USER" ]]; then
        TARGET_USER="$SUDO_USER"
    else
        TARGET_USER=$(whoami)
    fi

    TARGET_HOME=$(getent passwd "$TARGET_USER" | cut -d: -f6)

    if [[ -z "$TARGET_HOME" ]]; then
        TARGET_HOME="/home/$TARGET_USER"
    fi
}

# Detect operating system
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        case "$ID" in
            ubuntu|debian|linuxmint|pop)
                OS_TYPE="debian"
                OS_VERSION="$VERSION_ID"
                ;;
            rhel|centos|rocky|almalinux|ol)
                OS_TYPE="rhel"
                OS_VERSION="$VERSION_ID"
                ;;
            fedora)
                OS_TYPE="fedora"
                OS_VERSION="$VERSION_ID"
                ;;
            *)
                OS_TYPE="unknown"
                OS_VERSION="$VERSION_ID"
                ;;
        esac
    else
        OS_TYPE="unknown"
    fi

    print_status "Detected OS: $ID $VERSION_ID (type: $OS_TYPE)"
}

# Check system prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Detect OS first
    detect_os

    # Check for Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed"
        echo ""
        read -e -p "Would you like to install Node.js 20.x? [Y/n]: " install_node
        install_node=${install_node:-Y}
        if [[ "$install_node" =~ ^[Yy] ]]; then
            install_nodejs
        else
            print_error "Node.js is required. Please install Node.js 18+ and try again."
            exit 1
        fi
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$NODE_VERSION" -lt 18 ]]; then
            print_error "Node.js 18+ is required. Current version: $(node --version)"
            exit 1
        fi
        print_success "Node.js $(node --version) found"
    fi

    # Check for npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm --version) found"

    # Check for container runtime (Docker or Podman)
    # On RHEL/Fedora, Podman is preferred; on Debian/Ubuntu, Docker is preferred
    if command -v docker &> /dev/null; then
        CONTAINER_RUNTIME="docker"
        print_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') found"
    elif command -v podman &> /dev/null; then
        CONTAINER_RUNTIME="podman"
        print_success "Podman $(podman --version | cut -d' ' -f3) found"
        # Check for podman-compose
        if ! command -v podman-compose &> /dev/null; then
            print_warning "podman-compose is not installed"
            read -e -p "Would you like to install podman-compose? [Y/n]: " install_compose
            install_compose=${install_compose:-Y}
            if [[ "$install_compose" =~ ^[Yy] ]]; then
                install_podman_compose
            else
                print_warning "podman-compose will need to be installed before creating Supabase projects"
            fi
        else
            print_success "podman-compose found"
        fi
    else
        # No container runtime found - offer to install the appropriate one
        if [[ "$OS_TYPE" == "rhel" || "$OS_TYPE" == "fedora" ]]; then
            print_warning "No container runtime found"
            echo ""
            echo "On RHEL/CentOS/Fedora, Podman is the recommended container runtime."
            echo "Podman is a drop-in replacement for Docker with better security (rootless by default)."
            echo ""
            read -e -p "Would you like to install Podman? [Y/n]: " install_podman
            install_podman=${install_podman:-Y}
            if [[ "$install_podman" =~ ^[Yy] ]]; then
                install_podman_engine
            else
                print_warning "A container runtime (Podman or Docker) is needed to run Supabase projects"
            fi
        else
            print_warning "Docker is not installed"
            echo "Docker is required to run Supabase instances."
            read -e -p "Would you like to install Docker? [Y/n]: " install_docker
            install_docker=${install_docker:-Y}
            if [[ "$install_docker" =~ ^[Yy] ]]; then
                install_docker_engine
            else
                print_warning "Docker will need to be installed before creating Supabase projects"
            fi
        fi
    fi

    # Verify container runtime is working
    if [[ -n "$CONTAINER_RUNTIME" ]]; then
        print_success "Container runtime: $CONTAINER_RUNTIME"
    fi

    # Check for PM2 - find the actual binary, not symlinks
    PM2_BIN=""

    # Function to find pm2 binary
    find_pm2() {
        # Check common locations
        local locations=(
            "/usr/local/bin/pm2"
            "/usr/bin/pm2"
            "$(npm root -g 2>/dev/null)/pm2/bin/pm2"
            "/usr/local/lib/node_modules/pm2/bin/pm2"
            "/usr/lib/node_modules/pm2/bin/pm2"
        )

        for loc in "${locations[@]}"; do
            if [[ -f "$loc" && -x "$loc" ]]; then
                echo "$loc"
                return 0
            fi
        done

        # Try command -v as last resort
        if command -v pm2 &> /dev/null; then
            local pm2_path=$(command -v pm2)
            # Resolve symlinks to get actual path
            if [[ -L "$pm2_path" ]]; then
                pm2_path=$(readlink -f "$pm2_path")
            fi
            if [[ -f "$pm2_path" && -x "$pm2_path" ]]; then
                echo "$pm2_path"
                return 0
            fi
        fi

        return 1
    }

    PM2_BIN=$(find_pm2) || true

    if [[ -z "$PM2_BIN" ]]; then
        print_warning "PM2 is not installed"
        read -e -p "Would you like to install PM2 globally? [Y/n]: " install_pm2
        install_pm2=${install_pm2:-Y}
        if [[ "$install_pm2" =~ ^[Yy] ]]; then
            npm install -g pm2

            # Find where npm installed pm2
            PM2_BIN=$(find_pm2)

            if [[ -n "$PM2_BIN" ]]; then
                print_success "PM2 installed at $PM2_BIN"
            fi
        fi

        if [[ -z "$PM2_BIN" ]]; then
            print_error "PM2 installation failed or not found"
            print_error "Try installing manually: npm install -g pm2"
            exit 1
        fi
    else
        print_success "PM2 $($PM2_BIN --version) found at $PM2_BIN"
    fi

    # Fix PM2 permissions - ensure it's executable by all users
    if [[ -n "$PM2_BIN" ]]; then
        chmod +x "$PM2_BIN" 2>/dev/null || true
        # Also fix the parent directory and node_modules if needed
        local pm2_dir=$(dirname "$PM2_BIN")
        chmod +x "$pm2_dir" 2>/dev/null || true
        # Fix common npm global paths
        chmod -R a+rX /usr/local/lib/node_modules/pm2 2>/dev/null || true
        chmod -R a+rX /usr/lib/node_modules/pm2 2>/dev/null || true
    fi

    # Export PM2_BIN for use in other functions
    export PM2_BIN
}

# Install Node.js
install_nodejs() {
    print_status "Installing Node.js 20.x..."

    # Detect package manager and install in background
    (
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /tmp/nodejs-install.log 2>&1
            apt-get install -y nodejs >> /tmp/nodejs-install.log 2>&1
        elif command -v dnf &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - > /tmp/nodejs-install.log 2>&1
            dnf install -y nodejs >> /tmp/nodejs-install.log 2>&1
        elif command -v yum &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - > /tmp/nodejs-install.log 2>&1
            yum install -y nodejs >> /tmp/nodejs-install.log 2>&1
        else
            echo "UNSUPPORTED" > /tmp/nodejs-install.log
            exit 1
        fi
    ) &
    local install_pid=$!
    run_with_spinner $install_pid "Installing Node.js 20.x (this takes a few minutes)..."
    wait $install_pid
    local install_exit=$?

    if [[ $install_exit -ne 0 ]]; then
        if grep -q "UNSUPPORTED" /tmp/nodejs-install.log 2>/dev/null; then
            print_error "Unsupported package manager. Please install Node.js manually."
        else
            print_error "Failed to install Node.js. Check /tmp/nodejs-install.log"
        fi
        exit 1
    fi

    print_success "Node.js installed"
}

# Install Docker
install_docker_engine() {
    print_status "Installing Docker..."

    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu - run in background with spinner
        (
            apt-get update > /tmp/docker-install.log 2>&1
            apt-get install -y ca-certificates curl gnupg >> /tmp/docker-install.log 2>&1
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>> /tmp/docker-install.log
            chmod a+r /etc/apt/keyrings/docker.gpg

            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
                $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
                tee /etc/apt/sources.list.d/docker.list > /dev/null

            apt-get update >> /tmp/docker-install.log 2>&1
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >> /tmp/docker-install.log 2>&1
        ) &
        local install_pid=$!
        run_with_spinner $install_pid "Installing Docker (this takes a few minutes)..."
        wait $install_pid

        # Add user to docker group
        usermod -aG docker "$TARGET_USER"
    else
        print_warning "Automatic Docker installation not supported for this distribution."
        print_warning "Please install Docker manually: https://docs.docker.com/engine/install/"
        return
    fi

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    print_success "Docker installed"
    CONTAINER_RUNTIME="docker"
}

# Install Podman (for RHEL/CentOS/Fedora)
install_podman_engine() {
    print_status "Installing Podman..."

    (
        if [[ "$OS_TYPE" == "rhel" ]]; then
            # RHEL 8 uses container-tools module, RHEL 9 uses direct install
            if [[ "${OS_VERSION%%.*}" -ge 9 ]]; then
                dnf install -y podman > /tmp/podman-install.log 2>&1
            else
                # RHEL 8
                dnf module enable -y container-tools:rhel8 > /tmp/podman-install.log 2>&1
                dnf module install -y container-tools:rhel8 >> /tmp/podman-install.log 2>&1
            fi
        elif [[ "$OS_TYPE" == "fedora" ]]; then
            dnf install -y podman > /tmp/podman-install.log 2>&1
        elif command -v dnf &> /dev/null; then
            dnf install -y podman > /tmp/podman-install.log 2>&1
        elif command -v yum &> /dev/null; then
            yum install -y podman > /tmp/podman-install.log 2>&1
        else
            echo "UNSUPPORTED" > /tmp/podman-install.log
            exit 1
        fi
    ) &
    local install_pid=$!
    run_with_spinner $install_pid "Installing Podman (this may take a few minutes)..."
    wait $install_pid
    local install_exit=$?

    if [[ $install_exit -ne 0 ]]; then
        if grep -q "UNSUPPORTED" /tmp/podman-install.log 2>/dev/null; then
            print_error "Unsupported package manager. Please install Podman manually."
        else
            print_error "Failed to install Podman. Check /tmp/podman-install.log"
        fi
        return 1
    fi

    print_success "Podman installed"
    CONTAINER_RUNTIME="podman"

    # Enable and start podman socket (for API compatibility)
    # Note: Podman is daemonless but the socket enables docker-compose compatibility
    if systemctl list-unit-files | grep -q podman.socket; then
        systemctl enable --now podman.socket 2>/dev/null || true
        print_success "Podman socket enabled"
    fi

    # Configure Podman security settings for RHEL (fixes container startup issues)
    configure_podman_security

    # Configure Podman for compatibility with Docker short image names
    # This prevents "short-name resolution enforced but cannot prompt without a TTY" errors
    configure_podman_registries

    # Also install podman-compose
    install_podman_compose
}

# Configure Podman security settings for RHEL
# Fixes "cannot apply additional memory protection" and other SELinux/seccomp issues
configure_podman_security() {
    print_status "Configuring Podman security settings..."

    local containers_conf="/etc/containers/containers.conf"

    # Create containers directory if needed
    mkdir -p /etc/containers

    # Backup existing config if present
    if [[ -f "$containers_conf" ]]; then
        cp "$containers_conf" "${containers_conf}.bak.$(date +%Y%m%d%H%M%S)"
    fi

    # Create containers.conf with relaxed security for container compatibility
    cat > "$containers_conf" << 'EOF'
# Podman containers configuration
# Configured by Supascale installer for RHEL compatibility

[containers]
# Disable seccomp filtering (fixes "cannot apply additional memory protection" errors)
seccomp_profile = ""

# Disable SELinux labeling for containers (prevents permission denied errors)
label = false

# Default capabilities for containers
default_capabilities = [
  "CHOWN",
  "DAC_OVERRIDE",
  "FOWNER",
  "FSETID",
  "KILL",
  "NET_BIND_SERVICE",
  "SETFCAP",
  "SETGID",
  "SETPCAP",
  "SETUID",
  "SYS_CHROOT"
]

[engine]
# Use cgroups v2
cgroup_manager = "systemd"
EOF

    print_success "Podman security settings configured"

    # Configure SELinux for containers if SELinux is enabled
    if command -v getenforce &> /dev/null && [[ "$(getenforce)" != "Disabled" ]]; then
        print_status "Configuring SELinux for containers..."

        # Set SELinux booleans for container compatibility
        setsebool -P container_manage_cgroup on 2>/dev/null || true
        setsebool -P container_use_cephfs on 2>/dev/null || true

        # If SELinux is enforcing, set to permissive for containers
        if [[ "$(getenforce)" == "Enforcing" ]]; then
            print_warning "SELinux is in enforcing mode. Some containers may have issues."
            print_warning "If you experience container startup problems, run: setenforce 0"
            print_warning "Or permanently: sed -i 's/SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config"
        fi

        print_success "SELinux container settings applied"
    fi
}

# Configure Podman registries for Docker compatibility
configure_podman_registries() {
    local registries_conf="/etc/containers/registries.conf"

    if [[ -f "$registries_conf" ]]; then
        print_status "Configuring Podman for Docker Hub compatibility..."

        # Change short-name-mode from "enforcing" to "permissive" if present
        if grep -q 'short-name-mode.*=.*"enforcing"' "$registries_conf"; then
            sed -i 's/short-name-mode.*=.*"enforcing"/short-name-mode = "permissive"/g' "$registries_conf"
            print_success "Set short-name-mode to permissive"
        fi

        # Ensure docker.io is in unqualified-search-registries
        if ! grep -q 'unqualified-search-registries.*docker.io' "$registries_conf"; then
            # Check if the line exists but is commented
            if grep -q '#.*unqualified-search-registries' "$registries_conf"; then
                # Add our own line
                echo 'unqualified-search-registries = ["docker.io"]' >> "$registries_conf"
            elif grep -q 'unqualified-search-registries' "$registries_conf"; then
                # Line exists, try to add docker.io to it
                sed -i 's/unqualified-search-registries = \[/unqualified-search-registries = ["docker.io", /g' "$registries_conf"
            else
                # Line doesn't exist, add it
                echo 'unqualified-search-registries = ["docker.io"]' >> "$registries_conf"
            fi
            print_success "Added docker.io to unqualified-search-registries"
        fi
    else
        # Create a basic registries.conf
        print_status "Creating Podman registries configuration..."
        mkdir -p /etc/containers
        cat > "$registries_conf" << 'EOF'
# Podman registries configuration
# Configured by Supascale installer for Docker Hub compatibility

# Allow short image names without prompting (required for non-TTY usage)
short-name-mode = "permissive"

# Default registries to search for short image names
unqualified-search-registries = ["docker.io"]
EOF
        print_success "Created $registries_conf"
    fi
}

# Configure Podman storage location
configure_podman_storage() {
    local storage_path="$1"
    local storage_conf="/etc/containers/storage.conf"

    if [[ -z "$storage_path" || "$storage_path" == "$DEFAULT_CONTAINER_STORAGE" ]]; then
        print_status "Using default container storage location"
        return 0
    fi

    print_status "Configuring Podman storage at: $storage_path"

    # Create the directory if it doesn't exist
    if [[ ! -d "$storage_path" ]]; then
        mkdir -p "$storage_path"
        print_success "Created storage directory: $storage_path"
    fi

    # Stop any running containers first (best effort)
    podman stop -a 2>/dev/null || true

    # Backup existing config if present
    if [[ -f "$storage_conf" ]]; then
        cp "$storage_conf" "${storage_conf}.bak.$(date +%Y%m%d%H%M%S)"
    fi

    # Create or update storage.conf
    cat > "$storage_conf" << EOF
# Podman storage configuration
# Configured by Supascale installer on $(date)
# Original default: /var/lib/containers/storage

[storage]
driver = "overlay"
graphroot = "$storage_path"
runroot = "/run/containers/storage"

[storage.options]
additionalimagestores = []
size = ""

[storage.options.overlay]
mountopt = "nodev,metacopy=on"
EOF

    print_success "Updated $storage_conf with custom storage location"

    # Set proper ownership and permissions
    # Root-owned for system-level Podman
    chown -R root:root "$storage_path" 2>/dev/null || true
    chmod 755 "$storage_path"

    # Reset Podman storage to apply new config
    print_status "Resetting Podman storage to apply new configuration..."
    podman system reset --force 2>/dev/null || true

    print_success "Podman storage configured at: $storage_path"
    print_warning "Note: Any previously pulled images will need to be re-downloaded."
}

# Install podman-compose
install_podman_compose() {
    print_status "Installing podman-compose..."

    (
        if command -v dnf &> /dev/null; then
            # Try dnf first (available on RHEL 9+, Fedora)
            if dnf install -y podman-compose > /tmp/podman-compose-install.log 2>&1; then
                echo "SUCCESS_DNF" >> /tmp/podman-compose-install.log
            else
                # Fallback to pip
                if command -v pip3 &> /dev/null; then
                    pip3 install podman-compose >> /tmp/podman-compose-install.log 2>&1
                else
                    dnf install -y python3-pip >> /tmp/podman-compose-install.log 2>&1
                    pip3 install podman-compose >> /tmp/podman-compose-install.log 2>&1
                fi
            fi
        elif command -v yum &> /dev/null; then
            # RHEL 8 / CentOS - use pip
            if ! command -v pip3 &> /dev/null; then
                yum install -y python3-pip > /tmp/podman-compose-install.log 2>&1
            fi
            pip3 install podman-compose >> /tmp/podman-compose-install.log 2>&1
        else
            echo "UNSUPPORTED" > /tmp/podman-compose-install.log
            exit 1
        fi
    ) &
    local install_pid=$!
    run_with_spinner $install_pid "Installing podman-compose..."
    wait $install_pid
    local install_exit=$?

    if [[ $install_exit -ne 0 ]]; then
        print_warning "podman-compose installation may have failed. Check /tmp/podman-compose-install.log"
        print_warning "You can install it manually with: pip3 install podman-compose"
        return 1
    fi

    print_success "podman-compose installed"
}

# Interactive configuration
configure_installation() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "                    Supascale Web Installer"
    echo "                         Version $VERSION"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    # Installation directory
    read -e -p "Installation directory [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}

    # Projects directory
    read -e -p "Projects base directory [$TARGET_HOME]: " PROJECTS_DIR
    PROJECTS_DIR=${PROJECTS_DIR:-$TARGET_HOME}

    # Backups directory
    DEFAULT_BACKUPS="$TARGET_HOME/.supascale_backups"
    read -e -p "Backups directory [$DEFAULT_BACKUPS]: " BACKUPS_DIR
    BACKUPS_DIR=${BACKUPS_DIR:-$DEFAULT_BACKUPS}

    # Data directory
    DATA_DIR="$INSTALL_DIR/data"

    # App port
    read -e -p "Web application port [$DEFAULT_APP_PORT]: " APP_PORT
    APP_PORT=${APP_PORT:-$DEFAULT_APP_PORT}

    # Server Host/IP for accessing Supabase projects
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "SERVER HOST / IP ADDRESS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "This is the hostname or IP address used to access your Supabase"
    echo "project APIs and Studio dashboards from your browser/clients."
    echo ""
    echo "Examples:"
    echo "  • 192.168.1.100     (local network IP)"
    echo "  • 10.0.0.5          (private IP)"
    echo "  • myserver.local    (hostname)"
    echo "  • supabase.example.com (if you have DNS configured)"
    echo ""
    local default_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [[ -z "$default_ip" ]]; then
        default_ip="localhost"
    fi
    read -e -p "Server host/IP [$default_ip]: " SERVER_HOST
    SERVER_HOST=${SERVER_HOST:-$default_ip}

    # License information (for automatic updates)
    echo ""
    echo "License Information (for automatic updates)"
    echo "Get these from your Supascale dashboard at https://www.supascale.app/home/license"
    echo ""
    read -e -p "License email: " LICENSE_EMAIL
    read -e -p "Update token: " UPDATE_TOKEN

    if [[ -z "$LICENSE_EMAIL" || -z "$UPDATE_TOKEN" ]]; then
        print_warning "License info not provided. Automatic updates will be disabled."
        print_warning "You can add these later in the .env.local file."
    fi

    # Web server selection
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "REVERSE PROXY (Web Server)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "A reverse proxy sits in front of your app to handle:"
    echo "  • SSL/HTTPS certificates (secure connections)"
    echo "  • Domain name routing (e.g., supascale.yourdomain.com)"
    echo "  • Load balancing and caching"
    echo ""
    echo "Choose 'None' if you're just testing or will access via IP:port directly."
    echo ""
    echo "Select web server for reverse proxy:"
    echo "  1) Nginx (recommended - lightweight, fast)"
    echo "  2) Apache (if you already use Apache)"
    echo "  3) Caddy (automatic HTTPS, easiest setup)"
    echo "  4) None (access directly via http://server-ip:$APP_PORT)"
    read -e -p "Choice [4]: " WEB_SERVER_CHOICE
    WEB_SERVER_CHOICE=${WEB_SERVER_CHOICE:-4}

    case $WEB_SERVER_CHOICE in
        1) WEB_SERVER="nginx" ;;
        2) WEB_SERVER="apache" ;;
        3) WEB_SERVER="caddy" ;;
        *) WEB_SERVER="none" ;;
    esac

    # Domain configuration
    if [[ "$WEB_SERVER" != "none" ]]; then
        echo ""
        read -e -p "Domain name (leave blank for IP-only access): " DOMAIN

        if [[ -n "$DOMAIN" && "$WEB_SERVER" != "caddy" ]]; then
            read -e -p "Enable SSL with Let's Encrypt? [y/N]: " ENABLE_SSL
            ENABLE_SSL=${ENABLE_SSL:-N}
        fi
    fi

    # Container Storage Location (Podman only)
    if [[ "$CONTAINER_RUNTIME" == "podman" ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "CONTAINER STORAGE LOCATION"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Podman stores container images and overlays in this location."
        echo "Default: $DEFAULT_CONTAINER_STORAGE (on /var partition)"
        echo ""
        echo "Supabase projects require approximately 10-15GB of container images."
        echo "If your /var partition is small, specify a different path with more space"
        echo "(e.g., /data/containers, /opt/containers, /home/containers)."
        echo ""

        # Check /var disk space
        var_avail=$(df -BG /var 2>/dev/null | awk 'NR==2 {gsub("G",""); print $4}')
        if [[ -n "$var_avail" ]]; then
            if [[ "$var_avail" -lt 15 ]]; then
                print_warning "Only ${var_avail}GB available on /var - recommend using a different path"
            else
                print_status "Available space on /var: ${var_avail}GB"
            fi
        fi

        read -e -p "Container storage path [$DEFAULT_CONTAINER_STORAGE]: " CONTAINER_STORAGE
        CONTAINER_STORAGE=${CONTAINER_STORAGE:-$DEFAULT_CONTAINER_STORAGE}
    fi

    # Firewall
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "FIREWALL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "The firewall controls which ports are accessible from the internet."
    echo "This will open ports 80/443 (HTTP/HTTPS) and SSH, blocking others."
    if [[ "$OS_TYPE" == "rhel" || "$OS_TYPE" == "fedora" ]]; then
        echo "On RHEL/CentOS/Fedora, this uses firewalld (rules persist across reboots)."
    else
        echo "On Debian/Ubuntu, this uses UFW (rules persist across reboots)."
    fi
    echo "Skip if you manage firewall rules separately (e.g., AWS security groups)."
    echo ""
    read -e -p "Configure firewall? [Y/n]: " SETUP_FIREWALL
    SETUP_FIREWALL=${SETUP_FIREWALL:-Y}

    # Confirmation
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "                    Installation Summary"
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Install directory:  $INSTALL_DIR"
    echo "  Projects directory: $PROJECTS_DIR"
    echo "  Backups directory:  $BACKUPS_DIR"
    echo "  Application port:   $APP_PORT"
    echo "  Server host/IP:     $SERVER_HOST"
    echo "  Web server:         $WEB_SERVER"
    [[ -n "$DOMAIN" ]] && echo "  Domain:             $DOMAIN"
    [[ "$CONTAINER_RUNTIME" == "podman" && -n "$CONTAINER_STORAGE" ]] && echo "  Container storage:  $CONTAINER_STORAGE"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    read -e -p "Proceed with installation? [Y/n]: " PROCEED
    PROCEED=${PROCEED:-Y}

    if [[ ! "$PROCEED" =~ ^[Yy] ]]; then
        print_warning "Installation cancelled"
        exit 0
    fi
}

# Generate secrets
generate_secrets() {
    print_status "Generating secure secrets..."

    AUTH_SECRET=$(openssl rand -base64 32)
    DB_ENCRYPTION_KEY=$(openssl rand -hex 32)

    print_success "Secrets generated"
}

# Install the application
install_application() {
    print_status "Installing Supascale Web..."

    # Create all required directories
    print_status "Creating directories..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$PROJECTS_DIR"
    mkdir -p "$BACKUPS_DIR"
    mkdir -p /var/log/supascale

    # Set ownership for projects and backups dirs
    chown -R "$TARGET_USER:$TARGET_USER" "$PROJECTS_DIR"
    chown -R "$TARGET_USER:$TARGET_USER" "$BACKUPS_DIR"

    print_success "Directories created"

    # Copy build files
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Check for standalone build in .next directory (development) or .build (distribution)
    if [[ -d "$SCRIPT_DIR/.next/standalone" ]]; then
        BUILD_DIR="$SCRIPT_DIR/.next"
        print_status "Using development build from .next/standalone"
    elif [[ -d "$SCRIPT_DIR/.build/standalone" ]]; then
        BUILD_DIR="$SCRIPT_DIR/.build"
        print_status "Using distribution build from .build/standalone"
    else
        print_error "Build directory not found!"
        echo ""
        echo "If installing from source, run these commands first:"
        echo "  npm install"
        echo "  npm run build:standalone"
        echo ""
        echo "Then run this installer again."
        exit 1
    fi

    # Copy build files (this can take a while with ~26MB of files)
    print_status "Copying application files..."
    mkdir -p "$INSTALL_DIR/.build"
    cp -r "$BUILD_DIR/standalone" "$INSTALL_DIR/.build/" &
    local copy_pid=$!
    run_with_spinner $copy_pid "Copying standalone build (~26MB)..."
    wait $copy_pid

    # Copy static files
    if [[ -d "$BUILD_DIR/static" ]]; then
        mkdir -p "$INSTALL_DIR/.build/standalone/.next"
        cp -r "$BUILD_DIR/static" "$INSTALL_DIR/.build/standalone/.next/"
    fi

    # Copy public directory
    if [[ -d "$SCRIPT_DIR/public" ]]; then
        cp -r "$SCRIPT_DIR/public" "$INSTALL_DIR/.build/standalone/"
    fi

    # Copy scripts directory (needed for setup-admin.js)
    if [[ -d "$SCRIPT_DIR/scripts" ]]; then
        cp -r "$SCRIPT_DIR/scripts" "$INSTALL_DIR/.build/standalone/"
    fi

    print_success "Build files copied"

    # Rebuild native modules for current Node.js version
    # This is required because native modules like better-sqlite3 are compiled
    # for a specific Node.js version and must be recompiled on the target system
    print_status "Rebuilding native modules for Node.js $(node --version)..."

    # Ensure build tools are installed
    if ! command -v gcc &> /dev/null || ! command -v make &> /dev/null; then
        print_status "Installing build tools..."
        if command -v apt-get &> /dev/null; then
            apt-get install -y build-essential python3 > /tmp/build-tools-install.log 2>&1
        elif command -v dnf &> /dev/null; then
            dnf install -y gcc-c++ make python3 > /tmp/build-tools-install.log 2>&1
        elif command -v yum &> /dev/null; then
            yum install -y gcc-c++ make python3 > /tmp/build-tools-install.log 2>&1
        fi
    fi

    # Reinstall native modules for current Node.js version
    # Next.js standalone build only includes pre-compiled binaries, not source files
    # We need to fully reinstall to get source files for compilation
    (
        cd "$INSTALL_DIR/.build/standalone"
        npm install better-sqlite3 --no-save > /tmp/npm-rebuild.log 2>&1
    ) &
    local rebuild_pid=$!
    run_with_spinner $rebuild_pid "Installing better-sqlite3 for Node.js $(node --version)..."
    local rebuild_exit=0
    wait $rebuild_pid || rebuild_exit=$?

    if [[ $rebuild_exit -ne 0 ]]; then
        print_warning "Native module installation may have failed. Check /tmp/npm-rebuild.log"
        print_warning "The application may not work correctly."
    else
        print_success "Native modules installed"
    fi

    # Copy templates
    if [[ -d "$SCRIPT_DIR/templates" ]]; then
        cp -r "$SCRIPT_DIR/templates" "$INSTALL_DIR/"
    fi

    # Create .env.local in data folder (unified backup location)
    # The data folder contains ALL user data for easy backup/restore
    cat > "$DATA_DIR/.env.local" << EOF
# Supascale Web Configuration
# Generated by installer on $(date)
#
# BACKUP INSTRUCTIONS:
# To backup your Supascale installation, simply copy the entire data folder:
#   cp -r $DATA_DIR /path/to/backup/
#
# This folder contains:
#   - .env.local (this file)
#   - supascale.db (database with all your settings)
#   - .update-state.json (update tracking)

# NextAuth Configuration
NEXTAUTH_URL=http://${DOMAIN:-localhost}:${APP_PORT}
AUTH_SECRET=$AUTH_SECRET

# Database Encryption Key (required - used for encrypting sensitive data)
DB_ENCRYPTION_KEY=$DB_ENCRYPTION_KEY

# File Paths
PROJECTS_BASE_DIR=$PROJECTS_DIR
BACKUPS_BASE_DIR=$BACKUPS_DIR
SUPASCALE_DATA_DIR=$DATA_DIR
SUPASCALE_USER_HOME=$TARGET_HOME

# License Information (for automatic updates)
LICENSE_EMAIL=$LICENSE_EMAIL
UPDATE_TOKEN=$UPDATE_TOKEN

# Server Host Configuration
# This is the hostname/IP used to access Supabase project APIs and Studio
SERVER_HOST=$SERVER_HOST

# Container Runtime Configuration
CONTAINER_RUNTIME=$CONTAINER_RUNTIME
CONTAINER_STORAGE_PATH=${CONTAINER_STORAGE:-$DEFAULT_CONTAINER_STORAGE}

# NOTE: Admin credentials are NOT stored here.
# They are securely hashed and stored in the SQLite database.
# To reset credentials, see: https://www.supascale.app/docs/troubleshooting/password-reset
EOF

    # Create symlink in standalone folder pointing to data folder
    # This allows Next.js to find .env.local while keeping data centralized
    ln -sf "../../data/.env.local" "$INSTALL_DIR/.build/standalone/.env.local"

    # Set permissions - the app runs as TARGET_USER for security (not as root)
    chown -R "$TARGET_USER:$TARGET_USER" "$INSTALL_DIR"
    chown -R "$TARGET_USER:$TARGET_USER" "$BACKUPS_DIR"
    chown -R "$TARGET_USER:$TARGET_USER" /var/log/supascale
    chmod 600 "$DATA_DIR/.env.local"

    print_success "Application files installed"
}

# Wait for app to start (called after PM2 starts the app)
wait_for_app_start() {
    # Wait for app to be ready (max 60 seconds)
    local max_attempts=60
    local attempt=0
    local app_url="http://127.0.0.1:$APP_PORT"

    print_status "Waiting for application to start on port $APP_PORT..."
    echo -n "  "
    while [[ $attempt -lt $max_attempts ]]; do
        # Check if port is listening and app responds (any HTTP status = app is running)
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$app_url/api/v1/setup/status" 2>/dev/null)
        if [[ "$http_code" =~ ^[2345][0-9][0-9]$ ]]; then
            echo ""
            if [[ "$http_code" == "200" ]]; then
                print_success "Application is running"
            else
                print_warning "Application started but returned HTTP $http_code"
                print_warning "This may be normal for first-time setup. Check the web interface."
            fi
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done

    echo ""
    print_error "Application failed to start within 60 seconds"
    echo ""
    print_error "Checking PM2 status and recent logs:"
    echo ""
    "$PM2_BIN" status 2>/dev/null
    echo ""
    echo "Recent error logs:"
    "$PM2_BIN" logs supascale-web --lines 20 --nostream 2>/dev/null || cat /var/log/supascale/error.log 2>/dev/null | tail -20
    echo ""
    print_error "Please check the logs above and fix any issues."
    exit 1
}

# Configure PM2
configure_pm2() {
    print_status "Configuring PM2..."

    # Verify PM2 is accessible
    if [[ ! -x "$PM2_BIN" ]]; then
        print_error "PM2 binary not found or not executable: $PM2_BIN"
        exit 1
    fi

    # Create PM2 ecosystem file
    # Note: Running as root for simplicity. The app itself doesn't need root privileges
    # but PM2's uid/gid feature requires complex permission setup.
    cat > "$INSTALL_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'supascale-web',
      script: 'server.js',
      cwd: '$INSTALL_DIR/.build/standalone',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: $APP_PORT,
        HOSTNAME: '0.0.0.0',
      },
      error_file: '/var/log/supascale/error.log',
      out_file: '/var/log/supascale/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },
  ],
};
EOF

    chown "$TARGET_USER:$TARGET_USER" "$INSTALL_DIR/ecosystem.config.js"

    # Start with PM2 as root - PM2 will drop privileges to TARGET_USER via uid/gid in config
    cd "$INSTALL_DIR"
    print_status "Starting application with PM2..."

    # Run PM2 as root - it will use uid/gid from ecosystem config to run the app as TARGET_USER
    "$PM2_BIN" start ecosystem.config.js

    if [[ $? -ne 0 ]]; then
        print_error "Failed to start PM2"
        "$PM2_BIN" logs supascale-web --lines 10 --nostream 2>/dev/null
        exit 1
    fi

    "$PM2_BIN" save

    # Setup PM2 startup to run as root (it manages user switching internally)
    "$PM2_BIN" startup systemd 2>/dev/null || true

    print_success "PM2 configured and started"
}

# Configure web server
configure_web_server() {
    if [[ "$WEB_SERVER" == "none" ]]; then
        return
    fi

    print_status "Configuring $WEB_SERVER..."

    case $WEB_SERVER in
        nginx)
            configure_nginx
            ;;
        apache)
            configure_apache
            ;;
        caddy)
            configure_caddy
            ;;
    esac
}

configure_nginx() {
    # Install nginx if not present
    if ! command -v nginx &> /dev/null; then
        if command -v apt-get &> /dev/null; then
            apt-get install -y nginx
        elif command -v dnf &> /dev/null; then
            dnf install -y nginx
        elif command -v yum &> /dev/null; then
            yum install -y nginx
        fi
    fi

    # Create config
    NGINX_CONF="/etc/nginx/sites-available/supascale"
    sed -e "s/\${DOMAIN}/${DOMAIN:-_}/g" \
        -e "s/\${APP_PORT}/$APP_PORT/g" \
        "$INSTALL_DIR/templates/nginx.conf.template" > "$NGINX_CONF"

    # Enable site
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/supascale

    # Test and reload
    nginx -t
    systemctl reload nginx
    systemctl enable nginx

    print_success "Nginx configured"

    # SSL with Let's Encrypt
    if [[ "$ENABLE_SSL" =~ ^[Yy] && -n "$DOMAIN" ]]; then
        configure_ssl_nginx
    fi
}

configure_apache() {
    # Install apache if not present
    if ! command -v apache2 &> /dev/null && ! command -v httpd &> /dev/null; then
        if command -v apt-get &> /dev/null; then
            apt-get install -y apache2
            a2enmod proxy proxy_http proxy_wstunnel rewrite headers
        elif command -v dnf &> /dev/null; then
            dnf install -y httpd mod_ssl
        elif command -v yum &> /dev/null; then
            yum install -y httpd mod_ssl
        fi
    fi

    # Create config
    if [[ -d /etc/apache2 ]]; then
        APACHE_CONF="/etc/apache2/sites-available/supascale.conf"
    else
        APACHE_CONF="/etc/httpd/conf.d/supascale.conf"
    fi

    sed -e "s/\${DOMAIN}/${DOMAIN:-_}/g" \
        -e "s/\${APP_PORT}/$APP_PORT/g" \
        "$INSTALL_DIR/templates/apache.conf.template" > "$APACHE_CONF"

    # Enable site
    if [[ -d /etc/apache2 ]]; then
        a2ensite supascale
        systemctl reload apache2
        systemctl enable apache2
    else
        systemctl reload httpd
        systemctl enable httpd
    fi

    print_success "Apache configured"
}

configure_caddy() {
    # Install caddy if not present
    if ! command -v caddy &> /dev/null; then
        if command -v apt-get &> /dev/null; then
            apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
            curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
            curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
            apt-get update
            apt-get install -y caddy
        else
            print_warning "Automatic Caddy installation not supported. Please install manually."
            return
        fi
    fi

    # Create log directory
    mkdir -p /var/log/caddy

    # Create config
    if [[ -n "$DOMAIN" ]]; then
        sed -e "s/\${DOMAIN}/$DOMAIN/g" \
            -e "s/\${APP_PORT}/$APP_PORT/g" \
            "$INSTALL_DIR/templates/caddy.conf.template" > /etc/caddy/Caddyfile
    else
        cat > /etc/caddy/Caddyfile << EOF
:80 {
    reverse_proxy 127.0.0.1:$APP_PORT {
        flush_interval -1
    }
}
EOF
    fi

    systemctl reload caddy
    systemctl enable caddy

    print_success "Caddy configured"
}

configure_ssl_nginx() {
    print_status "Configuring SSL with Let's Encrypt..."

    # Install certbot
    if ! command -v certbot &> /dev/null; then
        if command -v apt-get &> /dev/null; then
            apt-get install -y certbot python3-certbot-nginx
        elif command -v dnf &> /dev/null; then
            dnf install -y certbot python3-certbot-nginx
        fi
    fi

    # Get certificate
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect

    print_success "SSL configured"
}

# Configure firewall
configure_firewall() {
    if [[ ! "$SETUP_FIREWALL" =~ ^[Yy] ]]; then
        return
    fi

    # Use firewalld on RHEL/CentOS/Fedora, UFW on Debian/Ubuntu
    if [[ "$OS_TYPE" == "rhel" || "$OS_TYPE" == "fedora" ]] || command -v firewall-cmd &> /dev/null; then
        configure_firewalld
    else
        configure_ufw
    fi
}

# Configure firewalld (RHEL/CentOS/Fedora)
configure_firewalld() {
    print_status "Configuring firewalld..."

    # Ensure firewalld is installed and running
    if ! command -v firewall-cmd &> /dev/null; then
        if command -v dnf &> /dev/null; then
            dnf install -y firewalld
        elif command -v yum &> /dev/null; then
            yum install -y firewalld
        else
            print_warning "firewalld not available. Skipping firewall configuration."
            return
        fi
    fi

    # Enable and start firewalld
    systemctl enable firewalld
    systemctl start firewalld

    # Add permanent rules
    firewall-cmd --permanent --add-service=ssh      # SSH
    firewall-cmd --permanent --add-service=http     # HTTP
    firewall-cmd --permanent --add-service=https    # HTTPS

    # Allow app port if no web server
    if [[ "$WEB_SERVER" == "none" ]]; then
        firewall-cmd --permanent --add-port="$APP_PORT/tcp"
    fi

    # Reload to apply permanent rules
    firewall-cmd --reload

    print_success "Firewalld configured"
}

# Configure UFW (Debian/Ubuntu)
configure_ufw() {
    print_status "Configuring UFW firewall..."

    if ! command -v ufw &> /dev/null; then
        if command -v apt-get &> /dev/null; then
            apt-get install -y ufw
        else
            print_warning "UFW not available. Skipping firewall configuration."
            return
        fi
    fi

    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS

    # Allow app port if no web server
    if [[ "$WEB_SERVER" == "none" ]]; then
        ufw allow "$APP_PORT/tcp"
    fi

    ufw --force enable

    print_success "UFW firewall configured"
}

# Print completion message
print_completion() {
    local server_ip=$(hostname -I | awk '{print $1}')

    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "                    Installation Complete!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "  Supascale Web has been installed successfully!"
    echo ""
    echo "  Access URLs:"
    if [[ -n "$DOMAIN" ]]; then
        if [[ "$WEB_SERVER" == "caddy" ]] || [[ "$ENABLE_SSL" =~ ^[Yy] ]]; then
            echo "    Domain: https://$DOMAIN"
        else
            echo "    Domain: http://$DOMAIN"
        fi
    fi
    echo "    Direct:  http://$server_ip:$APP_PORT"
    echo ""
    echo "  ┌─────────────────────────────────────────────────────────────┐"
    echo "  │  Visit the URL above to create your admin account and       │"
    echo "  │  complete the setup.                                        │"
    echo "  └─────────────────────────────────────────────────────────────┘"
    echo ""
    echo "  Useful commands:"
    echo "    pm2 status              - Check application status"
    echo "    pm2 logs supascale-web  - View application logs"
    echo "    pm2 restart supascale-web - Restart application"
    echo ""
    echo "  Installation directory: $INSTALL_DIR"
    echo "  Data directory: $DATA_DIR"
    echo "  Log files: /var/log/supascale/"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
}

# Main installation flow
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║              Welcome to Supascale Web Installer               ║"
    echo "║                                                               ║"
    echo "║  This script will install Supascale Web on your server.      ║"
    echo "║  It will configure the application, web server, and          ║"
    echo "║  process manager for production use.                         ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    check_root
    detect_user
    check_prerequisites
    configure_installation

    # Configure Podman storage location before installing (to avoid re-pulling images)
    if [[ "$CONTAINER_RUNTIME" == "podman" && -n "$CONTAINER_STORAGE" ]]; then
        configure_podman_storage "$CONTAINER_STORAGE"
    fi

    generate_secrets
    install_application
    configure_pm2
    wait_for_app_start
    configure_web_server
    configure_firewall
    print_completion
}

# Run main function
main "$@"
