#!/bin/bash
#
# Supascale Web - Release Build Script
# Creates a distribution tarball for paying customers
#
# Usage: ./scripts/build-release.sh [patch|minor|major]
#
# Arguments:
#   patch  - Bump patch version (1.0.11 → 1.0.12) [default]
#   minor  - Bump minor version (1.0.11 → 1.1.0)
#   major  - Bump major version (1.0.11 → 2.0.0)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Determine version bump type (default: patch)
BUMP_TYPE="${1:-patch}"
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "Invalid bump type: $BUMP_TYPE"
    echo "Usage: $0 [patch|minor|major]"
    exit 1
fi

# Get current version and bump it
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

VERSION="${MAJOR}.${MINOR}.${PATCH}"

# Update package.json with new version
print_step "Bumping version: ${CURRENT_VERSION} → ${VERSION} (${BUMP_TYPE})"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
pkg.version = '${VERSION}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
print_success "Updated package.json"

# Generate version.ts with new version and build date
print_step "Generating version info..."
node scripts/generate-version.js
print_success "Generated src/lib/version.ts"

DIST_NAME="supascale-web-${VERSION}"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           Supascale Web - Release Build Script                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Version: ${CURRENT_VERSION} → ${VERSION} (${BUMP_TYPE} bump)"
echo ""

# Check for dev bypasses
print_step "Checking for development bypasses..."
if grep -rq "SKIP_LICENSE_CHECK.*true" src/ 2>/dev/null; then
    print_warning "Found SKIP_LICENSE_CHECK in source files!"
    print_warning "Remove DEV_BYPASS blocks before production release."
    echo ""
    read -p "Continue anyway? (for testing) [y/N]: " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy] ]]; then
        exit 1
    fi
else
    print_success "No development bypasses found in source"
fi

# Clean previous builds
print_step "Cleaning previous builds..."
rm -rf .next dist
print_success "Cleaned"

# Install dependencies
print_step "Installing dependencies..."
npm ci --silent
print_success "Dependencies installed"

# Run type check
print_step "Running type check..."
npx tsc --noEmit
print_success "Type check passed"

# Run linting
print_step "Running linter..."
npm run lint --silent || true
print_success "Linting complete"

# Build standalone
print_step "Building standalone version..."
npm run build --silent
print_success "Build complete"

# Verify build output
print_step "Verifying build output..."
if [[ ! -d ".next/standalone" ]]; then
    print_error "Standalone directory not found!"
    exit 1
fi
if [[ ! -f ".next/standalone/server.js" ]]; then
    print_error "server.js not found!"
    exit 1
fi
if [[ ! -d ".next/static" ]]; then
    print_error "Static directory not found!"
    exit 1
fi
print_success "Build output verified"

# Create distribution directory
print_step "Creating distribution package..."
DIST_DIR="dist/${DIST_NAME}"
mkdir -p "${DIST_DIR}/.build"

# Copy standalone build (includes .next with server files)
cp -r .next/standalone "${DIST_DIR}/.build/"

# Copy static assets into the standalone .next directory
cp -r .next/static "${DIST_DIR}/.build/standalone/.next/"

# Copy public directory
if [[ -d "public" ]]; then
    cp -r public "${DIST_DIR}/.build/standalone/"
fi

# Copy scripts directory (needed for setup-admin.js during install)
if [[ -d "scripts" ]]; then
    cp -r scripts "${DIST_DIR}/"
fi

# Copy installer scripts
cp install.sh "${DIST_DIR}/"
cp uninstall.sh "${DIST_DIR}/"
chmod +x "${DIST_DIR}/install.sh" "${DIST_DIR}/uninstall.sh"

# Copy templates
cp -r templates "${DIST_DIR}/"

# Copy documentation
cp README.md "${DIST_DIR}/" 2>/dev/null || print_warning "No README.md found"
cp LICENSE "${DIST_DIR}/" 2>/dev/null || print_warning "No LICENSE found"

print_success "Distribution directory created"

# Create tarball
print_step "Creating tarball..."
cd dist
tar -czf "${DIST_NAME}.tar.gz" "${DIST_NAME}"
print_success "Tarball created"

# Generate checksum
print_step "Generating checksum..."
sha256sum "${DIST_NAME}.tar.gz" > "${DIST_NAME}.tar.gz.sha256"
print_success "Checksum generated"

# Calculate size
SIZE=$(ls -lh "${DIST_NAME}.tar.gz" | awk '{print $5}')
CHECKSUM=$(cat "${DIST_NAME}.tar.gz.sha256" | awk '{print $1}')

cd ..

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    Build Complete!                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Package: dist/${DIST_NAME}.tar.gz"
echo "  Size:    ${SIZE}"
echo "  SHA256:  ${CHECKSUM:0:16}..."
echo ""
echo "  Contents:"
echo "    .build/standalone/  - Compiled application"
echo "    templates/          - Web server configs"
echo "    install.sh          - Interactive installer"
echo "    uninstall.sh        - Uninstaller"
echo ""
echo "  To test installation:"
echo "    tar -xzf dist/${DIST_NAME}.tar.gz"
echo "    cd ${DIST_NAME}"
echo "    sudo ./install.sh"
echo ""
