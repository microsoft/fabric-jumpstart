import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import yaml
from fabric_cicd import FabricWorkspace, append_feature_flag, publish_all_items

from .constants import ITEM_URL_ROUTING_PATH_MAP
from .response import render_install_status_html
from .ui import render_jumpstart_list
from .utils import _is_fabric_runtime, clone_repository

logger = logging.getLogger(__name__)

class jumpstart:
    def __init__(self):
        self._registry = self._load_registry()

    def _load_registry(self):
        """Load jumpstart registry from YAML file."""
        registry_path = Path(__file__).parent / "registry.yml"
        with open(registry_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        return data.get('jumpstarts', [])

    def _list(self):
        """Display all available jumpstarts."""
        print("Available jumpstarts:")
        for j in self._registry:
            if j.get('include_in_listing', True):
                print(f"  • {j['id']}: {j.get('name', 'Unknown')} - {j.get('description', 'No description')}")

    def list(self):
        """Display an interactive HTML UI of available jumpstarts."""
        from IPython.display import HTML, display
        
        # Get the instance variable name dynamically
        instance_name = self._get_instance_name()
        
        # Filter jumpstarts that should be listed
        jumpstarts = [j for j in self._registry if j.get('include_in_listing', True)]
        
        # Determine NEW threshold (60 days ago)
        new_threshold = datetime.now() - timedelta(days=60)
        
        # Mark and sort jumpstarts
        for j in jumpstarts:
            try:
                date_added = datetime.strptime(j['date_added'], "%m/%d/%Y")
                j['is_new'] = date_added >= new_threshold
            except (ValueError, KeyError):
                j['is_new'] = False
        
        # Sort: NEW first, then alphabetical by id
        jumpstarts.sort(key=lambda x: (not x['is_new'], x['id']))
        
        # Group by scenario, workload, and type
        grouped_scenario = {}
        grouped_workload = {}
        grouped_type = {}
        
        for j in jumpstarts:
            # Group by scenario
            scenario_tags = j.get("scenario_tags", ["Uncategorized"])
            for tag in scenario_tags:
                if tag not in grouped_scenario:
                    grouped_scenario[tag] = []
                grouped_scenario[tag].append(j)
            
            # Group by workload
            workload_tags = j.get("workload_tags", ["Uncategorized"])
            for tag in workload_tags:
                if tag not in grouped_workload:
                    grouped_workload[tag] = []
                grouped_workload[tag].append(j)

            type_tag = j.get("type") or "Unspecified"
            grouped_type.setdefault(type_tag, []).append(j)
        
        # Generate and display HTML
        html = render_jumpstart_list(grouped_scenario, grouped_workload, grouped_type, instance_name)
        display(HTML(html))
    
    def _get_instance_name(self):
        """Get the variable name of this jumpstart instance."""
        import inspect
        import re
        # Get the frame where list() was called
        frame = inspect.currentframe().f_back.f_back
        
        # Get all variables pointing to this instance
        candidates = []
        for scope in [frame.f_locals, frame.f_globals]:
            for var_name, var_value in scope.items():
                if var_value is self and not var_name.startswith('_'):
                    candidates.append(var_name)
        
        logger.debug(f"Found candidate names: {candidates}")
        
        if not candidates:
            logger.debug("No candidates found, using default 'jumpstart'")
            return "jumpstart"
        
        # Parse the calling line to see which variable was used
        try:
            import linecache
            call_line = frame.f_lineno
            filename = frame.f_code.co_filename
            line = linecache.getline(filename, call_line).strip()
            
            logger.debug(f"Parsing line: {line}")
            
            # Look for pattern: variable_name.list()
            method_pattern = r'(\w+)\.list\s*\('
            match = re.search(method_pattern, line)
            
            if match:
                calling_var = match.group(1)
                logger.debug(f"Found calling variable: {calling_var}")
                if calling_var in candidates:
                    logger.debug(f"Using matched variable name: {calling_var}")
                    return calling_var
                    
        except Exception as e:
            logger.debug(f"Error parsing calling line: {e}")
        
        # Fallback to shortest name
        shortest = min(candidates, key=len)
        logger.debug(f"Using shortest candidate: {shortest}")
        return shortest

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
        unattended = kwargs.get('unattended', False)
        try:
            logger.info(f"Deploying items from {workspace_path} to workspace '{workspace_id}'")
            target_ws = self._install_items(
                items_in_scope=items_in_scope,
                workspace_path=workspace_path,
                workspace_id=workspace_id,
                feature_flags=kwargs.get('feature_flags', [])
            )
            logger.info(f"Successfully installed '{name}'")

            entry_point = config.get('entry_point')
            entry_url = None
            if entry_point:
                if entry_point.startswith(('http://', 'https://')):
                    entry_url = entry_point
                else:
                    from fabric_cicd._parameter._utils import _extract_item_attribute
                    parts = entry_point.split('.')
                    if len(parts) >= 2:
                        item_name, item_type = parts[0], parts[1]
                        item_id = _extract_item_attribute(target_ws, f"$items.{item_type}.{item_name}.$id", False)

                        routing_path = ITEM_URL_ROUTING_PATH_MAP.get(item_type)
                        if not routing_path:
                            raise ValueError(f"Unsupported entry point item type: {item_type}")
                        entry_url = f"https://app.powerbi.com/groups/{target_ws.workspace_id}/{routing_path}/{item_id}?experience=fabric-developer"


            status_html = render_install_status_html(
                status='success',
                jumpstart_name=config.get('name', name),
                workspace_id=workspace_id,
                entry_point=entry_url,
                minutes_complete=config.get('minutes_to_complete_jumpstart'),
                minutes_deploy=config.get('minutes_to_deploy'),
                docs_uri=config.get('jumpstart_docs_uri'),
            )

            if unattended:
                print(f"Installed '{name}' to workspace '{workspace_id}'")
                return None

            try:
                from IPython.display import HTML
                return HTML(status_html)
            except Exception:
                return status_html
        except Exception as e:
            logger.error(f"Failed to install jumpstart '{name}': {e}")
            if unattended:
                print(f"Failed to install '{name}': {e}")
                raise

            status_html = render_install_status_html(
                status='error',
                jumpstart_name=config.get('name', name),
                workspace_id=workspace_id,
                entry_point=config.get('entry_point'),
                minutes_complete=config.get('minutes_to_complete_jumpstart'),
                minutes_deploy=config.get('minutes_to_deploy'),
                docs_uri=config.get('jumpstart_docs_uri'),
                error_message=str(e),
            )
            try:
                from IPython.display import HTML
                return HTML(status_html)
            except Exception:
                return status_html


    def _install_items(self, items_in_scope, workspace_path, workspace_id, feature_flags):
        for flag in feature_flags:
            append_feature_flag(flag)

        target_ws = FabricWorkspace(
            workspace_id=workspace_id,
            repository_directory=str(workspace_path),
            item_type_in_scope=items_in_scope
        )
        publish_all_items(target_ws)

        return target_ws
