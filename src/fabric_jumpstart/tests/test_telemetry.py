"""Tests for the telemetry module."""

import hashlib
import json
from unittest.mock import MagicMock, patch

from fabric_jumpstart.telemetry import (
    _USER_HASH_SALT,
    _build_envelope,
    _hash_user_id,
    _resolve_user_hash,
    _track_install_worker,
)


class TestHashUserId:
    """Tests for _hash_user_id."""

    def test_deterministic(self):
        """Same OID always produces the same hash."""
        oid = "00000000-1111-2222-3333-444444444444"
        assert _hash_user_id(oid) == _hash_user_id(oid)

    def test_different_oids_produce_different_hashes(self):
        """Different OIDs produce different hashes."""
        oid_a = "00000000-1111-2222-3333-444444444444"
        oid_b = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        assert _hash_user_id(oid_a) != _hash_user_id(oid_b)

    def test_matches_manual_sha256(self):
        """Hash matches a manually computed salted SHA-256."""
        oid = "12345678-abcd-efgh-ijkl-mnopqrstuvwx"
        expected = hashlib.sha256(f"{_USER_HASH_SALT}{oid}".encode("utf-8")).hexdigest()
        assert _hash_user_id(oid) == expected

    def test_returns_hex_string(self):
        """Hash is a 64-char lowercase hex string."""
        result = _hash_user_id("some-guid")
        assert len(result) == 64
        assert all(c in "0123456789abcdef" for c in result)


class TestResolveUserHash:
    """Tests for _resolve_user_hash."""

    @patch("fabric_jumpstart.utils._decode_jwt")
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    def test_returns_hash_when_oid_present(self, mock_cred, mock_decode):
        """Returns a hash when token contains oid claim."""
        oid = "test-oid-guid"
        mock_token = MagicMock()
        mock_token.token = "header.payload.sig"
        mock_cred.return_value.get_token.return_value = mock_token
        mock_decode.return_value = {"oid": oid, "exp": 9999999999}

        result = _resolve_user_hash()

        assert result == _hash_user_id(oid)
        mock_cred.return_value.get_token.assert_called_once()

    @patch("fabric_jumpstart.utils._decode_jwt")
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    def test_returns_none_when_no_oid(self, mock_cred, mock_decode):
        """Returns None when token has no oid claim."""
        mock_token = MagicMock()
        mock_token.token = "header.payload.sig"
        mock_cred.return_value.get_token.return_value = mock_token
        mock_decode.return_value = {"sub": "something", "exp": 9999999999}

        result = _resolve_user_hash()

        assert result is None

    @patch("fabric_jumpstart.utils.resolve_token_credential")
    def test_returns_none_on_credential_failure(self, mock_cred):
        """Returns None when credential resolution fails."""
        mock_cred.side_effect = Exception("No credential available")

        result = _resolve_user_hash()

        assert result is None

    @patch("fabric_jumpstart.utils.resolve_token_credential")
    def test_returns_none_on_get_token_failure(self, mock_cred):
        """Returns None when get_token raises."""
        mock_cred.return_value.get_token.side_effect = Exception("Token error")

        result = _resolve_user_hash()

        assert result is None

    @patch("fabric_jumpstart.utils._decode_jwt")
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    def test_returns_none_on_decode_failure(self, mock_cred, mock_decode):
        """Returns None when JWT decoding fails."""
        mock_token = MagicMock()
        mock_token.token = "not-a-valid-jwt"
        mock_cred.return_value.get_token.return_value = mock_token
        mock_decode.side_effect = ValueError("Invalid JWT format")

        result = _resolve_user_hash()

        assert result is None


class TestBuildEnvelope:
    """Tests for _build_envelope."""

    def test_includes_user_hash_in_tags(self):
        """Envelope includes ai.user.id tag when user_hash provided."""
        envelope = _build_envelope(
            ikey="test-key",
            event_name="test_event",
            properties={"key": "value"},
            user_hash="abc123hash",
        )

        assert "tags" in envelope
        assert envelope["tags"]["ai.user.id"] == "abc123hash"

    def test_no_tags_when_no_user_hash(self):
        """Envelope has no tags when user_hash is None."""
        envelope = _build_envelope(
            ikey="test-key",
            event_name="test_event",
            properties={"key": "value"},
            user_hash=None,
        )

        assert "tags" not in envelope

    def test_no_tags_when_empty_user_hash(self):
        """Envelope has no tags when user_hash is empty string."""
        envelope = _build_envelope(
            ikey="test-key",
            event_name="test_event",
            properties={"key": "value"},
            user_hash="",
        )

        assert "tags" not in envelope

    def test_envelope_structure(self):
        """Envelope has correct overall structure."""
        envelope = _build_envelope(
            ikey="my-ikey",
            event_name="my_event",
            properties={"prop1": "val1"},
            user_hash="somehash",
        )

        assert envelope["name"] == "Microsoft.ApplicationInsights.Event"
        assert envelope["iKey"] == "my-ikey"
        assert envelope["data"]["baseType"] == "EventData"
        assert envelope["data"]["baseData"]["name"] == "my_event"
        assert envelope["data"]["baseData"]["properties"]["prop1"] == "val1"


class TestTrackInstallWorker:
    """Tests for _track_install_worker (the daemon thread function)."""

    @patch("fabric_jumpstart.telemetry._send")
    @patch("fabric_jumpstart.telemetry._resolve_user_hash")
    def test_includes_user_hash_in_payload(self, mock_resolve, mock_send):
        """Worker includes user hash in the sent envelope."""
        mock_resolve.return_value = "hashed_user_id"
        conn_str = "InstrumentationKey=test-key;IngestionEndpoint=https://example.com"

        _track_install_worker(
            conn_str=conn_str,
            jumpstart_id="test-js",
            jumpstart_numeric_id=42,
            jumpstart_type="Demo",
            status="success",
        )

        mock_send.assert_called_once()
        endpoint, payload_bytes = mock_send.call_args[0]
        payload = json.loads(payload_bytes.decode("utf-8"))
        assert payload["tags"]["ai.user.id"] == "hashed_user_id"

    @patch("fabric_jumpstart.telemetry._send")
    @patch("fabric_jumpstart.telemetry._resolve_user_hash")
    def test_sends_without_tags_when_hash_unavailable(self, mock_resolve, mock_send):
        """Worker sends event without tags when user hash is None."""
        mock_resolve.return_value = None
        conn_str = "InstrumentationKey=test-key;IngestionEndpoint=https://example.com"

        _track_install_worker(
            conn_str=conn_str,
            jumpstart_id="test-js",
            jumpstart_numeric_id=42,
            jumpstart_type="Demo",
            status="failure",
        )

        mock_send.assert_called_once()
        endpoint, payload_bytes = mock_send.call_args[0]
        payload = json.loads(payload_bytes.decode("utf-8"))
        assert "tags" not in payload

    @patch("fabric_jumpstart.telemetry._send")
    @patch("fabric_jumpstart.telemetry._resolve_user_hash")
    def test_does_not_send_without_ikey(self, mock_resolve, mock_send):
        """Worker does nothing if connection string has no instrumentation key."""
        conn_str = "IngestionEndpoint=https://example.com"

        _track_install_worker(
            conn_str=conn_str,
            jumpstart_id="test-js",
            jumpstart_numeric_id=1,
            jumpstart_type="Tutorial",
            status="success",
        )

        mock_send.assert_not_called()
