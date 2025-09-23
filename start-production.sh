#!/bin/bash

# Production Startup Script
# Starts both the main Astro application and the Socket.io chat server

echo "🚀 Starting CAPCo Fire Protection Systems..."

# Function to handle cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$ASTRO_PID" ]; then
        kill $ASTRO_PID 2>/dev/null
    fi
    if [ ! -z "$SOCKETIO_PID" ]; then
        kill $SOCKETIO_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start Socket.io chat server in background
echo "🔗 Starting Socket.io chat server on port 3001..."
node socketio-chat-server.js &
SOCKETIO_PID=$!

# Wait a moment for Socket.io server to start
sleep 2

# Start main Astro application
echo "🌐 Starting main application on port $PORT..."
node ./dist/server/entry.mjs &
ASTRO_PID=$!

# Wait for both processes
wait $ASTRO_PID $SOCKETIO_PID
