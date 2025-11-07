#!/bin/bash
# Script to trust IdenTrust Global Common Root CA 1

echo "🔐 Trusting IdenTrust Global Common Root CA 1..."

# Find the certificate hash
CERT_HASH=$(security find-certificate -a -c "IdenTrust Global Common Root CA 1" -Z 2>/dev/null | grep "SHA-1" | head -1 | awk '{print $NF}')

if [ -z "$CERT_HASH" ]; then
    echo "❌ Could not find certificate hash"
    exit 1
fi

echo "📋 Certificate hash: $CERT_HASH"

# Add to System keychain and trust it
echo "🔓 You may be prompted for your password..."
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain \
    "$(security find-certificate -c 'IdenTrust Global Common Root CA 1' -p 2>/dev/null)"

if [ $? -eq 0 ]; then
    echo "✅ Root CA certificate has been trusted"
    echo "🔄 Please restart Keychain Access to see the change"
else
    echo "⚠️  Could not add to System keychain (may need admin access)"
    echo "💡 Alternative: Trust it manually in Keychain Access:"
    echo "   1. Open Keychain Access"
    echo "   2. Search for 'IdenTrust Global Common Root CA 1'"
    echo "   3. Double-click it"
    echo "   4. Expand 'Trust' section"
    echo "   5. Set 'When using this certificate' to 'Always Trust'"
    echo "   6. Close and enter your password"
fi



