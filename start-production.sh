#!/bin/bash

<<<<<<< HEAD
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
=======
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
>>>>>>> 0ecd353db3dfed7cd138b6c46f450566f027a497
