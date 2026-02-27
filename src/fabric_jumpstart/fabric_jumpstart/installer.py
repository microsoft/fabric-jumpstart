"""Jumpstart installer orchestration."""

import logging
from pathlib import Path
from typing import Dict, List, Optional

from fabric_cicd import FabricWorkspace

from .constants import ITEM_URL_ROUTING_PATH_MAP
from .ui import ConflictDetector, ConflictResolver
from .utils import (
    _apply_item_prefix,
    _is_fabric_runtime,
    clone_files_to_temp_directory,
    clone_repository,
)
from .workspace_manager import WorkspaceManager

logger = logging.getLogger(__name__)


class JumpstartInstaller:
    """Orchestrates the installation of a jumpstart to a Fabric workspace."""
    
    def __init__(
        self,
        config: Dict,
        workspace_id: Optional[str],
        instance_name: str,
        **options
    ):
        """Initialize the installer.
        
        Args:
            config: Jumpstart configuration dictionary from registry
            workspace_id: Target workspace GUID
            instance_name: Variable name of jumpstart instance
            **options: Installation options (update_existing, auto_prefix_on_conflict, item_prefix, etc.)
        """
        self.config = config
        self.workspace_id = workspace_id
        self.instance_name = instance_name
        self.options = options
        
        # Extract common options
        self.update_existing = bool(options.get('update_existing', False))
        self.auto_prefix_on_conflict = bool(options.get('auto_prefix_on_conflict', False))
        self.item_prefix = options.get('item_prefix')
        self.unattended = options.get('unattended', False)
        self.debug_logs = bool(options.get('debug', False))
        
        # State tracking
        self.log_buffer: List[Dict] = []
        self.working_repo_path: Optional[Path] = None
        self.temp_workspace_path: Optional[Path] = None
        self.workspace_manager: Optional[WorkspaceManager] = None
        self.had_conflicts = False
        self.resolved_prefix: Optional[str] = None
    
    def validate(self) -> str:
        """Validate configuration and resolve workspace ID.
        
        Returns:
            Resolved workspace ID
            
        Raises:
            ValueError: If workspace_id cannot be determined
        """
        if self.workspace_id is None and _is_fabric_runtime():
            import notebookutils  # type: ignore[import-untyped]
            self.workspace_id = notebookutils.runtime.context['currentWorkspaceId']
        
        if self.workspace_id is None:
            raise ValueError(
                "workspace_id must be provided when not running inside a Fabric runtime"
            )
        
        logger.info(
            f"Installing '{self.config.get('logical_id')}' to workspace '{self.workspace_id}'"
        )
        return self.workspace_id
    
    def prepare_workspace(self) -> Path:
        """Clone/prepare the workspace directory.
        
        Returns:
            Path to prepared workspace directory
        """
        from .utils import _set_item_prefix
        
        source_config = self.config['source']
        workspace_path = source_config['workspace_path']
        config_id = self.config.get('id')
        if config_id is None:
            raise ValueError("Jumpstart config missing required 'id' field")
        logical_id = self.config.get('logical_id', '')
        system_prefix = _set_item_prefix(config_id, logical_id)
        
        if 'repo_url' in source_config:
            # Remote jumpstart
            repo_url = source_config['repo_url']
            repo_ref = source_config.get('repo_ref', 'main')
            logger.info(f"Cloning from {repo_url} (ref: {repo_ref})")
            self.working_repo_path = clone_repository(
                repository_url=repo_url,
                ref=repo_ref,
                temp_dir_prefix=system_prefix
            )
            logger.info(f"Repository cloned to {self.working_repo_path}")
        else:
            # Local jumpstart
            logger.info("Using local demo handler")
            jumpstarts_dir = Path(__file__).parent / "jumpstarts"
            repo_path = jumpstarts_dir / logical_id
            self.working_repo_path = clone_files_to_temp_directory(
                source_path=repo_path,
                temp_dir_prefix=system_prefix
            )
            logger.info(f"Cloned local repo_path {repo_path} to temp {self.working_repo_path}")
        
        self.temp_workspace_path = self.working_repo_path / workspace_path.lstrip('/\\')
        logger.info(f"Workspace path {self.temp_workspace_path}")
        return self.temp_workspace_path
    
    def initialize_workspace_manager(self) -> WorkspaceManager:
        """Initialize the workspace manager.
        
        Returns:
            Configured WorkspaceManager instance
            
        Raises:
            RuntimeError: If workspace_id or temp_workspace_path is not set
        """
        if self.workspace_id is None:
            raise RuntimeError("workspace_id must be set before initializing workspace manager")
        if self.temp_workspace_path is None:
            raise RuntimeError("temp_workspace_path must be set before initializing workspace manager")
            
        items_in_scope = self.config.get('items_in_scope', [])
        self.workspace_manager = WorkspaceManager(
            workspace_id=self.workspace_id,
            workspace_path=self.temp_workspace_path,
            items_in_scope=items_in_scope
        )
        return self.workspace_manager
    
    def check_conflicts(
        self
    ) -> tuple[List[str], List[str], List[str], bool]:
        """Check for item name conflicts.
        
        Returns:
            Tuple of (planned_items, existing_items, conflicts, had_conflicts)
            
        Raises:
            RuntimeError: If workspace_manager is not initialized
        """
        if self.workspace_manager is None:
            raise RuntimeError("workspace_manager must be initialized before checking conflicts")
            
        existing_items = self.workspace_manager.get_existing_items()
        planned_items_base = self.workspace_manager.collect_planned_items()
        planned_items = self.workspace_manager.apply_prefix_to_names(
            planned_items_base,
            self.item_prefix
        )
        
        detector = ConflictDetector(self.workspace_manager)
        conflicts, had_conflicts = detector.check_for_conflicts(planned_items, existing_items)
        
        return planned_items_base, existing_items, conflicts, had_conflicts
    
    def resolve_conflicts(
        self,
        planned_items_base: List[str],
        existing_items: List[str],
        conflicts: List[str]
    ) -> tuple[Optional[str], List[str]]:
        """Resolve conflicts using configured strategy.
        
        Args:
            planned_items_base: Base planned items without prefix
            existing_items: Existing items in workspace
            conflicts: Detected conflicts
            
        Returns:
            Tuple of (resolved_prefix, remaining_conflicts)
            
        Raises:
            RuntimeError: If conflicts remain and no resolution strategy is enabled
        """
        if not conflicts:
            return self.item_prefix, []
        
        self.had_conflicts = True
        logger.info(f"Conflicting items detected: {conflicts}")
        
        if self.auto_prefix_on_conflict:
            if self.workspace_manager is None:
                raise RuntimeError("workspace_manager must be initialized")
            config_id = self.config.get('id')
            if config_id is None:
                raise ValueError("Jumpstart config missing required 'id' field")
                
            resolver = ConflictResolver(
                self.workspace_manager,
                config_id,
                self.config.get('logical_id', '')
            )
            prefixed_items, remaining_conflicts, prefix_used = resolver.resolve_with_prefix(
                planned_items_base,
                existing_items
            )
            
            if not remaining_conflicts:
                logger.info(f"Conflicts resolved via auto-prefix '{prefix_used}'")
                self.resolved_prefix = f"{prefix_used}{self.item_prefix or ''}"
                return self.resolved_prefix, []
            else:
                conflicts = remaining_conflicts
        
        if self.update_existing:
            logger.info(f"Conflicts resolved via update_existing flag; proceeding: {conflicts}")
            return self.item_prefix, []
        
        # Conflicts remain and no resolution strategy
        return self.item_prefix, conflicts
    
    def apply_prefix_to_files(self, prefix: Optional[str]) -> List[tuple]:
        """Apply item prefix to workspace files.
        
        Args:
            prefix: Prefix to apply
            
        Returns:
            List of (old_name, new_name) mappings
            
        Raises:
            RuntimeError: If temp_workspace_path is not set
        """
        if self.temp_workspace_path is None:
            raise RuntimeError("temp_workspace_path must be set before applying prefix")
            
        entry_point = self.config.get('entry_point')
        base_names = []
        if entry_point and isinstance(entry_point, str) and '.' in entry_point:
            base_names.append(entry_point.split('.')[0])
        
        logger.info(
            f"Applying item prefix '{prefix}' to workspace path {self.temp_workspace_path} "
            f"with base_names={base_names}"
        )
        
        prefix_mappings = _apply_item_prefix(self.temp_workspace_path, prefix, base_names=base_names)
        
        if prefix:
            logger.info(f"Item prefix mappings applied: {prefix_mappings}")
        if self.auto_prefix_on_conflict and self.had_conflicts and prefix:
            logger.info(f"Auto-prefix applied with mappings: {prefix_mappings}")
        
        return prefix_mappings
    
    def deploy(self) -> FabricWorkspace:
        """Deploy items to workspace.
        
        Returns:
            FabricWorkspace instance after deployment
            
        Raises:
            RuntimeError: If workspace_manager is not initialized
        """
        if self.workspace_manager is None:
            raise RuntimeError("workspace_manager must be initialized before deploying")
            
        feature_flags = self.options.get('feature_flags', [])
        return self.workspace_manager.deploy_items(feature_flags)
    
    def generate_entry_url(self, target_ws: FabricWorkspace, prefix: Optional[str]) -> Optional[str]:
        """Generate entry point URL for deployed jumpstart.
        
        Args:
            target_ws: Deployed FabricWorkspace
            prefix: Applied prefix
            
        Returns:
            Entry point URL or None
        """
        entry_point = self.config.get('entry_point')
        if not entry_point:
            return None
        
        # Apply prefix to entry point if needed
        prefixed_entry_point = entry_point
        if prefix and not entry_point.startswith(('http://', 'https://')):
            prefixed_entry_point = f"{prefix}{entry_point}"
        
        # If already a URL, return as-is
        if prefixed_entry_point.startswith(('http://', 'https://')):
            return prefixed_entry_point
        
        # Generate Fabric item URL
        from fabric_cicd._parameter._utils import _extract_item_attribute
        
        parts = prefixed_entry_point.split('.')
        if len(parts) >= 2:
            item_name, item_type = parts[0], parts[1]
            item_id = _extract_item_attribute(
                target_ws,
                f"$items.{item_type}.{item_name}.$id",
                False
            )
            
            routing_path = ITEM_URL_ROUTING_PATH_MAP.get(item_type)
            if not routing_path:
                raise ValueError(f"Unsupported entry point item type: {item_type}")
            
            return (
                f"https://app.powerbi.com/groups/{target_ws.workspace_id}"
                f"/{routing_path}/{item_id}?experience=fabric-developer"
            )
        
        return None
