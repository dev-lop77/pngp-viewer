#!/usr/bin/env bash
# Stops whichever tools/dev/start-*.sh server is running (dev and/or
# preview default ports). See tools/dev/README.md.
#
# Usage: tools/dev/stop.sh [port ...]  (default: 5173 4173)

set -euo pipefail

if [[ $# -gt 0 ]]; then
  PORTS=("$@")
else
  PORTS=(5173 4173)
fi

STOPPED_ANY=0
for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti:"$PORT" -sTCP:LISTEN || true)
  if [[ -n "$PID" ]]; then
    kill "$PID"
    echo "Stopped server on port $PORT (pid $PID)."
    STOPPED_ANY=1
  fi
done

if [[ "$STOPPED_ANY" -eq 0 ]]; then
  echo "Nothing listening on: ${PORTS[*]}"
fi
