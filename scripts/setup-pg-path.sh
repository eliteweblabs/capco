#!/bin/bash

# =====================================================
# Setup PostgreSQL PATH
# Adds PostgreSQL binaries to PATH for current session
# =====================================================

PG_PATH="$(brew --prefix postgresql@15)/bin"

if [ -d "$PG_PATH" ]; then
    export PATH="$PG_PATH:$PATH"
    echo "✅ Added PostgreSQL to PATH: $PG_PATH"
    echo ""
    echo "pg_dump: $(which pg_dump)"
    echo "psql: $(which psql)"
    echo ""
    echo "To make permanent, add to ~/.zshrc:"
    echo "  export PATH=\"\$(brew --prefix postgresql@15)/bin:\$PATH\""
else
    echo "❌ PostgreSQL not found at: $PG_PATH"
    echo "Install with: brew install postgresql@15"
fi
