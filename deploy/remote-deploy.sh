#!/usr/bin/env bash
# Runs ON THE SERVER. Copied over by .github/workflows/deploy.yml, then:
#   bash /tmp/hotel-deploy.sh <repo-url-with-token> <commit-sha>
# It is copied rather than piped into `bash -s`, because `docker compose exec -T` below would
# otherwise swallow the rest of the script from the shared stdin.
# Checks out the pushed commit, rebuilds the stack (migrations run in the `migrate` service),
# then waits for the app to answer before reporting success.
set -euo pipefail

REPO_URL=${1:?repo url required}
SHA=${2:?commit sha required}
APP_DIR=${APP_DIR:-/opt/hotel}

cd "$APP_DIR"

echo "==> Fetching $SHA"
git fetch --depth 1 "$REPO_URL" main
git reset --hard "$SHA"
git --no-pager log -1 --oneline

echo "==> Rebuilding containers"
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null

echo "==> Waiting for the app to respond"
for _ in $(seq 1 30); do
  if docker compose exec -T app node -e "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" </dev/null 2>/dev/null; then
    echo "==> App is up"
    docker compose ps
    exit 0
  fi
  sleep 5
done

echo "!! App did not respond within 150s" >&2
docker compose ps >&2
docker compose logs --tail=50 app >&2
exit 1
