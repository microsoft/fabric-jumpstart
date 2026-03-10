"""Hatch build hook to include shared workload icons from the repository root."""

from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        # When building from the repo, pull workload icons from the shared assets directory.
        # When building from an sdist (e.g. uv cache), the icons are already present in the
        # source tree via the include glob, so this is a no-op.
        shared = (Path(self.root) / ".." / ".." / "assets" / "images" / "tags" / "workload").resolve()
        if shared.is_dir():
            build_data["force_include"][str(shared)] = "fabric_jumpstart/ui/assets/workload"
