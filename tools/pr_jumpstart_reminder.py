#!/usr/bin/env python3
"""Render a PR reminder comment for a net-new jumpstart manifest.

Given the path to a single jumpstart manifest YAML (the one added in a PR), this
script parses the manifest and prints a Markdown comment body reminding the
contributor to test the install via ``jumpstart._install_from_github(...)``,
pre-populated with the values from their manifest.

The output includes a hidden HTML marker so the workflow can post/update a single
"sticky" comment rather than spamming the PR on every push.
"""

from __future__ import annotations

import argparse
import sys
from typing import Any

import yaml

# Hidden marker used by the workflow to locate and update the sticky comment.
MARKER = "<!-- jumpstart-install-reminder -->"


def _format_items(items: Any) -> str:
    """Render items_in_scope as a Python list literal, e.g. ["Lakehouse", "Notebook"]."""
    if not isinstance(items, list):
        return "[]"
    return "[" + ", ".join(f'"{str(i)}"' for i in items) + "]"


def build_snippet(manifest: dict) -> str:
    """Build the ``_install_from_github`` call from a manifest dict."""
    logical_id = str(manifest.get("logical_id", ""))
    source = manifest.get("source") or {}
    repo_url = str(source.get("repo_url", ""))
    repo_ref = str(source.get("repo_ref", ""))
    workspace_path = source.get("workspace_path")
    entry_point = str(manifest.get("entry_point", ""))
    items = _format_items(manifest.get("items_in_scope"))

    lines = [
        "import fabric_jumpstart as jumpstart",
        "",
        "jumpstart._install_from_github(",
        f'    logical_id="{logical_id}",',
        f'    repo_url="{repo_url}",',
        f'    repo_ref="{repo_ref}",',
    ]

    # Only include workspace_path when it deviates from the "{logical_id}/" default.
    default_workspace_path = f"{logical_id}/"
    if workspace_path and str(workspace_path) != default_workspace_path:
        lines.append(f'    workspace_path="{workspace_path}",')

    lines.extend(
        [
            f'    entry_point="{entry_point}",',
            f"    items_in_scope={items}"
            ")",
        ]
    )
    return "\n".join(lines)


def build_comment(manifest: dict, manifest_path: str) -> str:
    """Build the full Markdown comment body."""
    name = str(manifest.get("name") or manifest.get("logical_id") or "your jumpstart")
    logical_id = str(manifest.get("logical_id", ""))
    snippet = build_snippet(manifest)
    return f"""{MARKER}
### 🚀 Test your new jumpstart before merging

Thanks for contributing **{name}**! This PR adds a new jumpstart manifest
(`{manifest_path}`). Please verify it installs end-to-end by
running the following in a Fabric notebook, populated from your manifest:

```python
!pip install fabric-jumpstart --quiet

{snippet}
```

`_install_from_github` deploys directly from your source repo (no registry entry
required), so it mirrors what end users will experience via
`jumpstart.install("{logical_id}")` once merged.

Reply here confirming a successful install (and share any screenshots) to help
accelerate the review process. Thanks! 🙌
"""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "manifest_path",
        help="Path to the net-new jumpstart manifest YAML file.",
    )
    args = parser.parse_args(argv)

    try:
        with open(args.manifest_path, encoding="utf-8") as fh:
            manifest = yaml.safe_load(fh)
    except (OSError, yaml.YAMLError) as exc:
        print(f"Failed to read manifest {args.manifest_path}: {exc}", file=sys.stderr)
        return 1

    if not isinstance(manifest, dict):
        print(f"Manifest {args.manifest_path} did not parse to a mapping.", file=sys.stderr)
        return 1

    print(build_comment(manifest, args.manifest_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
