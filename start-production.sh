#!/bin/sh

echo "Starting Astro application..."

# Initialize persistent content storage (preserves custom content across deployments)
if [ -f "./scripts/init-persistent-content.sh" ]; then
  echo "Initializing persistent content..."
  ./scripts/init-persistent-content.sh || echo "⚠️ Content init script failed, continuing..."
fi

# Debug: Print runtime environment variables
echo "🔍 RUNTIME ENV CHECK:"
echo "RAILWAY_PUBLIC_DOMAIN: $RAILWAY_PUBLIC_DOMAIN"
echo "NODE_ENV: $NODE_ENV"
echo "PUBLIC_SUPABASE_URL: $PUBLIC_SUPABASE_URL"
echo "PORT: $PORT"
echo "EMAIL_LOGO_LIGHT: $EMAIL_LOGO_LIGHT"
echo "COMPANY_LOGO: $COMPANY_LOGO"
echo "GLOBAL_COLOR_PRIMARY: $GLOBAL_COLOR_PRIMARY"
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+***configured***}"

# Start Astro server with Node adapter
echo "Starting Astro server with Node adapter..."
node dist/server/entry.mjs &
SERVER_PID=$!
echo "Astro server started with PID: $SERVER_PID"

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

