#!/bin/bash
#
#
#       Bootstraps a Linux dev environment idempotently.
#       Layers developer tools on top of the CI environment.
#       If your Devbox restarts, rerun this script.
#
# ---------------------------------------------------------------------------------------
#
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

# ---------- CI environment (Python, Node.js, dependencies) ----------
chmod +x "${REPO_ROOT}/contrib/bootstrap-ci.sh" && source "${REPO_ROOT}/contrib/bootstrap-ci.sh"

# ---------- VS Code extensions ----------
if command -v code &> /dev/null; then
    echo "Installing VS Code extensions..."
    code --install-extension charliermarsh.ruff              # Ruff linter
    code --install-extension ms-python.python                # Python
    code --install-extension ms-python.vscode-pylance        # IntelliSense
    code --install-extension ms-toolsai.jupyter              # Jupyter notebooks
    code --install-extension ms-vscode-remote.remote-wsl     # WSL
fi

# ---------- GitHub Copilot CLI ----------
if ! command -v copilot &> /dev/null; then
    echo "Installing GitHub Copilot CLI..."
    curl -fsSL https://gh.io/copilot-install | bash
fi

echo ""
echo "✅ Dev environment ready"

