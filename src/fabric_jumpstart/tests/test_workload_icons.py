"""Tests for workload icon resolution in the catalog UI."""

import pytest

from fabric_jumpstart.constants import VALID_WORKLOAD_TAGS
from fabric_jumpstart.ui.catalog import (
    WORKLOAD_ICON_MAP,
    _load_svg,
    _svg_to_data_uri,
    _shared_assets_path,
)

# Tags that intentionally have no icon
TAGS_WITHOUT_ICONS = {"Test"}


class TestWorkloadIconResolution:
    """Ensure every workload icon resolves to a valid SVG file."""

    def test_shared_assets_path_exists(self):
        """The shared assets directory must exist on disk."""
        assert _shared_assets_path.exists(), (
            f"Shared assets path does not exist: {_shared_assets_path}"
        )

    @pytest.mark.parametrize("tag", [t for t in VALID_WORKLOAD_TAGS if t not in TAGS_WITHOUT_ICONS])
    def test_valid_workload_tag_has_icon_mapping(self, tag):
        """Every real workload tag must have an entry in WORKLOAD_ICON_MAP."""
        assert tag in WORKLOAD_ICON_MAP, (
            f"Workload tag '{tag}' is missing from WORKLOAD_ICON_MAP"
        )

    @pytest.mark.parametrize("tag,filename", list(WORKLOAD_ICON_MAP.items()))
    def test_icon_file_exists(self, tag, filename):
        """Every mapped icon file must exist on disk."""
        svg_path = _shared_assets_path / filename
        assert svg_path.exists(), (
            f"Icon file for '{tag}' not found: {svg_path}"
        )

    @pytest.mark.parametrize("tag,filename", list(WORKLOAD_ICON_MAP.items()))
    def test_load_svg_returns_content(self, tag, filename):
        """_load_svg must return non-empty SVG content for every mapped icon."""
        _load_svg.cache_clear()
        content = _load_svg(filename)
        assert content, f"_load_svg returned empty content for '{tag}' ({filename})"
        assert "<svg" in content.lower(), (
            f"Content for '{tag}' does not appear to be valid SVG"
        )

    @pytest.mark.parametrize("tag,filename", list(WORKLOAD_ICON_MAP.items()))
    def test_data_uri_is_valid(self, tag, filename):
        """_svg_to_data_uri must produce a valid base64 data URI for every icon."""
        _load_svg.cache_clear()
        svg_content = _load_svg(filename)
        data_uri = _svg_to_data_uri(svg_content)
        assert data_uri.startswith("data:image/svg+xml;base64,"), (
            f"Invalid data URI for '{tag}': {data_uri[:60]}"
        )
