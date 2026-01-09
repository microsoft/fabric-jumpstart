import logging
from pathlib import Path
from typing import Optional

import yaml
from fabric_cicd import FabricWorkspace, append_feature_flag, publish_all_items
from pydantic import ValidationError

from .schemas import Jumpstart
from .utils import _is_fabric_runtime, clone_repository

logger = logging.getLogger(__name__)


class jumpstart:
    def __init__(self):
        self._registry = self._load_registry()

    def _load_registry(self):
        """Load and validate jumpstart registry from YAML file."""
        registry_path = Path(__file__).parent / "registry.yml"
        with open(registry_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        registry_data = data.get('jumpstarts', [])
        
        valid_jumpstarts = []
        for jumpstart in registry_data:
            validated = self._validate_jumpstart_config(jumpstart)
            if validated:
                valid_jumpstarts.append(validated)
        
        return valid_jumpstarts
    
    def _validate_jumpstart_config(self, jumpstart):
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


    def list(self):
        """Display all available jumpstarts."""
        print("Available jumpstarts:")
        for j in self._registry:
            if j.get('include_in_listing', True):
                print(f"  • {j['id']}: {j.get('name', 'Unknown')} - {j.get('description', 'No description')}")

    def _get_jumpstart_by_id(self, jumpstart_id: str):
        """Get jumpstart config by id, returns None if not found."""
        return next((item for item in self._registry if item['id'] == jumpstart_id), None)

    def install(self, name: str, workspace_id: Optional[str] = None, **kwargs):
        """
        Install a jumpstart to a Fabric workspace.

        Args:
            name: Name of the jumpstart from registry
            workspace_id: Target workspace GUID (optional)
            **kwargs: Additional options (overrides registry defaults)
        """

        if workspace_id is None and _is_fabric_runtime():
            notebookutils = get_ipython().user_ns.get("notebookutils")  # noqa: F821
            workspace_id = notebookutils.runtime.context['currentWorkspaceId']

        config = self._get_jumpstart_by_id(name)
        if not config:
            error_msg = f"Unknown jumpstart '{name}'. Use fabric_jumpstart.list() to list available jumpstarts."
            raise ValueError(error_msg)

        logger.info(f"Installing '{name}' to workspace '{workspace_id}'")

        source_config = config['source']
        workspace_path_str = source_config['workspace_path']

        if 'repo_url' in source_config:
            # Remote jumpstart
            repo_url = source_config['repo_url']
            repo_ref = source_config.get('repo_ref', 'main')

            logger.info(f"Cloning from {repo_url} (ref: {repo_ref})")
            repo_path = Path(clone_repository(repository_url=repo_url, ref=repo_ref))

            logger.info(f"Repository cloned to {repo_path}")
        else:
            # Local jumpstart
            logger.info("Using local demo handler")
            # Get the path to the jumpstarts folder and join with jumpstart id
            jumpstarts_dir = Path(__file__).parent / "jumpstarts"
            logger.info(f"Using local jumpstart_dir {jumpstarts_dir}")
            repo_path = jumpstarts_dir / config['id']
            logger.info(f"Using local repo_path {repo_path}")

        workspace_path = repo_path / workspace_path_str.lstrip('/\\')
        logger.info(f"Workspace path {workspace_path}")

        items_in_scope = config.get('items_in_scope', [])
        try:
            logger.info(f"Deploying items from {workspace_path} to workspace '{workspace_id}'")
            self._install_items(
                items_in_scope=items_in_scope,
                workspace_path=workspace_path,
                workspace_id=workspace_id,
                feature_flags=kwargs.get('feature_flags', [])
            )
            logger.info(f"Successfully installed '{name}'")
        except Exception as e:
            logger.error(f"Failed to install jumpstart '{name}': {e}")
            raise e


    def _install_items(self, items_in_scope, workspace_path, workspace_id, feature_flags):
        for flag in feature_flags:
            append_feature_flag(flag)

        target_ws = FabricWorkspace(
            workspace_id=workspace_id,
            repository_directory=str(workspace_path),
            item_type_in_scope=items_in_scope
        )
        publish_all_items(target_ws)
