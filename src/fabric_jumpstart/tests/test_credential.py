"""Tests for token credential resolution via environment variable."""

import os
from unittest.mock import MagicMock, patch

import pytest

from fabric_jumpstart.utils import (
    CREDENTIAL_OVERRIDE_ENV_VAR,
    resolve_token_credential,
)


class TestResolveTokenCredential:
    """Tests for resolve_token_credential()."""

    def test_returns_none_when_env_var_unset(self):
        """No env var → None (default fabric_cicd behaviour)."""
        with patch.dict(os.environ, {}, clear=True):
            assert resolve_token_credential() is None

    def test_returns_none_when_env_var_empty(self):
        """Empty env var → None."""
        with patch.dict(os.environ, {CREDENTIAL_OVERRIDE_ENV_VAR: ""}):
            assert resolve_token_credential() is None

    def test_returns_azure_cli_credential(self):
        """AzureCliCredential env var → instantiated credential."""
        mock_cls = MagicMock()
        mock_module = MagicMock()
        mock_module.AzureCliCredential = mock_cls

        with patch.dict(os.environ, {CREDENTIAL_OVERRIDE_ENV_VAR: "AzureCliCredential"}):
            with patch("importlib.import_module", return_value=mock_module) as mock_import:
                result = resolve_token_credential()

        mock_import.assert_called_once_with("azure.identity")
        mock_cls.assert_called_once_with()
        assert result is mock_cls.return_value

    def test_returns_managed_identity_credential(self):
        """ManagedIdentityCredential env var → instantiated credential."""
        mock_cls = MagicMock()
        mock_module = MagicMock()
        mock_module.ManagedIdentityCredential = mock_cls

        with patch.dict(os.environ, {CREDENTIAL_OVERRIDE_ENV_VAR: "ManagedIdentityCredential"}):
            with patch("importlib.import_module", return_value=mock_module):
                result = resolve_token_credential()

        mock_cls.assert_called_once_with()
        assert result is mock_cls.return_value

    def test_raises_on_unsupported_value(self):
        """Unknown credential name → ValueError."""
        with patch.dict(os.environ, {CREDENTIAL_OVERRIDE_ENV_VAR: "BogusCredential"}):
            with pytest.raises(ValueError, match="Unsupported.*BogusCredential"):
                resolve_token_credential()


class TestWorkspaceManagerCredentialPassthrough:
    """Ensure WorkspaceManager passes resolved credential to FabricWorkspace."""

    @patch("fabric_jumpstart.workspace_manager.resolve_token_credential", return_value=None)
    @patch("fabric_jumpstart.workspace_manager.FabricWorkspace")
    def test_no_credential_when_env_var_unset(self, mock_fw, mock_resolve):
        """When resolver returns None, token_credential is NOT passed."""
        from fabric_jumpstart.workspace_manager import WorkspaceManager
        from pathlib import Path

        wm = WorkspaceManager("ws-id", Path("/tmp"), ["Notebook"])
        wm.get_fabric_workspace()

        mock_fw.assert_called_once()
        call_kwargs = mock_fw.call_args[1]
        assert "token_credential" not in call_kwargs

    @patch("fabric_jumpstart.workspace_manager.resolve_token_credential")
    @patch("fabric_jumpstart.workspace_manager.FabricWorkspace")
    def test_credential_passed_when_resolved(self, mock_fw, mock_resolve):
        """When resolver returns a credential, it is forwarded to FabricWorkspace."""
        from fabric_jumpstart.workspace_manager import WorkspaceManager
        from pathlib import Path

        fake_cred = MagicMock()
        mock_resolve.return_value = fake_cred

        wm = WorkspaceManager("ws-id", Path("/tmp"), ["Notebook"])
        wm.get_fabric_workspace()

        mock_fw.assert_called_once()
        call_kwargs = mock_fw.call_args[1]
        assert call_kwargs["token_credential"] is fake_cred
