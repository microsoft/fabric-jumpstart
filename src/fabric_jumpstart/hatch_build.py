"""Hatch build hook to include shared assets from the repository root."""

from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        # When building from the repo, pull shared assets from the repository-level
        # assets directory. When building from an sdist (e.g. uv cache), the assets
        # are already present in the source tree via the include glob.
        repo_assets = (Path(self.root) / ".." / ".." / "assets" / "images").resolve()

        workload_dir = repo_assets / "tags" / "workload"
        if workload_dir.is_dir():
            build_data["force_include"][str(workload_dir)] = "fabric_jumpstart/ui/assets/workload"

        diagrams_dir = repo_assets / "diagrams"
        if diagrams_dir.is_dir():
            build_data["force_include"][str(diagrams_dir)] = "fabric_jumpstart/ui/assets/diagrams"
