#!/bin/sh

echo "Starting Astro application and Socket.io server..."

# Debug: Print runtime environment variables
echo "🔍 RUNTIME ENV CHECK:"
echo "SITE_URL: $SITE_URL"
echo "NODE_ENV: $NODE_ENV"
echo "SUPABASE_URL: $SUPABASE_URL"
echo "PORT: $PORT"
echo "EMAIL_LOGO_LIGHT: $EMAIL_LOGO_LIGHT"
echo "COMPANY_LOGO_LIGHT: $COMPANY_LOGO_LIGHT"
echo "PRIMARY_COLOR: $PRIMARY_COLOR"

# Start Socket.io server in the background
echo "Starting Socket.io server..."
node socketio-chat-server.js &
SOCKET_PID=$!
echo "Socket.io server started with PID: $SOCKET_PID"

# Start Astro application
echo "Starting Astro application..."
node ./dist/server/entry.mjs &
ASTRO_PID=$!
echo "Astro application started with PID: $ASTRO_PID"

# Function to gracefully shut down processes
cleanup() {
  echo "Shutting down processes..."
  if [ ! -z "$SOCKET_PID" ]; then
    kill $SOCKET_PID 2>/dev/null
  fi
  if [ ! -z "$ASTRO_PID" ]; then
    kill $ASTRO_PID 2>/dev/null
  fi
  echo "Processes shut down."
  exit 0
}

# Trap signals to ensure graceful shutdown
trap cleanup TERM INT

echo "Both servers started. Waiting for processes to finish..."

# Keep the script running and wait for both processes
wait