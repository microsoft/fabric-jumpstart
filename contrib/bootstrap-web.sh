#!/bin/bash
#
#       Bootstraps the website development environment (Node.js + npm).
#       Use this if you're only contributing to the fabric-jumpstart-web website.
#
#       For full monorepo setup (including the Python library), use bootstrap-all.sh instead.
#
# ---------------------------------------------------------------------------------------
#
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

export PATH=$(echo $PATH | tr ':' '\n' | grep -v "/mnt/c/Program Files/nodejs" | grep -v "/mnt/c/ProgramData/global-npm" | tr '\n' ':' | sed 's/:$//')

# ---------- Node.js + npm ----------
if ! command -v npm &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - > /dev/null 2>&1
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs > /dev/null 2>&1
fi

# ---------- npm dependencies ----------
cd "$REPO_ROOT"
npm install

cd "$REPO_ROOT/src/fabric_jumpstart_web"
npm install

echo ""
echo "✅ Web environment ready"
echo "   npm: $(npm version)"
echo "   nx: $(npx nx --version)"
