"""Conflict resolution logic and UI for handling item name conflicts."""

import html
import logging
from typing import List, Optional, Tuple

from .formatting import render_copyable_code
from ..utils import _set_item_prefix
from ..workspace_manager import WorkspaceManager

logger = logging.getLogger(__name__)


class ConflictDetector:
    """Detects and analyzes conflicts between planned and existing items."""
    
    def __init__(self, workspace_manager: WorkspaceManager):
        """Initialize conflict detector.
        
        Args:
            workspace_manager: WorkspaceManager instance for workspace operations
        """
        self.workspace_manager = workspace_manager
    
    def check_for_conflicts(
        self,
        planned_items: List[str],
        existing_items: List[str]
    ) -> Tuple[List[str], bool]:
        """Check for conflicts between planned and existing items.
        
        Args:
            planned_items: Items to be deployed
            existing_items: Items already in workspace
            
        Returns:
            Tuple of (conflicts list, had_conflicts bool)
        """
        conflicts = self.workspace_manager.detect_conflicts(planned_items, existing_items)
        return conflicts, bool(conflicts)
    
    def check_for_prefixed_items(
        self, 
        existing_items: List[str], 
        prefix: str
    ) -> List[str]:
        """Check if workspace already has items with the expected prefix.
        
        Args:
            existing_items: Items in workspace
            prefix: Expected prefix pattern
            
        Returns:
            List of existing items that already have the prefix
        """
        return [item for item in existing_items if item.startswith(prefix)]


class ConflictResolver:
    """Resolves item name conflicts using various strategies."""
    
    def __init__(
        self,
        workspace_manager: WorkspaceManager,
        jumpstart_id: int,
        logical_id: str
    ):
        """Initialize conflict resolver.
        
        Args:
            workspace_manager: WorkspaceManager instance
            jumpstart_id: Numeric jumpstart ID
            logical_id: Logical jumpstart ID (e.g., "analytics-lab")
        """
        self.workspace_manager = workspace_manager
        self.jumpstart_id = jumpstart_id
        self.logical_id = logical_id
        self.system_prefix = _set_item_prefix(jumpstart_id, logical_id)
    
    def resolve_with_prefix(
        self,
        planned_items_base: List[str],
        existing_items: List[str]
    ) -> Tuple[List[str], List[str], str]:
        """Resolve conflicts by applying auto-generated prefix.
        
        Args:
            planned_items_base: Base planned items without prefix
            existing_items: Items already in workspace
            
        Returns:
            Tuple of (prefixed_items, remaining_conflicts, prefix_used)
        """
        # Check if existing items already have the expected prefix
        existing_with_prefix = [
            item for item in existing_items 
            if item.startswith(self.system_prefix)
        ]
        
        if existing_with_prefix:
            logger.info(
                f"Found existing items with prefix '{self.system_prefix}'; "
                f"reusing to avoid double-prefix"
            )
        
        # Apply prefix
        prefixed_items = self.workspace_manager.apply_prefix_to_names(
            planned_items_base, 
            self.system_prefix
        )
        
        # Check for remaining conflicts
        remaining_conflicts = sorted(set(prefixed_items) & set(existing_items))
        
        logger.info(
            f"Auto prefix on conflict enabled; using prefix '{self.system_prefix}'; "
            f"remaining overlaps={remaining_conflicts}"
        )
        
        return prefixed_items, remaining_conflicts, self.system_prefix


class ConflictUI:
    """Renders conflict resolution UI."""
    
    @staticmethod
    def render_conflict_html(
        conflicts: List[str],
        instance_name: str,
        jumpstart_name: str,
        workspace_id: Optional[str]
    ) -> str:
        """Render HTML for conflict resolution options.
        
        Args:
            conflicts: List of conflicting item names
            instance_name: Name of jumpstart instance (e.g., "jumpstart")
            jumpstart_name: Logical ID of jumpstart
            workspace_id: Target workspace ID
            
        Returns:
            HTML string with conflict UI
        """
        conflict_list_html = ''.join(
            f"<li><code>{html.escape(o, quote=True)}</code></li>" for o in conflicts
        )
        
        ws_arg = f', workspace_id="{workspace_id}"' if workspace_id else ''
        overwrite_snippet = f"{instance_name}.install(\"{jumpstart_name}\"{ws_arg}, overwrite=True)"
        autoprefix_snippet = f"{instance_name}.install(\"{jumpstart_name}\"{ws_arg}, auto_prefix_on_conflict=True)"
        custom_prefix_snippet = f"{instance_name}.install(\"{jumpstart_name}\"{ws_arg}, item_prefix=\"<your_prefix>\")"
        
        # Generate code snippets
        snippet1 = render_copyable_code(overwrite_snippet)
        snippet2 = render_copyable_code(autoprefix_snippet)
        snippet3 = render_copyable_code(custom_prefix_snippet)
        
        result = ''.join([
            '<!-- CONFLICT HTML START -->',
            '<div class="install-conflicts" style="margin: 16px 0; padding: 16px; background: #fff4ce; border-left: 4px solid #ffb900; border-radius: 4px;">',
            '<h3 style="color: #323130; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">⚠️ Name conflicts detected</h3>',
            '<p style="margin: 8px 0;">The following items already exist in the workspace:</p>',
            f'<ul class="install-conflict-list" style="list-style: disc; margin: 8px 0 16px 20px;">{conflict_list_html}</ul>',
            '<p style="margin: 8px 0;">Resolve by using one of the extra arguments below:</p>',
            '<div class="install-conflict-snippets" style="margin-top: 8px;">',
            snippet1,
            snippet2,
            snippet3,
            '</div>',
            '</div>',
            '<!-- CONFLICT HTML END -->',
        ])
        
        return result
    
    @staticmethod
    def format_conflict_message(conflicts: List[str]) -> str:
        """Format a plain text conflict message.
        
        Args:
            conflicts: List of conflicting items
            
        Returns:
            Plain text message describing conflicts
        """
        return f"Conflicting items detected: {', '.join(conflicts)}"
