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


# ─── multi-option (array) installs ───────────────────────────────────────────

def _make_core(config):
    """Return a jumpstart core instance with a stubbed registry."""
    from fabric_jumpstart.core import jumpstart as core_cls

    core = core_cls.__new__(core_cls)
    core._registry = [config]
    return core


def _run_multi(config, install_option, **kwargs):
    """Invoke _install_with_config capturing per-option installers."""
    from fabric_jumpstart import core as core_module

    created = []

    class FakeInstaller:
        def __init__(self, cfg, workspace_id, instance_name, **options):
            self.config = cfg
            self.workspace_id = workspace_id or "ws-123"
            self.options = options
            self.install_option = options.get("install_option")
            self.unattended = True
            self.update_existing = bool(options.get("update_existing", False))
            self.debug_logs = False
            self.log_buffer = []
            self.temp_workspace_path = "/tmp/x"
            self.had_conflicts = False
            self.effective_docs_uri = None
            created.append(self)

        def validate(self):
            return self.workspace_id

        def prepare_workspace(self):
            return None

        def initialize_workspace_manager(self):
            return None

        def check_conflicts(self):
            return [], [], [], False

        def resolve_conflicts(self, planned, existing, conflicts):
            return self.options.get("item_prefix"), []

        def apply_prefix_to_files(self, prefix):
            return []

        def deploy(self):
            return object()

        def upload_files(self, target_ws, prefix):
            return 0

        def load_data(self, prefix):
            return {}

        def generate_entry_url(self, target_ws, prefix):
            return f"https://example.test/{self.install_option}"

    core = _make_core(config)
    with patch.object(core_module, "JumpstartInstaller", FakeInstaller), \
            patch.object(core_module, "track_install") as mock_track:
        core._install_with_config(
            config, "ws-123", unattended=True, install_option=install_option, **kwargs
        )
    return created, mock_track


def test_array_install_deploys_each_option_with_folder_and_prefix():
    """Each option gets its own installer, workspace folder, and name prefix."""
    config = _make_config(install_options=OPTIONS)
    created, mock_track = _run_multi(config, ["healthcare", "retail-sales"])

    assert [i.install_option for i in created] == ["healthcare", "retail-sales"]
    assert [i.options.get("workspace_folder_name") for i in created] == [
        "healthcare",
        "retail-sales",
    ]
    assert [i.options.get("item_prefix") for i in created] == [
        "healthcare_",
        "retail_sales_",
    ]
    assert mock_track.call_args.kwargs["install_option"] == "healthcare,retail-sales"
    assert mock_track.call_args.kwargs["status"] == "success"


def test_array_install_single_entry_still_gets_folder_and_prefix():
    """A one-element list uses the multi layout so later adds never collide."""
    config = _make_config(install_options=OPTIONS)
    created, _ = _run_multi(config, ["healthcare"])

    assert len(created) == 1
    assert created[0].options.get("workspace_folder_name") == "healthcare"
    assert created[0].options.get("item_prefix") == "healthcare_"


def test_array_install_layers_user_item_prefix():
    """A user item_prefix is preserved in front of the option prefix."""
    config = _make_config(install_options=OPTIONS)
    created, _ = _run_multi(config, ["healthcare"], item_prefix="mine_")

    assert created[0].options.get("item_prefix") == "mine_healthcare_"


def test_string_install_option_keeps_legacy_kwargs():
    """A plain string must not gain folder/prefix semantics."""
    config = _make_config(install_options=OPTIONS)
    created, mock_track = _run_multi(config, "healthcare")

    assert len(created) == 1
    assert created[0].install_option == "healthcare"
    assert "workspace_folder_name" not in created[0].options
    assert created[0].options.get("item_prefix") is None
    assert mock_track.call_args.kwargs["install_option"] == "healthcare"


def test_array_install_rejects_empty_list():
    config = _make_config(install_options=OPTIONS)
    core = _make_core(config)
    with pytest.raises(ValueError, match="install_option list is empty"):
        core._install_with_config(config, "ws-123", unattended=True, install_option=[])


def test_array_install_rejects_unknown_member():
    config = _make_config(install_options=OPTIONS)
    core = _make_core(config)
    with pytest.raises(ValueError, match="Unknown install option"):
        core._install_with_config(
            config, "ws-123", unattended=True, install_option=["healthcare", "finance"]
        )


def test_array_install_rejects_duplicates():
    config = _make_config(install_options=OPTIONS)
    core = _make_core(config)
    with pytest.raises(ValueError, match="Duplicate install option"):
        core._install_with_config(
            config, "ws-123", unattended=True, install_option=["healthcare", "healthcare"]
        )


def test_array_install_rejects_non_string_entries():
    config = _make_config(install_options=OPTIONS)
    core = _make_core(config)
    with pytest.raises(ValueError, match="must be strings"):
        core._install_with_config(
            config, "ws-123", unattended=True, install_option=["healthcare", 7]
        )


def test_array_install_rejects_list_when_no_options_declared():
    config = _make_config()
    core = _make_core(config)
    with pytest.raises(ValueError, match="does not define install options"):
        core._install_with_config(
            config, "ws-123", unattended=True, install_option=["healthcare"]
        )


def test_installer_rejects_list_install_option():
    """Arrays are expanded by install(); the installer only takes scalars."""
    installer = JumpstartInstaller(
        _make_config(install_options=OPTIONS),
        workspace_id="ws-123",
        instance_name="js",
        install_option=["healthcare"],
    )
    with pytest.raises(ValueError, match="single install_option string"):
        installer.validate()


def test_installer_wraps_items_in_workspace_folder_name(tmp_path):
    """workspace_folder_name overrides the logical_id wrap folder."""
    with patch("fabric_jumpstart.installer.clone_repository") as mock_clone:
        repo = tmp_path / "repo"
        (repo / "demo" / "healthcare" / "Item.Notebook").mkdir(parents=True)
        mock_clone.return_value = repo

        installer = JumpstartInstaller(
            _make_config(install_options=OPTIONS),
            workspace_id="ws-123",
            instance_name="js",
            install_option="healthcare",
            workspace_folder_name="healthcare",
        )
        result = installer.prepare_workspace()

    assert (result / "healthcare" / "Item.Notebook").is_dir()
    assert not (result / "test-jumpstart").exists()
