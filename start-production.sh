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

# For now, only start Astro application (Socket.io integration needed)
echo "Starting Astro application..."
node ./dist/server/entry.mjs &
ASTRO_PID=$!
echo "Astro application started with PID: $ASTRO_PID"

# TODO: Integrate Socket.io with Astro server instead of running separately
# The separate Socket.io server on port 3001 is not accessible from Railway

# Function to gracefully shut down processes
cleanup() {
  echo "Shutting down processes..."
  if [ ! -z "$ASTRO_PID" ]; then
    kill $ASTRO_PID 2>/dev/null
  fi
  echo "Processes shut down."
  exit 0
}

# Trap signals to ensure graceful shutdown
trap cleanup TERM INT

echo "Astro server started. Waiting for process to finish..."

# Keep the script running and wait for the process
wait $ASTRO_PID