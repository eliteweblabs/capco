#!/bin/bash

# Monitor Supabase recovery
echo "🔍 Monitoring Supabase recovery..."
echo "Started at: $(date)"
echo "Press Ctrl+C to stop"
echo ""

while true; do
    response=$(curl -s http://localhost:4321/api/check-supabase-status)
    timestamp=$(date '+%H:%M:%S')
    
    if echo "$response" | grep -q '"status":"up"'; then
        echo "✅ $timestamp - Supabase is UP! 🎉"
        echo "Response: $response"
        break
    else
        echo "❌ $timestamp - Still down..."
        if echo "$response" | grep -q "Timeout"; then
            echo "   Status: Connection timeout"
        else
            echo "   Response: $(echo "$response" | head -c 100)..."
        fi
    fi
    
    sleep 60  # Check every minute
done

echo ""
echo "🚀 Supabase is back online! You can now:"
echo "1. Go to Supabase Dashboard"
echo "2. Run: ALTER TABLE project_statuses DISABLE ROW LEVEL SECURITY;"
echo "3. Set FALLBACK_MODE = false in src/lib/supabase-fallback.ts"
echo "4. Restart your server"
