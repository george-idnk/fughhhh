#!/usr/bin/env bash
# Clones and sets up bilawalsidhu/gods-eye-view for local, keyless use.
# Usage: ./setup.sh [target-dir]   (default target-dir: ./gods-eye-view-app next to this script)
set -euo pipefail

REPO_URL="https://github.com/bilawalsidhu/gods-eye-view.git"
TARGET_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/gods-eye-view-app}"
REQUIRED_NODE_MAJOR_MIN=24

log() { printf '\n>> %s\n' "$1"; }

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    return 1
  fi
  local major
  major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
  [ "$major" -ge "$REQUIRED_NODE_MAJOR_MIN" ]
}

ensure_node() {
  if check_node; then
    log "Node $(node --version) already satisfies the >=${REQUIRED_NODE_MAJOR_MIN}.x requirement."
    return
  fi

  log "Node ${REQUIRED_NODE_MAJOR_MIN}.x+ not found. Attempting to install via nvm."
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    log "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install "$REQUIRED_NODE_MAJOR_MIN"
  nvm use "$REQUIRED_NODE_MAJOR_MIN"

  if ! check_node; then
    echo "Failed to provision a supported Node version (>=${REQUIRED_NODE_MAJOR_MIN}.x). Install it manually and re-run." >&2
    exit 1
  fi
}

clone_repo() {
  if [ -d "$TARGET_DIR/.git" ]; then
    log "Repo already present at $TARGET_DIR, pulling latest."
    git -C "$TARGET_DIR" pull --ff-only
  else
    log "Cloning $REPO_URL into $TARGET_DIR"
    git clone "$REPO_URL" "$TARGET_DIR"
  fi
}

install_and_check() {
  log "Installing dependencies (npm ci)"
  (cd "$TARGET_DIR" && npm ci)

  log "Running setup doctor"
  (cd "$TARGET_DIR" && npm run doctor) || true
}

main() {
  ensure_node
  clone_repo
  install_and_check

  cat <<EOF

Setup complete.

  cd "$TARGET_DIR"
  npm run dev

Then open http://localhost:4173 for the keyless default view (satellite
imagery, flights, ships, satellites, earthquakes, CCTV, fires, radio,
traffic, space missions -- no API keys required).

To enable Photorealistic 3D and Voice, launch the app, click the POWER UP
chip (bottom-right) or visit http://localhost:4173/?setup=1, and paste in
your own API keys there. Keys are saved locally to "$TARGET_DIR/.env"
(already gitignored) -- never share them or paste them into a chat.
See gods-eye-view/SETUP.md in this repo for the full key-by-key guide.
EOF
}

main "$@"
