#!/bin/bash

echo "🚀 Starting Astro application and Socket.io chat server..."

# Start Socket.io server in the background
echo "🔗 Starting Socket.io chat server on port ${CHAT_PORT:-3001}..."
node socketio-chat-server.js &
SOCKET_PID=$!
echo "Socket.io server started with PID: $SOCKET_PID"

# Start Astro application
echo "🌐 Starting Astro application on port ${PORT:-4321}..."
node ./dist/server/entry.mjs &
ASTRO_PID=$!
echo "Astro application started with PID: $ASTRO_PID"

# Function to gracefully shut down both processes
cleanup() {
    echo "SIGTERM received, shutting down processes..."
    kill $SOCKET_PID
    kill $ASTRO_PID
    wait $SOCKET_PID
    wait $ASTRO_PID
    echo "All processes shut down."
    exit 0
}

# Trap SIGTERM and SIGINT to call cleanup function
trap 'cleanup' SIGTERM SIGINT

# Wait indefinitely for background processes to finish
wait $SOCKET_PID
wait $ASTRO_PID
