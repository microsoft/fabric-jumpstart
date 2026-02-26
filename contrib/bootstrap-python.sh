#!/bin/bash
#
#       Bootstraps Python development environment for the fabric-jumpstart library.
#       Use this if you're contributing to the Python library or adding a new Jumpstart.
#
#       For full monorepo setup (including the website), use bootstrap-all.sh instead.
#
# ---------------------------------------------------------------------------------------
#
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

# ---------- system packages ----------
PACKAGES=""
if ! command -v jq &> /dev/null; then PACKAGES="jq"; fi
if ! command -v python3 &> /dev/null; then PACKAGES="${PACKAGES:+$PACKAGES }python3"; fi
if ! command -v pip &> /dev/null; then PACKAGES="${PACKAGES:+$PACKAGES }python3-pip"; fi
if [ -n "$PACKAGES" ]; then
    sudo apt-get update > /dev/null 2>&1
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y $PACKAGES > /dev/null 2>&1
fi

# ---------- uv ----------
command -v uv &> /dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh

[[ ":$PATH:" != *":$HOME/.local/bin:"* ]] && export PATH="$PATH:$HOME/.local/bin" || true
if [ -f "$HOME/.local/bin/uv" ] && [ ! -f /usr/local/bin/uv ]; then
    sudo ln -sf "$HOME/.local/bin/uv" /usr/local/bin/uv
    sudo ln -sf "$HOME/.local/bin/uvx" /usr/local/bin/uvx 2>/dev/null || true
fi

# ---------- Python dependencies ----------
cd "$REPO_ROOT/src/fabric_jumpstart"
uv sync --all-groups
[ -f .venv/bin/activate ] && source .venv/bin/activate

echo ""
echo "✅ Python environment ready"
echo "   python: $(python3 --version)"
echo "   uv: $(uv --version)"
