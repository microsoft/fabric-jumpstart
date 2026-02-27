import logging
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

import requests

logger = logging.getLogger(__name__)


def _is_fabric_runtime() -> bool:
    """Checks if the execution runtime is Fabric."""
    try:
        notebookutils = __import__('notebookutils')
        if notebookutils and hasattr(notebookutils, "runtime") and hasattr(notebookutils.runtime, "context"):
            context = notebookutils.runtime.context
            if "productType" in context:
                return context["productType"].lower() == "fabric"
        return False
    except Exception:
        return False

def download_file(url: str, dest: str):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

def set_workspace_in_yml(yml_path: str, workspace_name: str):
    import yaml
    with open(yml_path, 'r') as f:
        data = yaml.safe_load(f)
    # Modify workspace for core section
    data['core']['workspace'] = workspace_name
    with open(yml_path, 'w') as f:
        yaml.safe_dump(data, f, sort_keys=False)

def create_working_directory(temp_dir_prefix: str = "fabric-jumpstart-") -> Path:
    dest_dir = tempfile.mkdtemp(prefix=temp_dir_prefix)
    return Path(dest_dir)

def clone_files_to_temp_directory(
    source_path: Path,
    temp_dir_prefix: str = "fabric-jumpstart-"
):
    """
    Clone files from source_path to a temporary directory, preserving structure.
    
    Args:
        source_path: Path to source directory
        temp_dir_prefix: Prefix for the temporary directory name
    
    Returns:
        Path to the temporary directory
    """
    if not source_path.exists():
        raise FileNotFoundError(f"Source path does not exist: {source_path}")
    dest_path = create_working_directory(temp_dir_prefix)
    for item in source_path.iterdir():
        dest_item = dest_path / item.name
        if item.is_dir():
            shutil.copytree(item, dest_item, dirs_exist_ok=True)
        else:
            dest_item.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, dest_item)
    return dest_path


def _set_item_prefix(id: int, logical_id: str) -> str:
    """Generate item prefix for Item naming."""
    logical_words = logical_id.split('-')
    short_logical_id = ''.join(word[0] for word in logical_words if word)
    return f"js{id}_{short_logical_id}__"


def _apply_item_prefix(workspace_path: Path, item_prefix: Optional[str], base_names: Optional[list[str]] = None):
    """Rename item folders and references with the provided prefix.

    - Renames item directories shaped like "Name.Type" to "{prefix}Name.Type".
    - Recursively replaces occurrences of the original item name (the part before the '.')
      within text files under workspace_path.
    - Optionally seeds mappings from provided base_names even if no matching folders are found.
    """
    if item_prefix is None:
        return []

    if not workspace_path.exists():
        logger.info("Item prefix '%s' skipped; workspace path does not exist: %s", item_prefix, workspace_path)
        return []

    mappings = []  # (old_base, new_base)
    candidates = []

    # Collect candidate item directories anywhere under workspace_path
    candidate_dirs = [
        p for p in workspace_path.rglob('*')
        if p.is_dir() and '.' in p.name
    ]

    # Rename deeper paths first to avoid conflicts if nesting exists
    for entry in sorted(candidate_dirs, key=lambda p: len(p.parts), reverse=True):
        # If already prefixed, skip to avoid double-prefixing
        if item_prefix and entry.name.startswith(item_prefix):
            continue
        old_base, _, suffix = entry.name.partition('.')
        if not old_base or not suffix:
            continue

        new_base = f"{item_prefix}{old_base}"
        new_name = f"{new_base}.{suffix}"
        new_path = entry.with_name(new_name)
        candidates.append((old_base, entry))
        if new_path.exists():
            logger.info("Prefixed item path already exists, skipping rename: %s", new_path)
            mappings.append((old_base, new_base))
            continue
        entry.rename(new_path)
        mappings.append((old_base, new_base))

    if base_names:
        for base in base_names:
            if base and (base, f"{item_prefix}{base}") not in mappings:
                mappings.append((base, f"{item_prefix}{base}"))

    if not mappings:
        logger.info(
            "No item folders found to prefix in %s; candidates scanned=%s; base_names=%s; sample_dirs=%s",
            workspace_path,
            [c[0] for c in candidates],
            base_names,
            [str(p) for p in candidate_dirs[:10]],
        )
        return []

    modified_files = []
    for file_path in workspace_path.rglob('*'):
        if not file_path.is_file():
            continue
        try:
            content = file_path.read_text(encoding='utf-8')
        except Exception:
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                continue  # skip binaries or unreadable files

        new_content = content
        for old_base, new_base in mappings:
            # Use word boundary matching to avoid replacing partial matches
            # and avoid replacing text that's already prefixed
            import re
            # Negative lookbehind to ensure we don't replace already-prefixed occurrences
            pattern = rf'(?<!{re.escape(item_prefix)})\b{re.escape(old_base)}\b'
            new_content = re.sub(pattern, new_base, new_content)

        if new_content != content:
            file_path.write_text(new_content, encoding='utf-8')
            modified_files.append(file_path)

    logger.info(
        "Applied item prefix '%s' to %s items under %s; renamed=%s; files_modified=%s",
        item_prefix,
        len(mappings),
        workspace_path,
        [f"{old}->{new}" for old, new in mappings],
        [str(f) for f in modified_files[:10]],
    )
    return mappings

def clone_repository(
    repository_url: str,
    ref: Optional[str] = None,
    temp_dir_prefix: str = "fabric-jumpstart-"
) -> Path:
    """
    Clone a git repository to a destination directory.
    
    Args:
        repository_url: URL of the git repository
        ref: Git reference (branch, tag, or commit hash). Defaults to 'main'
        temp_dir_prefix: Prefix for the temporary directory name
    
    Returns:
        Path to cloned repository
    
    Raises:
        RuntimeError: If git clone fails
    """
    git_ref = ref or "main"
    
    dest_dir = create_working_directory(temp_dir_prefix)
    
    try:
        # Clone with specific reference using --branch
        # Git's --branch works with branches, tags, and commit hashes
        subprocess.run(
            ["git", "clone", "--branch", git_ref, "--single-branch", repository_url, dest_dir],
            check=True,
            capture_output=True,
            text=True
        )
        return dest_dir
    
    except subprocess.CalledProcessError as e:
        # Clean up on failure
        if Path(dest_dir).exists():
            shutil.rmtree(dest_dir)
        raise RuntimeError(
            f"Failed to clone repository from {repository_url} at ref '{git_ref}': {e.stderr}"
        ) from e
