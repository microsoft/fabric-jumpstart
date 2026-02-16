"""Jumpstart registry management for loading and querying available jumpstarts."""

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import yaml

logger = logging.getLogger(__name__)


class JumpstartRegistry:
    """Manages the jumpstart registry and provides query operations.
    
    The registry is loaded from individual YAML files organized in core/
    and community/ subdirectories.
    """
    
    def __init__(self, registry_path: Optional[Path] = None):
        """Initialize the registry.
        
        Args:
            registry_path: Path to jumpstarts directory containing core/ and community/.
                          If None, uses default location: jumpstarts/
        """
        if registry_path is None:
            registry_path = Path(__file__).parent / "jumpstarts"
        self._registry_path = registry_path
        self._jumpstarts: Optional[List[Dict]] = None
    
    def load(self) -> List[Dict]:
        """Load the jumpstart registry from directory structure.
        
        Scans core/ and community/ subdirectories and adds the 'core' flag
        based on folder location.
        
        Returns:
            List of jumpstart configuration dictionaries
            
        Raises:
            FileNotFoundError: If jumpstarts directory doesn't exist
            yaml.YAMLError: If any YAML file is invalid
        """
        if self._jumpstarts is None:
            logger.debug(f"Loading jumpstart registry from {self._registry_path}")
            
            if not self._registry_path.is_dir():
                raise FileNotFoundError(
                    f"Jumpstarts directory not found at {self._registry_path}"
                )
            
            self._jumpstarts = self._load_from_directory(self._registry_path)
            logger.info(f"Loaded {len(self._jumpstarts)} jumpstarts from registry")
            
        return self._jumpstarts
    
    def _load_from_directory(self, jumpstarts_dir: Path) -> List[Dict]:
        """Load jumpstarts from directory structure with core/community folders.
        
        Args:
            jumpstarts_dir: Path to jumpstarts directory containing core/ and community/
            
        Returns:
            List of jumpstart configuration dictionaries with 'core' flag added
        """
        jumpstarts = []
        
        # Load from core folder
        core_dir = jumpstarts_dir / "core"
        if core_dir.is_dir():
            for yml_file in sorted(core_dir.glob("*.yml")):
                with open(yml_file, 'r', encoding='utf-8') as f:
                    jumpstart = yaml.safe_load(f)
                    if jumpstart:
                        jumpstart['core'] = True
                        jumpstarts.append(jumpstart)
                        logger.debug(f"Loaded core jumpstart: {yml_file.name}")
        
        # Load from community folder
        community_dir = jumpstarts_dir / "community"
        if community_dir.is_dir():
            for yml_file in sorted(community_dir.glob("*.yml")):
                with open(yml_file, 'r', encoding='utf-8') as f:
                    jumpstart = yaml.safe_load(f)
                    if jumpstart:
                        jumpstart['core'] = False
                        jumpstarts.append(jumpstart)
                        logger.debug(f"Loaded community jumpstart: {yml_file.name}")
        
        return jumpstarts
    
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
