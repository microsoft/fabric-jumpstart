"""Tests for jumpstart registry validation."""

import logging
import re
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError

from .schemas import Jumpstart

logger = logging.getLogger(__name__)


def get_registry_path() -> Path:
    """Get the path to the jumpstarts directory."""
    return Path(__file__).parent.parent / "src" / "fabric_jumpstart" / "jumpstarts"


def load_registry_data() -> list:
    """Load raw registry data from YAML files in jumpstarts directory."""
    registry_path = get_registry_path()
    jumpstarts = []
    
    # Load from core folder
    core_dir = registry_path / "core"
    if core_dir.is_dir():
        for yml_file in sorted(core_dir.glob("*.yml")):
            with open(yml_file, 'r', encoding='utf-8') as f:
                jumpstart = yaml.safe_load(f)
                if jumpstart:
                    jumpstart['core'] = True
                    jumpstarts.append(jumpstart)
    
    # Load from community folder
    community_dir = registry_path / "community"
    if community_dir.is_dir():
        for yml_file in sorted(community_dir.glob("*.yml")):
            with open(yml_file, 'r', encoding='utf-8') as f:
                jumpstart = yaml.safe_load(f)
                if jumpstart:
                    jumpstart['core'] = False
                    jumpstarts.append(jumpstart)
    
    return jumpstarts


def validate_jumpstart_config(jumpstart: dict) -> dict | None:
    """Validate a single jumpstart config.
    
    Args:
        jumpstart: A single jumpstart dict to validate
        
    Returns:
        Validated jumpstart dict or None if invalid.
    """
    jumpstart_id = jumpstart.get('logical_id', '[unknown]')
    
    try:
        validated = Jumpstart(**jumpstart)
        logger.debug(f"Jumpstart '{jumpstart_id}' validated successfully")
        return validated.model_dump()
    except ValidationError as e:
        logger.warning(
            f"Jumpstart '{jumpstart_id}' filtered out due to schema validation error: {e}"
        )
        return None


