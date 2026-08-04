"""Workspace management for Fabric operations."""

import logging
from pathlib import Path
from typing import List, Optional

from fabric_cicd import FabricWorkspace, append_feature_flag, publish_all_items

from .utils import resolve_token_credential

logger = logging.getLogger(__name__)


class WorkspaceManager:
    """Manages interactions with Fabric workspaces.
    
    Handles item enumeration, comparison, and deployment operations.
    """
    
    def __init__(self, workspace_id: str, workspace_path: Path, items_in_scope: List[str], repository_directory: Optional[Path] = None):
        """Initialize workspace manager.
        
        Args:
            workspace_id: Target workspace GUID
            workspace_path: Local path containing items to deploy (used for conflict scanning)
            items_in_scope: List of item types to include (e.g., ['Notebook', 'Lakehouse'])
            repository_directory: Root directory passed to fabric_cicd as repository_directory.
                When set to the *parent* of workspace_path, fabric_cicd will deploy items
                into a named Fabric workspace folder matching workspace_path.name.
                Defaults to workspace_path (items deploy to the Fabric workspace root).
        """
        self.workspace_id = workspace_id
        self.workspace_path = workspace_path
        self.items_in_scope = items_in_scope
        self.repository_directory = repository_directory if repository_directory is not None else workspace_path
        self._fabric_workspace: Optional[FabricWorkspace] = None
    
    def get_fabric_workspace(self) -> FabricWorkspace:
        """Get or create FabricWorkspace instance.
        
        Returns:
            Initialized FabricWorkspace instance
        """
        if self._fabric_workspace is None:
            credential = resolve_token_credential()
            self._fabric_workspace = FabricWorkspace(
                workspace_id=self.workspace_id,
                repository_directory=str(self.repository_directory),
                item_type_in_scope=self.items_in_scope,
                token_credential=credential,
            )
        return self._fabric_workspace
    
    def get_existing_items(self) -> List[str]:
        """Get list of existing item names in the target workspace.
        
        Returns:
            List of items in format "ItemName.ItemType"
            
        Example:
            ['MyNotebook.Notebook', 'MyLakehouse.Lakehouse']
        """
        existing_items: List[str] = []
        from fabric_cicd.constants import DEFAULT_API_ROOT_URL
        
        workspace = self.get_fabric_workspace()
        next_url = f"{DEFAULT_API_ROOT_URL}/v1/workspaces/{workspace.workspace_id}/items"
        
        while next_url:
            response = workspace.endpoint.invoke(method="GET", url=next_url)
            if not isinstance(response, dict):
                break
            
            body = response.get("body", {})
            for item in body.get("value", []) or []:
                name = item.get("displayName")
                if name:
                    item_type = item.get("type")
                    item_str = f"{name}.{item_type}"
                    existing_items.append(item_str)
            
            continuation_uri = body.get("continuationUri")
            continuation_token = body.get("continuationToken")
            
            if continuation_uri:
                next_url = continuation_uri
            elif continuation_token:
                next_url = (
                    f"{DEFAULT_API_ROOT_URL}/v1/workspaces/{workspace.workspace_id}/items"
                    f"?continuationToken={continuation_token}"
                )
            else:
                next_url = None
        
        logger.debug(f"Found {len(existing_items)} existing items in workspace {self.workspace_id}")
        return existing_items
    
    def collect_planned_items(self) -> List[str]:
        """Recursively collect planned items from workspace path.
        
        Scans the workspace directory for item folders matching the pattern
        "ItemName.ItemType" and filters by items_in_scope.
        
        Returns:
            List of planned items in format "ItemName.ItemType"
            
        Example:
            ['MyNotebook.Notebook', 'MyLakehouse.Lakehouse']
        """
        planned = set()
        scope_lower = {s.lower() for s in self.items_in_scope} if self.items_in_scope else None
        
        for entry in self.workspace_path.rglob('*'):
            if not entry.is_dir() or '.' not in entry.name:
                continue
            base, _, item_type = entry.name.partition('.')
            if not base or not item_type:
                continue
            if scope_lower and item_type.lower() not in scope_lower:
                continue
            planned.add(f"{base}.{item_type}")
        
        result = sorted(planned)
        logger.debug(f"Collected {len(result)} planned items from {self.workspace_path}")
        return result
    
    def apply_prefix_to_names(self, items: List[str], prefix: Optional[str]) -> List[str]:
        """Apply prefix to item names without mutating files.
        
        Args:
            items: List of items in format "ItemName.ItemType"
            prefix: Prefix to apply to item names (e.g., "js3_al__")
            
        Returns:
            List of items with prefix applied
            
        Example:
            >>> apply_prefix_to_names(['Notebook.Notebook'], 'test_')
            ['test_Notebook.Notebook']
        """
        if not prefix:
            return sorted(items)
        
        prefixed = []
        for entry in items:
            base, _, item_type = entry.partition('.')
            if not base or not item_type:
                continue
            prefixed.append(f"{prefix}{base}.{item_type}")
        
        return sorted(prefixed)
    
    def detect_conflicts(
        self, 
        planned_items: List[str], 
        existing_items: List[str]
    ) -> List[str]:
        """Detect conflicting items between planned and existing.
        
        Args:
            planned_items: Items to be deployed
            existing_items: Items already in workspace
            
        Returns:
            Sorted list of conflicting item names
        """
        conflicts = sorted(set(planned_items) & set(existing_items))
        if conflicts:
            logger.info(f"Detected {len(conflicts)} conflicts: {conflicts}")
        return conflicts
    
    def deploy_items(self, feature_flags: Optional[List[str]] = None) -> FabricWorkspace:
        """Deploy all items to the workspace.
        
        Args:
            feature_flags: Optional list of feature flags to enable
            
        Returns:
            The FabricWorkspace instance after deployment
            
        Raises:
            Various exceptions from fabric_cicd if deployment fails
        """
        if feature_flags:
            for flag in feature_flags:
                append_feature_flag(flag)
        
        # TEMP SHIM: fabric-cicd 1.1.0 publishes DataAgent (order 25) before Ontology
        # (order 27), so a DataAgent referencing $items.Ontology.<name>.$id fails on
        # first deploy. Swap them so the Ontology publishes first.
        # Remove once fabric-cicd fixes SERIAL_ITEM_PUBLISH_ORDER upstream.
        from fabric_cicd import constants as _cicd_constants
        _order = _cicd_constants.SERIAL_ITEM_PUBLISH_ORDER
        _inv = {v.value: k for k, v in _order.items()}
        if "DataAgent" in _inv and "Ontology" in _inv and _inv["DataAgent"] < _inv["Ontology"]:
            _order[_inv["DataAgent"]], _order[_inv["Ontology"]] = _order[_inv["Ontology"]], _order[_inv["DataAgent"]]
            logger.info("Publish-order shim applied: Ontology now publishes before DataAgent")
        
        workspace = self.get_fabric_workspace()
        # Re-read parameter.yml: prefixes rewrite it on disk after this workspace
        # object (and its parameter snapshot) was created for conflict scanning,
        # and publish_all_items refreshes repository items but not parameters.
        refresh_params = getattr(workspace, "_refresh_parameter_file", None)
        if callable(refresh_params):
            refresh_params()
        logger.info(f"Deploying items from {self.workspace_path} to workspace '{self.workspace_id}'")
        publish_all_items(workspace)
        logger.info("Successfully deployed all items")
        
        return workspace
