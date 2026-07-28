#!/usr/bin/env bash
# Starts the Vite dev server (HMR, fast iteration) in the background on a
# fixed port, for local browser testing (e.g. via VS Code port forwarding).
# See tools/dev/README.md.
#
# Usage: tools/dev/start-dev.sh [port, default 5173]

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

PORT="${1:-5173}"
LOG_DIR="tools/dev/logs"
LOG_FILE="$LOG_DIR/dev.log"

mkdir -p "$LOG_DIR"

EXISTING=$(lsof -ti:"$PORT" -sTCP:LISTEN || true)
if [[ -n "$EXISTING" ]]; then
  echo "Port $PORT already in use (pid $EXISTING) - stopping it first."
  echo "$EXISTING" | xargs kill
  sleep 1
fi

(npm run dev -- --port "$PORT" --strictPort > "$LOG_FILE" 2>&1 &)

echo -n "Waiting for dev server on port $PORT"
for _ in $(seq 1 30); do
  if curl -sf "http://localhost:$PORT" >/dev/null 2>&1; then
    echo
    echo "Up: http://localhost:$PORT  (log: $LOG_FILE)"
    exit 0
  fi
  echo -n "."
  sleep 1
done

echo
echo "Server did not come up within 30s - check $LOG_FILE" >&2
exit 1
