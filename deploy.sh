#!/usr/bin/env bash
# МОЗОЛЕУМ — pull latest and (re)deploy the Docker container on the server.
# Usage on the server:
#   cd ~/Mozoleum && ANTHROPIC_API_KEY=sk-... ./deploy.sh
# The key is read from the environment or from a local .env file (gitignored).
set -euo pipefail

APP=mozoleum
PORT_PUBLIC="${PORT_PUBLIC:-80}"   # host port (80 = http). Override if behind nginx.
PORT_APP=8787                       # container port the server listens on

cd "$(dirname "$0")"

echo "▸ Pulling latest from git…"
git pull --ff-only

# Load .env if present (so ANTHROPIC_API_KEY etc. can live in a gitignored file).
if [[ -f .env ]]; then
  echo "▸ Loading .env"
  set -a; # shellcheck disable=SC1091
  source .env; set +a
fi

echo "▸ Building image…"
docker build -t "$APP" .

echo "▸ Restarting container…"
docker rm -f "$APP" >/dev/null 2>&1 || true
docker run -d --name "$APP" --restart unless-stopped \
  -p "${PORT_PUBLIC}:${PORT_APP}" \
  -e PORT="$PORT_APP" \
  -e CORS_ORIGIN="${CORS_ORIGIN:-*}" \
  -e MOTTO_MODEL="${MOTTO_MODEL:-claude-haiku-4-5-20251001}" \
  -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
  "$APP"

echo "▸ Pruning old images…"
docker image prune -f >/dev/null 2>&1 || true

echo "✓ Deployed. Health: http://localhost:${PORT_PUBLIC}/api/health"
