"""Lightweight telemetry for jumpstart install events.

Events are sent to Azure Application Insights via the REST Track API.
The ingestion connection string is *not* a secret — it is a write-only
public identifier, the same pattern used by the App Insights JS SDK in
browsers and by Google Analytics tracking IDs.

Telemetry can be disabled by setting the environment variable
``JUMPSTART_TELEMETRY_OPTOUT=1``.  The connection string can be
overridden via ``APPLICATIONINSIGHTS_CONNECTION_STRING``.
"""

import json
import logging
import os
import threading
import time
import urllib.request
from typing import Optional

logger = logging.getLogger(__name__)

_DEFAULT_CONNECTION_STRING = "InstrumentationKey=d7c982d9-221f-4bf8-b4be-93ae54703f5f;IngestionEndpoint=https://centralus-2.in.applicationinsights.azure.com/;LiveEndpoint=https://centralus.livediagnostics.monitor.azure.com/;ApplicationId=5bd92c67-500e-4d3d-b282-80680dfc9b20"

_TRACK_PATH = "/v2/track"


def _parse_connection_string(conn_str: str) -> tuple[str, str]:
    """Return (ingestion_endpoint, instrumentation_key) from a connection string."""
    parts: dict[str, str] = {}
    for segment in conn_str.split(";"):
        if "=" in segment:
            key, _, value = segment.partition("=")
            parts[key.strip()] = value.strip()

    ikey = parts.get("InstrumentationKey", "")
    endpoint = parts.get("IngestionEndpoint", "https://dc.services.visualstudio.com").rstrip("/")
    return endpoint, ikey


def _get_connection_string() -> Optional[str]:
    """Resolve the connection string, respecting opt-out and overrides."""
    if os.environ.get("JUMPSTART_TELEMETRY_OPTOUT", "").strip() in ("1", "true", "yes"):
        return None
    return (
        os.environ.get("APPLICATIONINSIGHTS_CONNECTION_STRING", "").strip()
        or _DEFAULT_CONNECTION_STRING
        or None
    )


def _build_envelope(
    ikey: str,
    event_name: str,
    properties: dict[str, str],
) -> dict:
    """Build an Application Insights Track API envelope."""
    return {
        "name": "Microsoft.ApplicationInsights.Event",
        "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "iKey": ikey,
        "data": {
            "baseType": "EventData",
            "baseData": {
                "ver": 2,
                "name": event_name,
                "properties": properties,
            },
        },
    }


def _send(endpoint: str, payload: bytes) -> None:
    """POST payload to the App Insights ingestion endpoint (best-effort)."""
    req = urllib.request.Request(
        f"{endpoint}{_TRACK_PATH}",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=3)
    except Exception:
        pass


def track_install(
    jumpstart_id: str,
    jumpstart_numeric_id: int,
    jumpstart_type: str,
    status: str,
) -> None:
    """Record a jumpstart install event (fire-and-forget).

    This never raises and never blocks the install flow.  The HTTP call
    runs on a daemon thread so the caller returns immediately.
    """
    try:
        conn_str = _get_connection_string()
        if not conn_str:
            return

        endpoint, ikey = _parse_connection_string(conn_str)
        if not ikey:
            return

        envelope = _build_envelope(
            ikey=ikey,
            event_name="jumpstart_installed",
            properties={
                "jumpstart_id": jumpstart_id,
                "jumpstart_numeric_id": str(jumpstart_numeric_id),
                "type": jumpstart_type,
                "status": status,
            },
        )
        payload = json.dumps(envelope).encode("utf-8")

        t = threading.Thread(target=_send, args=(endpoint, payload), daemon=True)
        t.start()
    except Exception:
        pass
