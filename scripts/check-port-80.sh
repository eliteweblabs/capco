#!/usr/bin/env bash
# Check what process is using port 80 (often DevKinsta nginx or Apache).
# If the port is in use, you may see "stopped by DevKinsta" when the browser strips :4321.
# Stop the process (e.g. sudo killall nginx) or quit the app that started it.
echo "Checking what is using port 80..."
echo ""
if command -v lsof >/dev/null 2>&1; then
  lsof -i :80 || echo "(nothing found or permission denied - try: sudo lsof -i :80)"
else
  echo "lsof not found. On Windows try: netstat -ano | findstr :80"
fi
