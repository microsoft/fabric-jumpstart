#!/bin/bash
#
#
#       Bootstraps the FULL monorepo (Python library + Website) idempotently.
#       Used by CI to set up everything.
#
#       Only working on one project? Use the targeted bootstrapper instead:
#         - Python library / Jumpstarts:  contrib/bootstrap-python.sh
#         - Website:                      contrib/bootstrap-web.sh
#
# ---------------------------------------------------------------------------------------
#
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

# ---------- Azure CLI ----------
command -v az &> /dev/null || curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash > /dev/null 2>&1

# ---------- Python environment ----------
chmod +x "${REPO_ROOT}/contrib/bootstrap-python.sh" && source "${REPO_ROOT}/contrib/bootstrap-python.sh"

# ---------- Web environment ----------
chmod +x "${REPO_ROOT}/contrib/bootstrap-web.sh" && source "${REPO_ROOT}/contrib/bootstrap-web.sh"

echo ""
echo "✅ Full monorepo environment ready"
