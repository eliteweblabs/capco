#!/bin/bash

# =====================================================
# CLONE PRODUCTION DATABASE TO DEVELOPMENT
# =====================================================
# This script creates a complete carbon copy of your production database
# to your development database
# =====================================================

set -e  # Exit on error

echo "🚀 Starting Production to Dev Database Clone..."
echo ""
echo "⚠️  WARNING: This will OVERWRITE your development database!"
echo "⚠️  All existing data in dev will be REPLACED with production data!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Clone cancelled."
    exit 0
fi

# =====================================================
# CONFIGURATION
# =====================================================

# Production Database (Source)
PROD_HOST="aws-0-us-east-1.pooler.supabase.com"
PROD_PORT="6543"
PROD_DB="postgres"
PROD_USER="postgres.qudlxlryegnainztkrtk"
PROD_PASSWORD=""  # Will prompt for this

# Development Database (Target)
DEV_HOST="aws-0-us-east-1.pooler.supabase.com"
DEV_PORT="6543"
DEV_DB="postgres"
DEV_USER="postgres.injgmunynstyterczuxg"
DEV_PASSWORD=""  # Will prompt for this

# Output file
DUMP_FILE="production_backup_$(date +%Y%m%d_%H%M%S).sql"

echo ""
echo "📦 Configuration:"
echo "  Source: $PROD_USER@$PROD_HOST:$PROD_PORT/$PROD_DB"
echo "  Target: $DEV_USER@$DEV_HOST:$DEV_PORT/$DEV_DB"
echo "  Dump file: $DUMP_FILE"
echo ""

# =====================================================
# STEP 1: Get Production Password
# =====================================================
echo "🔐 Enter PRODUCTION database password:"
read -s PROD_PASSWORD
echo ""

# =====================================================
# STEP 2: Export Production Database
# =====================================================
echo "📤 Exporting production database..."
PGPASSWORD="$PROD_PASSWORD" pg_dump \
  -h "$PROD_HOST" \
  -p "$PROD_PORT" \
  -U "$PROD_USER" \
  -d "$PROD_DB" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --schema=public \
  -f "$DUMP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Production database exported successfully!"
    echo "   File: $DUMP_FILE"
    file_size=$(du -h "$DUMP_FILE" | cut -f1)
    echo "   Size: $file_size"
else
    echo "❌ Export failed!"
    exit 1
fi

echo ""

# =====================================================
# STEP 3: Get Development Password
# =====================================================
echo "🔐 Enter DEVELOPMENT database password:"
read -s DEV_PASSWORD
echo ""

# =====================================================
# STEP 4: Import to Development Database
# =====================================================
echo "📥 Importing to development database..."
echo "   This may take a few minutes..."
PGPASSWORD="$DEV_PASSWORD" psql \
  -h "$DEV_HOST" \
  -p "$DEV_PORT" \
  -U "$DEV_USER" \
  -d "$DEV_DB" \
  -f "$DUMP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database cloned successfully!"
else
    echo "❌ Import failed!"
    echo "   The backup file is saved: $DUMP_FILE"
    exit 1
fi

echo ""

# =====================================================
# STEP 5: Verify
# =====================================================
echo "🔍 Verifying import..."
PGPASSWORD="$DEV_PASSWORD" psql \
  -h "$DEV_HOST" \
  -p "$DEV_PORT" \
  -U "$DEV_USER" \
  -d "$DEV_DB" \
  -c "SELECT 
        (SELECT COUNT(*) FROM project_statuses) as statuses_count,
        (SELECT COUNT(*) FROM profiles) as profiles_count,
        (SELECT COUNT(*) FROM projects) as projects_count;" \
  -t

echo ""
echo "✅ Clone complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Keep the backup file: $DUMP_FILE"
echo "   2. Test your localhost application"
echo "   3. If something went wrong, you can restore dev from backup"
echo ""
echo "⚠️  IMPORTANT: Your dev database now contains PRODUCTION DATA!"
echo "   - Real user emails and information"
echo "   - Real projects and files"
echo "   - Be careful not to send emails to real users from dev!"
echo ""

