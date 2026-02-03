"""Jumpstart registry management for loading and querying available jumpstarts."""

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import yaml

logger = logging.getLogger(__name__)


class JumpstartRegistry:
    """Manages the jumpstart registry and provides query operations.
    
    The registry is loaded from a YAML file and cached for the lifetime
    of the instance.
    """
    
    def __init__(self, registry_path: Optional[Path] = None):
        """Initialize the registry.
        
        Args:
            registry_path: Path to registry YAML file. If None, uses default location.
        """
        if registry_path is None:
            registry_path = Path(__file__).parent / "registry.yml"
        self._registry_path = registry_path
        self._jumpstarts: Optional[List[Dict]] = None
    
    def load(self) -> List[Dict]:
        """Load the jumpstart registry from YAML file.
        
        Returns:
            List of jumpstart configuration dictionaries
            
        Raises:
            FileNotFoundError: If registry file doesn't exist
            yaml.YAMLError: If registry file is invalid YAML
        """
        if self._jumpstarts is None:
            logger.debug(f"Loading jumpstart registry from {self._registry_path}")
            with open(self._registry_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            self._jumpstarts = data.get('jumpstarts', [])
            logger.info(f"Loaded {len(self._jumpstarts)} jumpstarts from registry")
        return self._jumpstarts
    
    def get_by_id(self, jumpstart_id: str) -> Optional[Dict]:
        """Get a jumpstart by its logical_id or numeric id.
        
        Args:
            jumpstart_id: Logical ID (e.g., "analytics-lab") or numeric ID
            
        Returns:
            Jumpstart configuration dict or None if not found
        """
        jumpstarts = self.load()
        return next(
            (
                item
                for item in jumpstarts
                if item.get('logical_id') == jumpstart_id
                or str(item.get('id')) == str(jumpstart_id)
            ),
            None,
        )
    
    def list_all(self, include_unlisted: bool = False) -> List[Dict]:
        """Get all jumpstarts, optionally filtering by listing status.
        
        Args:
            include_unlisted: If True, include jumpstarts with include_in_listing=False
            
        Returns:
            List of jumpstart configuration dictionaries
        """
        jumpstarts = self.load()
        if include_unlisted:
            return jumpstarts
        return [j for j in jumpstarts if j.get('include_in_listing', True)]
    
    def filter_by_workload(self, workload: str) -> List[Dict]:
        """Filter jumpstarts by workload tag.
        
        Args:
            workload: Workload tag to filter by (e.g., "Data Engineering")
            
        Returns:
            List of matching jumpstarts
        """
        jumpstarts = self.load()
        return [
            j for j in jumpstarts
            if workload in j.get('workload_tags', [])
        ]
    
    def filter_by_scenario(self, scenario: str) -> List[Dict]:
        """Filter jumpstarts by scenario tag.
        
        Args:
            scenario: Scenario tag to filter by
            
        Returns:
            List of matching jumpstarts
        """
        jumpstarts = self.load()
        return [
            j for j in jumpstarts
            if scenario in j.get('scenario_tags', [])
        ]
    
    def filter_by_type(self, jumpstart_type: str) -> List[Dict]:
        """Filter jumpstarts by type.
        
        Args:
            jumpstart_type: Type to filter by (e.g., "Tutorial", "Demo", "Accelerator")
            
        Returns:
            List of matching jumpstarts
        """
        jumpstarts = self.load()
        return [
            j for j in jumpstarts
            if j.get('type', '').lower() == jumpstart_type.lower()
        ]
    
    def mark_new_items(self, days_threshold: int = 60) -> List[Dict]:
        """Mark jumpstarts as 'new' based on their date_added.
        
        Args:
            days_threshold: Number of days to consider an item "new"
            
        Returns:
            List of all jumpstarts with 'is_new' field added
        """
        jumpstarts = self.load()
        new_threshold = datetime.now() - timedelta(days=days_threshold)
        
        for j in jumpstarts:
            try:
                date_added = datetime.strptime(j['date_added'], "%m/%d/%Y")
                j['is_new'] = date_added >= new_threshold
            except (ValueError, KeyError):
                j['is_new'] = False
        
        return jumpstarts
    
    def sort_jumpstarts(
        self, 
        jumpstarts: List[Dict], 
        new_first: bool = True
    ) -> List[Dict]:
        """Sort jumpstarts by newness, then ID.
        
        Args:
            jumpstarts: List of jumpstarts to sort
            new_first: If True, put new items first
            
        Returns:
            Sorted list of jumpstarts
        """
        return sorted(
            jumpstarts,
            key=lambda x: (
                not x.get('is_new', False) if new_first else x.get('is_new', False),
                x.get('id', 0),
                x.get('logical_id', '')
            )
        )
    
    def group_by_scenario(self, jumpstarts: List[Dict]) -> Dict[str, List[Dict]]:
        """Group jumpstarts by their scenario tags.
        
        Args:
            jumpstarts: List of jumpstarts to group
            
        Returns:
            Dictionary mapping scenario tags to lists of jumpstarts
        """
        grouped = {}
        for j in jumpstarts:
            scenario_tags = j.get("scenario_tags", ["Uncategorized"])
            for tag in scenario_tags:
                if tag not in grouped:
                    grouped[tag] = []
                grouped[tag].append(j)
        return grouped
    
    def group_by_workload(self, jumpstarts: List[Dict]) -> Dict[str, List[Dict]]:
        """Group jumpstarts by their workload tags.
        
        Args:
            jumpstarts: List of jumpstarts to group
            
        Returns:
            Dictionary mapping workload tags to lists of jumpstarts
        """
        grouped = {}
        for j in jumpstarts:
            workload_tags = j.get("workload_tags", ["Uncategorized"])
            for tag in workload_tags:
                if tag not in grouped:
                    grouped[tag] = []
                grouped[tag].append(j)
        return grouped
    
    def group_by_type(self, jumpstarts: List[Dict]) -> Dict[str, List[Dict]]:
        """Group jumpstarts by their type.
        
        Args:
            jumpstarts: List of jumpstarts to group
            
        Returns:
            Dictionary mapping types to lists of jumpstarts
        """
        grouped = {}
        for j in jumpstarts:
            type_tag = j.get("type") or "Unspecified"
            grouped.setdefault(type_tag, []).append(j)
        return grouped
