"""Tests for repo_ref override in JumpstartInstaller."""

from unittest.mock import patch, MagicMock
from fabric_jumpstart.installer import JumpstartInstaller
from fabric_jumpstart.utils import update_docs_uri_with_ref


def _make_config(**overrides):
    """Return a minimal jumpstart config dict."""
    config = {
        "id": 1,
        "logical_id": "test-jumpstart",
        "source": {
            "repo_url": "https://github.com/example/repo.git",
            "repo_ref": "v1.0.0",
            "workspace_path": "demo/",
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


def test_effective_docs_uri_returns_original_when_no_override():
    """Without repo_ref override, effective_docs_uri returns the original."""
    config = _make_config(jumpstart_docs_uri="https://github.com/example/repo/blob/v1.0.0/README.md")
    installer = JumpstartInstaller(config, workspace_id="ws-123", instance_name="js")
    assert installer.effective_docs_uri == "https://github.com/example/repo/blob/v1.0.0/README.md"


def test_effective_docs_uri_updates_github_blob_url_with_override():
    """When repo_ref override is provided, GitHub blob URLs are updated."""
    config = _make_config(jumpstart_docs_uri="https://github.com/example/repo/blob/v1.0.0/README.md")
    installer = JumpstartInstaller(
        config, workspace_id="ws-123", instance_name="js", repo_ref="v2.0.0"
    )
    assert installer.effective_docs_uri == "https://github.com/example/repo/blob/v2.0.0/README.md"


def test_effective_docs_uri_preserves_non_github_urls():
    """Non-GitHub URLs are returned unchanged even with repo_ref override."""
    config = _make_config(jumpstart_docs_uri="https://jumpstart.fabric.microsoft.com/docs/")
    installer = JumpstartInstaller(
        config, workspace_id="ws-123", instance_name="js", repo_ref="v2.0.0"
    )
    assert installer.effective_docs_uri == "https://jumpstart.fabric.microsoft.com/docs/"


def test_effective_docs_uri_handles_empty_string():
    """Empty docs_uri is returned unchanged."""
    config = _make_config(jumpstart_docs_uri="")
    installer = JumpstartInstaller(
        config, workspace_id="ws-123", instance_name="js", repo_ref="v2.0.0"
    )
    assert installer.effective_docs_uri == ""


def test_effective_docs_uri_handles_none():
    """None docs_uri is returned unchanged."""
    config = _make_config()  # No jumpstart_docs_uri
    installer = JumpstartInstaller(
        config, workspace_id="ws-123", instance_name="js", repo_ref="v2.0.0"
    )
    assert installer.effective_docs_uri is None


# Tests for update_docs_uri_with_ref utility function

def test_update_docs_uri_with_ref_basic():
    """Basic replacement of ref in GitHub blob URL."""
    result = update_docs_uri_with_ref(
        "https://github.com/microsoft/repo/blob/v1.0.0/README.md",
        "v1.0.0",
        "v2.0.0"
    )
    assert result == "https://github.com/microsoft/repo/blob/v2.0.0/README.md"


def test_update_docs_uri_with_ref_same_ref():
    """Returns original when refs are the same."""
    original = "https://github.com/microsoft/repo/blob/v1.0.0/README.md"
    result = update_docs_uri_with_ref(original, "v1.0.0", "v1.0.0")
    assert result == original


def test_update_docs_uri_with_ref_non_github():
    """Non-GitHub URLs are unchanged."""
    original = "https://docs.example.com/readme"
    result = update_docs_uri_with_ref(original, "v1.0.0", "v2.0.0")
    assert result == original


def test_update_docs_uri_with_ref_github_without_blob():
    """GitHub URLs without /blob/ are unchanged."""
    original = "https://github.com/microsoft/repo"
    result = update_docs_uri_with_ref(original, "v1.0.0", "v2.0.0")
    assert result == original


def test_update_docs_uri_with_ref_ref_not_in_url():
    """Returns original if the original ref is not in the URL."""
    original = "https://github.com/microsoft/repo/blob/main/README.md"
    result = update_docs_uri_with_ref(original, "v1.0.0", "v2.0.0")
    assert result == original
