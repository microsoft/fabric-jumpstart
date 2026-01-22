"""Tests for jumpstart registry validation."""

import logging
from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError

from .schemas import Jumpstart

logger = logging.getLogger(__name__)


def get_registry_path() -> Path:
    """Get the path to the registry.yml file."""
    return Path(__file__).parent.parent / "src" / "fabric_jumpstart" / "registry.yml"


def load_registry_data() -> list:
    """Load raw registry data from YAML file."""
    registry_path = get_registry_path()
    with open(registry_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data.get('jumpstarts', [])


def validate_jumpstart_config(jumpstart: dict) -> dict | None:
    """Validate a single jumpstart config.
    
    Args:
        jumpstart: A single jumpstart dict to validate
        
    Returns:
        Validated jumpstart dict or None if invalid.
    """
    jumpstart_id = jumpstart.get('id', '[unknown]')
    
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
        """Verify registry.yml file exists."""
        registry_path = get_registry_path()
        assert registry_path.exists(), f"Registry file not found at {registry_path}"

    def test_registry_is_valid_yaml(self):
        """Verify registry.yml is valid YAML."""
        registry_data = load_registry_data()
        assert isinstance(registry_data, list), "Registry should contain a list of jumpstarts"

    def test_all_jumpstarts_have_valid_schema(self):
        """Verify all jumpstarts in registry pass schema validation."""
        registry_data = load_registry_data()
        
        invalid_jumpstarts = []
        for jumpstart in registry_data:
            jumpstart_id = jumpstart.get('id', '[unknown]')
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

    @pytest.mark.parametrize("jumpstart", load_registry_data(), ids=lambda j: j.get('id', 'unknown'))
    def test_individual_jumpstart_schema(self, jumpstart):
        """Test each jumpstart individually for better error reporting."""
        jumpstart_id = jumpstart.get('id', '[unknown]')
        try:
            validated = Jumpstart(**jumpstart)
            assert validated.id == jumpstart_id
        except ValidationError as e:
            pytest.fail(f"Jumpstart '{jumpstart_id}' failed validation: {e}")

    def test_validate_jumpstart_config_returns_dict_on_success(self):
        """Test validate_jumpstart_config returns dict for valid config."""
        valid_config = {
            "id": "test-jumpstart",
            "name": "Test Jumpstart",
            "description": "A test jumpstart",
            "date_added": "01/01/2025",
            "workload_tags": ["Test"],
            "scenario_tags": ["Test"],
            "source": {"workspace_path": "/src", "preview_image_path": "/img/img.png"},
            "entry_point": "1_ExploreData.Notebook"
        }
        result = validate_jumpstart_config(valid_config)
        assert result is not None
        assert result['id'] == "test-jumpstart"

    def test_validate_jumpstart_config_returns_none_on_failure(self):
        """Test validate_jumpstart_config returns None for invalid config."""
        invalid_config = {
            "id": "missing-required-fields"
            # Missing required fields
        }
        result = validate_jumpstart_config(invalid_config)
        assert result is None
