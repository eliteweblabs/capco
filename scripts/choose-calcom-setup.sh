#!/bin/bash

# Cal.com Setup Choice Script
# This script helps you choose between local and remote Cal.com setup

set -e

echo "📅 Cal.com Setup Choice"
echo "======================="
echo ""
echo "You have two options for Cal.com setup:"
echo ""
echo "1. 🏠 LOCAL SETUP (Recommended)"
echo "   - Deploy Cal.com in your workspace"
echo "   - Share database with your main app"
echo "   - Better integration and development"
echo "   - Cost effective"
echo ""
echo "2. 🌐 REMOTE SETUP"
echo "   - Use existing Cal.com instance"
echo "   - Separate database"
echo "   - Less integration complexity"
echo "   - External dependency"
echo ""

read -p "Choose setup type (1 for local, 2 for remote): " choice

case $choice in
    1)
        echo ""
        echo "🏠 Setting up LOCAL Cal.com..."
        echo ""
        echo "This will:"
        echo "✅ Deploy Cal.com in Docker"
        echo "✅ Use your Supabase database"
        echo "✅ Create local API integration"
        echo "✅ Set up webhooks"
        echo ""
        read -p "Continue with local setup? (y/n): " confirm
        
        if [[ $confirm == "y" || $confirm == "Y" ]]; then
            echo "🚀 Starting local Cal.com setup..."
            ./scripts/setup-calcom-local.sh
        else
            echo "❌ Setup cancelled"
            exit 0
        fi
        ;;
    2)
        echo ""
        echo "🌐 Using REMOTE Cal.com..."
        echo ""
        echo "This will:"
        echo "✅ Use existing Cal.com instance"
        echo "✅ Create remote API integration"
        echo "✅ Set up webhooks for remote instance"
        echo "⚠️  Requires separate database setup"
        echo ""
        read -p "Continue with remote setup? (y/n): " confirm
        
        if [[ $confirm == "y" || $confirm == "Y" ]]; then
            echo "🚀 Starting remote Cal.com setup..."
            ./scripts/setup-vapi-cal-integration.sh
        else
            echo "❌ Setup cancelled"
            exit 0
        fi
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test your Cal.com instance"
echo "2. Configure your Vapi.ai assistant"
echo "3. Test the integration"
echo ""
echo "📚 Documentation:"
echo "- Local setup: CALCOM_LOCAL_SETUP.md"
echo "- Remote setup: VAPI_CAL_INTEGRATION.md"
echo ""
echo "🔧 Useful commands:"
echo "- View logs: docker-compose -f docker-compose.cal.yml logs"
echo "- Test integration: node scripts/test-vapi-cal-integration.js"
echo "- Stop Cal.com: docker-compose -f docker-compose.cal.yml down"
