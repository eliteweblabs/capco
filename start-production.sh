#!/bin/bash

echo "Starting Astro application and Socket.io server..."

# Start Socket.io server in the background
node socketio-chat-server.js &
SOCKET_PID=$!
echo "Socket.io server started with PID: $SOCKET_PID"

# Start Astro application
node ./dist/server/entry.mjs &
ASTRO_PID=$!
echo "Astro application started with PID: $ASTRO_PID"

# Function to gracefully shut down processes
cleanup() {
  echo "Shutting down processes..."
  kill $SOCKET_PID
  kill $ASTRO_PID
  wait $SOCKET_PID
  wait $ASTRO_PID
  echo "Processes shut down."
}

# Trap signals to ensure graceful shutdown
trap cleanup SIGTERM SIGINT

# Wait for both processes to finish
wait $SOCKET_PID
wait $ASTRO_PID