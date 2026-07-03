"""Tests for install_options variant selection (install_option argument)."""

import pytest
from pydantic import ValidationError
from unittest.mock import patch

from fabric_jumpstart.installer import JumpstartInstaller

from .schemas import Jumpstart

OPTIONS = ["healthcare", "retail-sales"]


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


# ─── installer validation ────────────────────────────────────────────────────

def test_validate_requires_option_when_declared():
    """A jumpstart with install_options must be installed with one."""
    installer = JumpstartInstaller(
        _make_config(install_options=OPTIONS), workspace_id="ws-123", instance_name="js"
    )
    with pytest.raises(ValueError, match="requires an install option"):
        installer.validate()


def test_validate_rejects_unknown_option():
    """An option outside the declared list is rejected with the valid list."""
    installer = JumpstartInstaller(
        _make_config(install_options=OPTIONS),
        workspace_id="ws-123",
        instance_name="js",
        install_option="finance",
    )
    with pytest.raises(ValueError, match="Unknown install option 'finance'"):
        installer.validate()


def test_validate_rejects_option_when_none_declared():
    """Passing install_option to a jumpstart without options fails clearly."""
    installer = JumpstartInstaller(
        _make_config(), workspace_id="ws-123", instance_name="js", install_option="healthcare"
    )
    with pytest.raises(ValueError, match="does not define install options"):
        installer.validate()


def test_validate_accepts_declared_option():
    """A declared option passes validation."""
    installer = JumpstartInstaller(
        _make_config(install_options=OPTIONS),
        workspace_id="ws-123",
        instance_name="js",
        install_option="healthcare",
    )
    assert installer.validate() == "ws-123"


def test_validate_unchanged_without_options():
    """Jumpstarts without install_options keep the existing behaviour."""
    installer = JumpstartInstaller(_make_config(), workspace_id="ws-123", instance_name="js")
    assert installer.validate() == "ws-123"


# ─── installer path resolution ───────────────────────────────────────────────

@patch("fabric_jumpstart.installer.clone_repository")
def test_prepare_workspace_resolves_option_subfolder(mock_clone, tmp_path):
    """The install option selects its dedicated subfolder under workspace_path."""
    repo = tmp_path / "repo"
    (repo / "demo" / "healthcare" / "Item.Notebook").mkdir(parents=True)
    mock_clone.return_value = repo

    installer = JumpstartInstaller(
        _make_config(install_options=OPTIONS),
        workspace_id="ws-123",
        instance_name="js",
        install_option="healthcare",
    )
    result = installer.prepare_workspace()

    assert result == repo / "demo" / "healthcare"


@patch("fabric_jumpstart.installer.clone_repository")
def test_prepare_workspace_fails_when_option_folder_missing(mock_clone, tmp_path):
    """Missing option folders fail loudly instead of deploying the repo root."""
    repo = tmp_path / "repo"
    (repo / "demo").mkdir(parents=True)
    mock_clone.return_value = repo

    installer = JumpstartInstaller(
        _make_config(install_options=OPTIONS),
        workspace_id="ws-123",
        instance_name="js",
        install_option="healthcare",
    )
    with pytest.raises(ValueError, match="has no source folder"):
        installer.prepare_workspace()


# ─── schema validation ───────────────────────────────────────────────────────

def _schema_payload(**overrides):
    payload = {
        "id": 1,
        "logical_id": "test-jumpstart",
        "name": "Test Jumpstart",
        "description": "A jumpstart used in unit tests.",
        "date_added": "01/01/2025",
        "workload_tags": ["Data Engineering"],
        "scenario_tags": ["Modeling"],
        "type": "Demo",
        "source": {
            "workspace_path": "demo/",
            "repo_url": "https://github.com/example/repo.git",
            "repo_ref": "v1.0.0",
        },
        "entry_point": "GettingStarted.Notebook",
        "owner_email": "owner@example.com",
    }
    payload.update(overrides)
    return payload


def test_schema_accepts_valid_install_options():
    jumpstart = Jumpstart(**_schema_payload(install_options=OPTIONS))
    assert jumpstart.install_options == OPTIONS


def test_schema_allows_omitted_install_options():
    jumpstart = Jumpstart(**_schema_payload())
    assert jumpstart.install_options is None


def test_schema_rejects_empty_install_options():
    with pytest.raises(ValidationError, match="at least one option"):
        Jumpstart(**_schema_payload(install_options=[]))


def test_schema_rejects_non_slug_install_options():
    with pytest.raises(ValidationError, match="lowercase alphanumeric"):
        Jumpstart(**_schema_payload(install_options=["Retail Sales"]))


def test_schema_rejects_duplicate_install_options():
    with pytest.raises(ValidationError, match="duplicated"):
        Jumpstart(**_schema_payload(install_options=["healthcare", "healthcare"]))


def test_schema_accepts_install_options_label():
    jumpstart = Jumpstart(
        **_schema_payload(install_options=OPTIONS, install_options_label="Industry choice")
    )
    assert jumpstart.install_options_label == "Industry choice"


def test_schema_rejects_blank_install_options_label():
    with pytest.raises(ValidationError, match="must not be blank"):
        Jumpstart(**_schema_payload(install_options=OPTIONS, install_options_label="   "))


def test_schema_rejects_label_without_install_options():
    with pytest.raises(ValidationError, match="requires install_options"):
        Jumpstart(**_schema_payload(install_options_label="Industry choice"))
