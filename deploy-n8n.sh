#!/bin/bash

# N8N Production Deployment Script
echo "🚀 Deploying N8N to production server..."

# 1. Install Docker (if not already installed)
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# 2. Install Docker Compose (if not already installed)
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 3. Create N8N directory
mkdir -p ~/n8n-production
cd ~/n8n-production

# 4. Copy docker-compose file
cp /path/to/your/docker-compose.n8n.yml ./docker-compose.yml

# 5. Start N8N
echo "🚀 Starting N8N..."
docker-compose up -d

# 6. Check status
echo "✅ N8N Status:"
docker-compose ps

echo "🌐 N8N will be available at: https://your-domain.com:5678"
echo "🔐 Login with: admin / your_secure_password"
