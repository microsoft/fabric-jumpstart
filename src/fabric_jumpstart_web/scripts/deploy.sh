#!/bin/bash
#
#
#       Deploys the web client to Azure Storage Static Website hosting.   
#
# ---------------------------------------------------------------------------------------
#
set -euo pipefail

[ -z "${WEBSITE_STORAGE_CONN_STRING:-}" ] && echo "Error: WEBSITE_STORAGE_CONN_STRING is not set or empty" >&2 && exit 1

GIT_ROOT=$(git rev-parse --show-toplevel)

az storage blob delete-batch -s '$web' --connection-string "$WEBSITE_STORAGE_CONN_STRING"
az storage blob upload-batch -d '$web' -s "${GIT_ROOT}/src/fabric_jumpstart_web/out" --connection-string "$WEBSITE_STORAGE_CONN_STRING"

echo "Deployment complete - the site will be live at"
echo
echo "- https://jumpstartfabric.z9.web.core.windows.net : Right now"
echo "- https://jumpstart.fabric.microsoft.com          : After DNS cache propagation (< 40 minutes for Azure CDN)"
echo