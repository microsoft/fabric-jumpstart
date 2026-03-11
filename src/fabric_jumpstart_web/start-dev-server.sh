#!/usr/bin/env bash
# Idempotent dev server launcher — kills any existing Next.js dev server on the
# target port, cleans the .next cache, and starts fresh.

set -euo pipefail

PORT="${1:-8080}"
DIR="$(cd "$(dirname "$0")" && pwd)"

# Load nvm if available
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Kill any process already listening on the port
pid=$(lsof -ti :"$PORT" 2>/dev/null || true)
if [ -z "$pid" ]; then
  pid=$(ss -tlnp sport = :"$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1 || true)
fi
if [ -n "$pid" ]; then
  echo "⏹  Killing existing process on port $PORT (PID: $pid)"
  kill "$pid" 2>/dev/null || true
  sleep 1
  # Force kill if still running
  kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
  sleep 1
fi

# Clean cached build
echo "🧹 Cleaning .next cache"
rm -rf "$DIR/.next"

# Start dev server
echo "🚀 Starting Next.js dev server on http://localhost:$PORT"
cd "$DIR"
exec npx next dev -p "$PORT"
