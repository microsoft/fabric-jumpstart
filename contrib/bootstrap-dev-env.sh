#!/bin/bash
#
#
#       Bootstraps a Linux Devbox host idempotently.
#       If your Devbox restarts, rerun this script.
#
# ---------------------------------------------------------------------------------------
#
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

export PATH=$(echo $PATH | tr ':' '\n' | grep -v "/mnt/c/Program Files/nodejs" | grep -v "/mnt/c/ProgramData/global-npm" | tr '\n' ':' | sed 's/:$//')
PACKAGES=""
if ! command -v jq &> /dev/null; then PACKAGES="jq"; fi
if ! command -v python3 &> /dev/null; then PACKAGES="${PACKAGES:+$PACKAGES }python3"; fi
if ! command -v pip &> /dev/null; then PACKAGES="${PACKAGES:+$PACKAGES }python3-pip"; fi
if ! command -v npm &> /dev/null; then PACKAGES="${PACKAGES:+$PACKAGES }nodejs"; curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - > /dev/null 2>&1; fi
if [ -n "$PACKAGES" ]; then
    sudo apt-get update > /dev/null 2>&1
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y $PACKAGES > /dev/null 2>&1
fi
command -v az &> /dev/null || curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash > /dev/null 2>&1
command -v uv &> /dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh

[[ ":$PATH:" != *":$HOME/.local/bin:"* ]] && export PATH="$PATH:$HOME/.local/bin" || true
if [ -f "$HOME/.local/bin/uv" ] && [ ! -f /usr/local/bin/uv ]; then
    sudo ln -sf "$HOME/.local/bin/uv" /usr/local/bin/uv
    sudo ln -sf "$HOME/.local/bin/uvx" /usr/local/bin/uvx 2>/dev/null || true
fi

cd "$REPO_ROOT/src/fabric_jumpstart"
uv sync --all-groups
[ -f .venv/bin/activate ] && source .venv/bin/activate

cd "$REPO_ROOT"
npm install

cd "$REPO_ROOT/src/fabric_jumpstart_web"
npm install

echo "python: $(python3 --version)"
echo "uv: $(uv --version)"
echo "npm: $(npm version)"
echo "nx: $(npx nx --version)"
