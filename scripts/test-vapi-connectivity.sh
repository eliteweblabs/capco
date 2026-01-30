#!/bin/bash

# VAPI Widget CDN Test Script
# Tests connectivity to VAPI services

echo "🔍 Testing VAPI Widget Connectivity..."
echo "======================================"
echo ""

# Test 1: CDN Availability
echo "1. Testing CDN (unpkg.com)..."
if curl -I -s --max-time 10 "https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js" | grep -q "200"; then
    echo "   ✅ CDN is accessible"
else
    echo "   ❌ CDN is not accessible"
    echo "   This could be due to:"
    echo "   - Firewall blocking unpkg.com"
    echo "   - Network connectivity issues"
    echo "   - Corporate proxy restrictions"
fi
echo ""

# Test 2: VAPI API Endpoint
echo "2. Testing VAPI API (api.vapi.ai)..."
if curl -I -s --max-time 10 "https://api.vapi.ai" | grep -q "HTTP"; then
    echo "   ✅ VAPI API endpoint is reachable"
else
    echo "   ❌ VAPI API endpoint is not reachable"
    echo "   This could be due to:"
    echo "   - Firewall blocking api.vapi.ai"
    echo "   - Network connectivity issues"
    echo "   - VAPI service downtime"
fi
echo ""

# Test 3: Check environment variables
echo "3. Checking environment variables..."
if [ -f ".env" ]; then
    if grep -q "PUBLIC_VAPI_KEY" .env && grep -q "PUBLIC_VAPI_ASSISTANT_ID" .env; then
        echo "   ✅ Environment variables are set in .env"
        
        # Extract values (safely, without exposing full keys)
        VAPI_KEY=$(grep "PUBLIC_VAPI_KEY" .env | cut -d'=' -f2 | tr -d '[:space:]')
        VAPI_ASSISTANT=$(grep "PUBLIC_VAPI_ASSISTANT_ID" .env | cut -d'=' -f2 | tr -d '[:space:]')
        
        if [ -n "$VAPI_KEY" ]; then
            KEY_PREFIX="${VAPI_KEY:0:8}"
            KEY_SUFFIX="${VAPI_KEY: -4}"
            echo "   PUBLIC_VAPI_KEY: ${KEY_PREFIX}...${KEY_SUFFIX}"
        else
            echo "   ⚠️  PUBLIC_VAPI_KEY is empty"
        fi
        
        if [ -n "$VAPI_ASSISTANT" ]; then
            ASST_PREFIX="${VAPI_ASSISTANT:0:8}"
            ASST_SUFFIX="${VAPI_ASSISTANT: -4}"
            echo "   PUBLIC_VAPI_ASSISTANT_ID: ${ASST_PREFIX}...${ASST_SUFFIX}"
        else
            echo "   ⚠️  PUBLIC_VAPI_ASSISTANT_ID is empty"
        fi
    else
        echo "   ❌ Environment variables are not set in .env"
    fi
else
    echo "   ❌ .env file not found"
fi
echo ""

# Test 4: Download widget script (first 100 bytes to verify it's JavaScript)
echo "4. Testing widget script download..."
SCRIPT_SAMPLE=$(curl -s --max-time 10 "https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js" | head -c 100)
if echo "$SCRIPT_SAMPLE" | grep -q "function\|var\|const\|let"; then
    echo "   ✅ Widget script downloads successfully and appears to be valid JavaScript"
else
    echo "   ❌ Widget script download failed or is not valid JavaScript"
fi
echo ""

# Summary
echo "======================================"
echo "Test complete!"
echo ""
echo "Next steps:"
echo "1. If CDN tests failed, check firewall/network settings"
echo "2. If env vars are missing, add them to .env file"
echo "3. Visit /tests/vapi-debug in your browser for detailed diagnostics"
echo "4. Check VAPI dashboard: https://dashboard.vapi.ai"
