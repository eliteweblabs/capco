#!/bin/bash

# Test OTP Authentication Flow
# This script tests the OTP authentication endpoints

set -e

echo "🧪 Testing OTP Authentication Flow"
echo "===================================="
echo ""

# Configuration
BASE_URL="${1:-http://localhost:4321}"
TEST_EMAIL="${2:-test@example.com}"

echo "📍 Base URL: $BASE_URL"
echo "📧 Test Email: $TEST_EMAIL"
echo ""

# Test 1: Send OTP
echo "1️⃣  Testing Send OTP endpoint..."
echo "   POST $BASE_URL/api/auth/send-otp"

SEND_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"type\":\"magiclink\"}")

echo "   Response: $SEND_RESPONSE"

if echo "$SEND_RESPONSE" | grep -q "success"; then
    echo "   ✅ Send OTP endpoint is working"
else
    echo "   ❌ Send OTP endpoint failed"
    echo "   Response: $SEND_RESPONSE"
    exit 1
fi

echo ""
echo "2️⃣  Check your email at $TEST_EMAIL"
echo "   You should receive a 6-digit verification code"
echo ""

# Prompt for OTP code
read -p "   Enter the OTP code from your email: " OTP_CODE

if [ -z "$OTP_CODE" ]; then
    echo "   ⚠️  No code entered. Skipping verification test."
    exit 0
fi

echo ""
echo "3️⃣  Testing Verify OTP endpoint..."
echo "   POST $BASE_URL/api/auth/verify-otp"

VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"token\":\"$OTP_CODE\",\"type\":\"email\"}")

echo "   Response: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q "success"; then
    echo "   ✅ Verify OTP endpoint is working"
    echo ""
    echo "🎉 OTP Authentication Flow Test Complete!"
    echo ""
    echo "   All tests passed successfully!"
else
    echo "   ❌ Verify OTP endpoint failed"
    echo "   This could mean:"
    echo "     - The code is incorrect"
    echo "     - The code has expired"
    echo "     - The code was already used"
    echo ""
    echo "   Response: $VERIFY_RESPONSE"
    exit 1
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo "✅ Send OTP: Working"
echo "✅ Email Delivery: Working"
echo "✅ Verify OTP: Working"
echo ""
echo "Your OTP authentication system is fully functional! 🚀"
