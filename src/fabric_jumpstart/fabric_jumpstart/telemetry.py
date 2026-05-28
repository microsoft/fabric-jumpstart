"""Lightweight telemetry for jumpstart install events.

Events are sent to Azure Application Insights via the REST Track API.
The ingestion connection string is *not* a secret — it is a write-only
public identifier, the same pattern used by the App Insights JS SDK in
browsers and by Google Analytics tracking IDs.

Telemetry can be disabled by setting the environment variable
``JUMPSTART_TELEMETRY_OPTOUT=1``.  The connection string can be
overridden via ``APPLICATIONINSIGHTS_CONNECTION_STRING``.
"""

import hashlib
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

# Static salt to prevent cross-system correlation of hashed user IDs.
_USER_HASH_SALT = "fabric-jumpstart-telemetry-v1"

_FABRIC_API_SCOPE = "https://api.fabric.microsoft.com/.default"


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


def _hash_user_id(oid: str) -> str:
    """Compute a salted SHA-256 hash of an Azure AD object ID.

    The static salt ensures this hash cannot be correlated with the same
    OID hashed in other telemetry systems.
    """
    return hashlib.sha256(f"{_USER_HASH_SALT}{oid}".encode("utf-8")).hexdigest()


def _resolve_user_hash() -> Optional[str]:
    """Best-effort resolution of a hashed user identifier from the auth token.

    Returns a salted SHA-256 hash of the ``oid`` claim in the user's JWT,
    or None if the hash cannot be determined (credential unavailable,
    token not a JWT, missing ``oid`` claim, etc.).

    This function is designed to run on the telemetry daemon thread and
    never raises.
    """
    try:
        from .utils import _decode_jwt, resolve_token_credential

        credential = resolve_token_credential()
        token_obj = credential.get_token(_FABRIC_API_SCOPE)
        payload = _decode_jwt(token_obj.token)
        oid = payload.get("oid")
        if oid:
            return _hash_user_id(oid)
    except Exception:
        pass
    return None


def _build_envelope(
    ikey: str,
    event_name: str,
    properties: dict[str, str],
    user_hash: Optional[str] = None,
) -> dict:
    """Build an Application Insights Track API envelope."""
    envelope: dict = {
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
    if user_hash:
        envelope["tags"] = {"ai.user.id": user_hash}
    return envelope


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


def _track_install_worker(
    conn_str: str,
    jumpstart_id: str,
    jumpstart_numeric_id: int,
    jumpstart_type: str,
    status: str,
    duration_seconds: Optional[float] = None,
    install_mode: Optional[str] = None,
    non_registered_install: bool = False,
) -> None:
    """Worker that resolves user hash and sends the telemetry event."""
    endpoint, ikey = _parse_connection_string(conn_str)
    if not ikey:
        return

    user_hash = _resolve_user_hash()

    properties: dict[str, str] = {
        "jumpstart_id": jumpstart_id,
        "jumpstart_numeric_id": str(jumpstart_numeric_id),
        "type": jumpstart_type,
        "status": status,
    }
    if duration_seconds is not None:
        properties["duration_seconds"] = str(duration_seconds)
    if install_mode:
        properties["install_mode"] = install_mode
    if non_registered_install:
        properties["non_registered_install"] = "true"

    envelope = _build_envelope(
        ikey=ikey,
        event_name="jumpstart_installed",
        properties=properties,
        user_hash=user_hash,
    )
    payload = json.dumps(envelope).encode("utf-8")
    _send(endpoint, payload)


def track_install(
    jumpstart_id: str,
    jumpstart_numeric_id: int,
    jumpstart_type: str,
    status: str,
    duration_seconds: Optional[float] = None,
    install_mode: Optional[str] = None,
    non_registered_install: bool = False,
) -> None:
    """Record a jumpstart install event (fire-and-forget).

    This never raises and never blocks the install flow.  The HTTP call
    runs on a daemon thread so the caller returns immediately.
    """
    try:
        conn_str = _get_connection_string()
        if not conn_str:
            return

        t = threading.Thread(
            target=_track_install_worker,
            args=(conn_str, jumpstart_id, jumpstart_numeric_id, jumpstart_type, status),
            kwargs={"duration_seconds": duration_seconds, "install_mode": install_mode, "non_registered_install": non_registered_install},
            daemon=True,
        )
        t.start()
    except Exception:
        pass
