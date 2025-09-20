#!/bin/bash

# Socket.io Chat Server Startup Script
# This script starts the Socket.io chat server with proper environment setup

echo "🚀 Starting Socket.io Chat Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your Supabase credentials:"
    echo "PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if required environment variables are set
if [ -z "$PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables!"
    echo "Please set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Socket.io dependencies are installed
if ! npm list socket.io > /dev/null 2>&1; then
    echo "📦 Installing Socket.io dependencies..."
    npm install socket.io express cors
fi

# Start the Socket.io server
echo "🔗 Starting Socket.io chat server on port 3001..."
echo "🌐 Server will be available at: http://localhost:3001"
echo "🔗 Chat widget will connect automatically"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node socketio-chat-server.js
