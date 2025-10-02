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
echo "GLOBAL_COLOR_PRIMARY: $GLOBAL_COLOR_PRIMARY"

# Start integrated Astro + Socket.io server
echo "Starting integrated Astro + Socket.io server..."
node server.mjs &
SERVER_PID=$!
echo "Integrated server started with PID: $SERVER_PID"

# Function to gracefully shut down processes
cleanup() {
  echo "Shutting down processes..."
  if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null
  fi
  echo "Processes shut down."
  exit 0
}

# Trap signals to ensure graceful shutdown
trap cleanup TERM INT

echo "Integrated server started. Waiting for process to finish..."

# Keep the script running and wait for the process
wait $SERVER_PID

