#!/bin/bash
# Script to remove duplicate IdenTrust certificates from Keychain

echo "🗑️  Removing duplicate IdenTrust certificates from Keychain..."
echo "⚠️  This will remove both 'Jason M Kahan' certificates and their private keys"
echo ""

# Find all certificates matching "Jason M Kahan"
CERTS=$(security find-certificate -a -c "Jason M Kahan" -Z 2>/dev/null | grep "SHA-1" | awk '{print $NF}')

if [ -z "$CERTS" ]; then
    echo "❌ No certificates found matching 'Jason M Kahan'"
    exit 1
fi

echo "📋 Found certificates:"
echo "$CERTS"
echo ""

# Remove each certificate
for cert_hash in $CERTS; do
    echo "🗑️  Removing certificate: $cert_hash"
    security delete-certificate -Z "$cert_hash" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "   ✅ Removed"
    else
        echo "   ⚠️  Could not remove (may need to remove manually)"
    fi
done

# Remove private keys
echo ""
echo "🗑️  Removing private keys..."
security delete-generic-password -l "IdenTrust encryption created on 2025 Oct 31 23:36:19" 2>/dev/null
security delete-generic-password -l "IdenTrust created on 2025 Oct 31 23:36:07" 2>/dev/null

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Contact IdenTrust to get a fresh certificate"
echo "   2. Download and install the certificate"
echo "   3. Export it as .p12 with 'Include all certificates' checked"
echo "   4. Save to certs/identrust.p12"
echo "   5. Update CERT_PASSWORD in .env"


