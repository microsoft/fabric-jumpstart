#!/bin/bash
#
#
#       Bootstraps a Linux Devbox host for the VS Code devcontainer idempotently.
#       If your Devbox restarts, rerun this script.
#
# ---------------------------------------------------------------------------------------
#

REPO_ROOT=$(git rev-parse --show-toplevel)

export PATH=$(echo $PATH | tr ':' '\n' | grep -v "/mnt/c/Program Files/nodejs" | grep -v "/mnt/c/ProgramData/global-npm" | tr '\n' ':' | sed 's/:$//')
PACKAGES=""
if ! command -v jq &> /dev/null; then PACKAGES="jq"; fi
if ! command -v npm &> /dev/null; then PACKAGES="${PACKAGES:+$PACKAGES }nodejs"; curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - > /dev/null 2>&1; fi
if [ -n "$PACKAGES" ]; then
    sudo apt-get update > /dev/null 2>&1
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y $PACKAGES > /dev/null 2>&1
fi

cd "$REPO_ROOT"
sudo npm install
sudo chmod -R 777 ${REPO_ROOT}/node_modules

echo "npm: $(npm version)"
echo "nx: $(npx nx --version)"
