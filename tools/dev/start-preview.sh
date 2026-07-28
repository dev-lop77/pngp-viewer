#!/usr/bin/env bash
# Builds the production bundle and serves it via `vite preview` in the
# background on a fixed port - the most faithful local simulation of real
# static hosting (GitHub Pages / self-managed Apache, docs/ARCHITECTURE.md
# §9), closer to reality than `npm run dev`. See tools/dev/README.md.
#
# Usage: tools/dev/start-preview.sh [port, default 4173]

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

PORT="${1:-4173}"
LOG_DIR="tools/dev/logs"
LOG_FILE="$LOG_DIR/preview.log"

mkdir -p "$LOG_DIR"

EXISTING=$(lsof -ti:"$PORT" -sTCP:LISTEN || true)
if [[ -n "$EXISTING" ]]; then
  echo "Port $PORT already in use (pid $EXISTING) - stopping it first."
  echo "$EXISTING" | xargs kill
  sleep 1
fi

echo "Building..."
npm run build > "$LOG_FILE" 2>&1

(npm run preview -- --port "$PORT" --strictPort >> "$LOG_FILE" 2>&1 &)

echo -n "Waiting for preview server on port $PORT"
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
