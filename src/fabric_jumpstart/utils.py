import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

import requests


def _is_fabric_runtime() -> bool:
    """Checks if the execution runtime is Fabric."""
    try:
        notebookutils = get_ipython().user_ns.get("notebookutils")  # noqa: F821
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

def clone_repository(
    repository_url: str,
    ref: Optional[str] = None,
    dest_dir: Optional[str] = None
) -> str:
    """
    Clone a git repository to a destination directory.
    
    Args:
        repository_url: URL of the git repository
        ref: Git reference (branch, tag, or commit hash). Defaults to 'main'
        dest_dir: Destination directory (if None, creates temp directory)
    
    Returns:
        Path to cloned repository
    
    Raises:
        RuntimeError: If git clone fails
    """
    git_ref = ref or "main"
    
    # Create destination directory if not provided
    if dest_dir is None:
        dest_dir = tempfile.mkdtemp(prefix="fabric-jumpstart-")
    else:
        Path(dest_dir).mkdir(parents=True, exist_ok=True)
    
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