class TestRegistryValidation:
    """Test suite for registry schema validation."""

    def test_registry_file_exists(self):
        """Verify jumpstarts directory exists."""
        registry_path = get_registry_path()
        assert registry_path.exists(), f"Jumpstarts directory not found at {registry_path}"
        assert registry_path.is_dir(), f"Jumpstarts path must be a directory at {registry_path}"

    def test_registry_is_valid_yaml(self):
        """Verify registry.yml is valid YAML."""
        registry_data = load_registry_data()
        assert isinstance(registry_data, list), "Registry should contain a list of jumpstarts"

    def test_all_jumpstarts_have_valid_schema(self):
        """Verify all jumpstarts in registry pass schema validation."""
        registry_data = load_registry_data()
        
        invalid_jumpstarts = []
        for jumpstart in registry_data:
            jumpstart_id = jumpstart.get('logical_id', '[unknown]')
            try:
                Jumpstart(**jumpstart)
            except ValidationError as e:
                invalid_jumpstarts.append((jumpstart_id, str(e)))
        
        if invalid_jumpstarts:
            error_messages = [f"  - {jid}: {err}" for jid, err in invalid_jumpstarts]
            pytest.fail(
                "The following jumpstarts failed schema validation:\n" + 
                "\n".join(error_messages)
            )

    @pytest.mark.parametrize("jumpstart", load_registry_data(), ids=lambda j: j.get('logical_id', 'unknown'))
    def test_individual_jumpstart_schema(self, jumpstart):
        """Test each jumpstart individually for better error reporting."""
        jumpstart_id = jumpstart.get('logical_id', '[unknown]')
        try:
            validated = Jumpstart(**jumpstart)
            assert validated.logical_id == jumpstart_id
        except ValidationError as e:
            pytest.fail(f"Jumpstart '{jumpstart_id}' failed validation: {e}")

    def test_ids_are_unique_and_positive(self):
        """Ensure numeric ids are unique and positive across the registry."""
        registry_data = load_registry_data()
        ids = [j.get('id') for j in registry_data]
        assert all(isinstance(i, int) and i > 0 for i in ids), "All ids must be positive integers"
        assert len(ids) == len(set(ids)), "Numeric ids must be unique"

    def test_logical_ids_are_unique(self):
        """Ensure logical_ids are unique across the registry."""
        registry_data = load_registry_data()
        logical_ids = [j.get('logical_id') for j in registry_data]
        assert all(logical_ids), "logical_id must be present for all entries"
        assert len(logical_ids) == len(set(logical_ids)), "logical_ids must be unique"

    def test_logical_ids_are_kebab_case(self):
        """Ensure logical_ids are lowercase kebab-case (pipe case)."""
        registry_data = load_registry_data()
        slug_re = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
        for j in registry_data:
            logical_id = j.get('logical_id')
            assert logical_id is not None, "logical_id must be present"
            assert slug_re.match(logical_id), f"logical_id '{logical_id}' must be kebab-case (lowercase letters/numbers with dashes)"

    def test_repo_urls_and_refs_resolve(self):
        """Ensure remote repo_url/repo_ref pairs are reachable via git ls-remote."""
        if not shutil.which("git"):
            pytest.skip("git executable not available")

        registry_data = load_registry_data()
        for j in registry_data:
            source = j.get("source", {}) or {}
            repo_url = source.get("repo_url")
            if not repo_url:
                continue

            repo_ref = source["repo_ref"]
            check_cmd = ["git", "ls-remote", "--exit-code", repo_url, repo_ref]
            result = subprocess.run(check_cmd, capture_output=True, text=True, timeout=15)

            if result.returncode == 0:
                continue

            # If the ref lookup failed, check if the repo itself is reachable to
            # distinguish a bad ref from a network/auth issue.
            reachability = subprocess.run(
                ["git", "ls-remote", "--exit-code", repo_url],
                capture_output=True,
                text=True,
                timeout=15,
            )

            if reachability.returncode != 0:
                pytest.skip(
                    f"Unable to reach repo_url '{repo_url}' (logical_id={j.get('logical_id', '[unknown]')}); "
                    f"stderr: {reachability.stderr.strip()}"
                )

            assert False, (
                f"Repo ref not reachable for {j.get('logical_id', '[unknown]')}: {repo_url}@{repo_ref}\n"
                f"stderr: {result.stderr.strip()}"
            )
        slug_re = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
        for j in registry_data:
            logical_id = j.get('logical_id')
            assert logical_id is not None, "logical_id must be present"
            assert slug_re.match(logical_id), f"logical_id '{logical_id}' must be kebab-case (lowercase letters/numbers with dashes)"

    def test_validate_jumpstart_config_returns_dict_on_success(self):
        """Test validate_jumpstart_config returns dict for valid config."""
        valid_config = {
            "id": 999,
            "logical_id": "test-jumpstart",
            "name": "Test Jumpstart",
            "description": "A test jumpstart",
            "date_added": "01/01/2025",
            "workload_tags": ["Test"],
            "scenario_tags": ["Test"],
            "source": {"workspace_path": "/src", "preview_image_path": "/img/img.png"},
            "entry_point": "1_ExploreData.Notebook",
            "owner_email": "owner@example.com",
        }
        result = validate_jumpstart_config(valid_config)
        assert result is not None
        assert result['logical_id'] == "test-jumpstart"

    def test_validate_jumpstart_config_returns_none_on_failure(self):
        """Test validate_jumpstart_config returns None for invalid config."""
        invalid_config = {
            "id": "missing-required-fields"
            # Missing required fields
        }
        result = validate_jumpstart_config(invalid_config)
        assert result is None

    def test_core_flag_based_on_folder(self):
        """Verify core flag is set correctly based on folder location."""
        registry_data = load_registry_data()
        
        # All jumpstarts should have core flag
        for jumpstart in registry_data:
            logical_id = jumpstart.get('logical_id', '[unknown]')
            assert 'core' in jumpstart, f"Jumpstart '{logical_id}' missing core flag"
            assert isinstance(jumpstart['core'], bool), f"Jumpstart '{logical_id}' core flag must be boolean"
