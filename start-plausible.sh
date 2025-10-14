#!/bin/bash

# Plausible Analytics Startup Script
echo "🚀 Starting Plausible Analytics..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env.plausible ]; then
    echo "📝 Creating .env.plausible file..."
    cat > .env.plausible << EOF
# Plausible Analytics Environment Variables
SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n')
ADMIN_USER_EMAIL=admin@capcofire.com
ADMIN_USER_NAME=CAPCo Admin
ADMIN_USER_PWD=$(openssl rand -base64 32 | tr -d '\n')
BASE_URL=http://localhost:8000
EOF
    echo "✅ Created .env.plausible file with secure random values"
    echo "🔐 Admin credentials:"
    echo "   Email: admin@capcofire.com"
    echo "   Password: Check the .env.plausible file for ADMIN_USER_PWD"
fi

# Start Plausible Analytics
echo "🚀 Starting Plausible Analytics services..."
docker-compose -f docker-compose.plausible.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "📊 Checking service status..."
docker-compose -f docker-compose.plausible.yml ps

echo ""
echo "✅ Plausible Analytics is starting up!"
echo "🌐 Access the dashboard at: http://localhost:8000"
echo "🔐 Login with the admin credentials from .env.plausible"
echo ""
echo "📝 To stop Plausible Analytics:"
echo "   docker-compose -f docker-compose.plausible.yml down"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f docker-compose.plausible.yml logs -f"
