"""Tests for repo_ref override in JumpstartInstaller."""

from unittest.mock import patch, MagicMock
from fabric_jumpstart.installer import JumpstartInstaller


def _make_config(**overrides):
    """Return a minimal jumpstart config dict."""
    config = {
        "id": 1,
        "logical_id": "test-jumpstart",
        "source": {
            "repo_url": "https://github.com/example/repo.git",
            "repo_ref": "v1.0.0",
            "workspace_path": "demo/",
            "preview_image_path": "demo/preview.png",
        },
    }
    config.update(overrides)
    return config


@patch("fabric_jumpstart.installer.clone_repository")
def test_prepare_workspace_uses_config_repo_ref_by_default(mock_clone):
    """Without repo_ref kwarg, the registered config value is used."""
    mock_clone.return_value = MagicMock()
    installer = JumpstartInstaller(_make_config(), workspace_id="ws-123", instance_name="js")
    installer.prepare_workspace()

    mock_clone.assert_called_once()
    _, kwargs = mock_clone.call_args
    assert kwargs["ref"] == "v1.0.0"


@patch("fabric_jumpstart.installer.clone_repository")
def test_prepare_workspace_uses_repo_ref_override(mock_clone):
    """When repo_ref kwarg is provided, it overrides the config value."""
    mock_clone.return_value = MagicMock()
    installer = JumpstartInstaller(
        _make_config(), workspace_id="ws-123", instance_name="js", repo_ref="v2.0.0-beta"
    )
    installer.prepare_workspace()

    mock_clone.assert_called_once()
    _, kwargs = mock_clone.call_args
    assert kwargs["ref"] == "v2.0.0-beta"
