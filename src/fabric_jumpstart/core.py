"""Core jumpstart class for listing and installing jumpstarts."""

import logging
import traceback
from datetime import datetime, timedelta
from typing import Optional

from .installer import JumpstartInstaller
from .logger import log_capture_context
from .registry import JumpstartRegistry
from .ui import ConflictUI, render_install_status_html, render_jumpstart_list

logger = logging.getLogger(__name__)

class jumpstart:
    """Main jumpstart interface for discovering and installing jumpstarts."""
    
    def __init__(self):
        """Initialize jumpstart with registry."""
        self._registry_manager = JumpstartRegistry()
        self._registry = self._registry_manager.load()

    def _load_registry(self):
        """Load jumpstart registry from YAML file (backward compatibility)."""
        return self._registry_manager.load()

    def _list(self):
        """Display all available jumpstarts."""
        print("Available jumpstarts:")
        for j in self._registry:
            if j.get('include_in_listing', True):
                logical_id = j.get('logical_id', j.get('id', 'unknown'))
                numeric_id = j.get('id', '?')
                print(f"  • {logical_id} (#{numeric_id}): {j.get('name', 'Unknown')} - {j.get('description', 'No description')}")

    def list(self, **kwargs):
        """Display an interactive HTML UI of available jumpstarts."""
        from IPython.display import HTML, display
        
        # Get the instance variable name dynamically
        instance_name = self._get_instance_name()
        
        # Filter jumpstarts that should be listed
        show_unlisted = kwargs.get("show_unlisted", False)
        jumpstarts = [j for j in self._registry if j.get("include_in_listing", True) or show_unlisted]
        
        # Determine NEW threshold (60 days ago)
        new_threshold = datetime.now() - timedelta(days=60)
        
        # Mark and sort jumpstarts
        for j in jumpstarts:
            try:
                date_added = datetime.strptime(j['date_added'], "%m/%d/%Y")
                j['is_new'] = date_added >= new_threshold
            except (ValueError, KeyError):
                j['is_new'] = False
        
        # Sort: NEW first, then numeric id, then logical_id for stability
        jumpstarts.sort(key=lambda x: (not x['is_new'], x.get('id', 0), x.get('logical_id', '')))
        
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
        current = inspect.currentframe()
        caller = current.f_back if current else None

        # Prefer the user frame first (caller of the public API), then the immediate caller.
        frames = []
        if caller and caller.f_back:
            frames.append(caller.f_back)
        if caller:
            frames.append(caller)

        # Collect direct references to the instance and module aliases that expose it
        instance_names = set()
        module_aliases = set()
        for frame in frames:
            if not frame:
                continue
            for scope in [frame.f_locals, frame.f_globals]:
                for var_name, var_value in scope.items():
                    if var_name == "self":
                        continue
                    if var_value is self and not var_name.startswith('_'):
                        instance_names.add(var_name)
                    # Handle "import fabric_jumpstart as js" where js.jumpstart is the instance
                    try:
                        if inspect.ismodule(var_value) and getattr(var_value, "jumpstart", None) is self:
                            module_aliases.add(var_name)
                    except Exception:
                        # Best-effort alias detection; ignore inspection issues
                        pass

        logger.debug(f"Found instance names: {instance_names}; module aliases: {module_aliases}")

        # Parse the calling line to see which name was used (favor outer frames first)
        try:
            import linecache
            for frame in frames:
                if not frame or not frame.f_code:
                    continue
                call_line = frame.f_lineno
                filename = frame.f_code.co_filename
                line = linecache.getline(filename, call_line).strip()

                logger.debug(f"Parsing line: {line}")

                patterns = [
                    r'(\w+)\.list\s*\(',
                    r'(\w+)\._get_instance_name\s*\(',
                    r'(\w+)\.install\s*\(',
                ]

                for pattern in patterns:
                    match = re.search(pattern, line)
                    if match:
                        calling_var = match.group(1)
                        logger.debug(f"Found calling variable: {calling_var}")
                        if calling_var in instance_names or calling_var in module_aliases:
                            logger.debug(f"Using matched variable name: {calling_var}")
                            return calling_var

        except Exception as e:
            logger.debug(f"Error parsing calling line: {e}")

        # Prefer explicit references, then module aliases, then default
        if instance_names:
            shortest = min(instance_names, key=len)
            logger.debug(f"Using shortest instance name: {shortest}")
            return shortest
        if module_aliases:
            shortest = min(module_aliases, key=len)
            logger.debug(f"Using shortest module alias: {shortest}")
            return shortest

        logger.debug("No candidates found, using default 'jumpstart'")
        return "jumpstart"

    def _get_jumpstart_by_logical_id(self, jumpstart_id: str):
        """Get jumpstart config by logical_id, with backward compatibility for old id lookups."""
        return self._registry_manager.get_by_id(jumpstart_id)

    def install(self, name: str, workspace_id: Optional[str] = None, **kwargs):
        """
        Install a jumpstart to a Fabric workspace.

        Args:
            name: Logical id of the jumpstart from registry
            workspace_id: Target workspace GUID (optional)
            **kwargs: Additional options (overrides registry defaults)
                - unattended: If True, suppresses live HTML output and prints to console instead
                - item_prefix: Custom prefix for created items, set as None for no prefix
                - overwrite: If True, overwrite conflicting items
                - auto_prefix_on_conflict: If True, auto-generate a prefix when conflicts are detected
                - debug: If True, include all jumpstart logs (INFO+) in the rendered output; otherwise only fabric-cicd logs
        """
        config = self._get_jumpstart_by_logical_id(name)
        if not config:
            error_msg = f"Unknown jumpstart '{name}'. Use fabric_jumpstart.list() to list available jumpstarts."
            raise ValueError(error_msg)

        instance_name = self._get_instance_name()
        installer = JumpstartInstaller(config, workspace_id, instance_name, **kwargs)
        
        # Setup state for rendering
        unattended = installer.unattended
        log_buffer = installer.log_buffer
        live_handle = None
        HTML_cls = None
        live_rendering = False
        conflict_already_rendered = False

        def _update_live(status_label='installing', entry=None, err=None, extra_html=None):
            """Update live display with current status."""
            if not live_handle or HTML_cls is None:
                return
            html = render_install_status_html(
                status=status_label,
                jumpstart_name=config.get('name', name),
                type=config.get('type', '').lower(),
                workspace_id=installer.workspace_id,
                entry_point=entry,
                minutes_complete=config.get('minutes_to_complete_jumpstart'),
                minutes_deploy=config.get('minutes_to_deploy'),
                docs_uri=config.get('jumpstart_docs_uri'),
                logs=log_buffer,
                error_message=err,
                extra_html=extra_html,
            )
            try:
                live_handle.update(HTML_cls(html))
            except Exception:
                # Don't log here as it can cause infinite loop with on_emit callback
                pass

        # Initialize live rendering if not in unattended mode
        try:
            if not unattended:
                from IPython.display import HTML as _HTML
                from IPython.display import display
                HTML_cls = _HTML
                live_handle = display(_HTML("<div>Starting install...</div>"), display_id=True)
                live_rendering = True
                _update_live(status_label='installing')
        except Exception:
            live_handle = None
            HTML_cls = None
            live_rendering = False

        # Setup log capture
        current_status = {'label': 'installing', 'entry': None}  # Track current status
        
        def on_emit():
            # Only update if still in installing state (don't overwrite error/conflict/success)
            if current_status['label'] == 'installing':
                _update_live(status_label='installing', entry=None)
        
        # Capture logs from fabric-cicd and fabric_jumpstart
        target_loggers = [
            logging.getLogger('fabric_cicd'),
            logging.getLogger('fabric_jumpstart'),
            logging.getLogger(__name__),
        ]
        
        with log_capture_context(log_buffer, target_loggers, on_emit=on_emit, debug=installer.debug_logs):
            try:
                # Phase 1: Validate and prepare
                installer.validate()
                installer.prepare_workspace()
                installer.initialize_workspace_manager()
                
                # Phase 2: Check for conflicts
                planned_items_base, existing_items, conflicts, had_conflicts = installer.check_conflicts()
                
                # Phase 3: Resolve conflicts
                resolved_prefix, remaining_conflicts = installer.resolve_conflicts(
                    planned_items_base,
                    existing_items,
                    conflicts
                )
                
                # If conflicts remain unresolved, render UI and fail
                if remaining_conflicts:
                    conflict_html = ConflictUI.render_conflict_html(
                        remaining_conflicts,
                        instance_name,
                        name,
                        installer.workspace_id
                    )
                    
                    if unattended:
                        raise RuntimeError(f"Conflicting items detected: {', '.join(remaining_conflicts)}")
                    
                    # Update live display with conflict UI
                    current_status['label'] = 'conflict'  # Prevent on_emit from overwriting
                    _update_live(
                        status_label='conflict',
                        entry=config.get('entry_point'),
                        err=None,
                        extra_html=conflict_html
                    )
                    conflict_already_rendered = True
                    
                    # Raise error to mark cell as failed
                    raise RuntimeError(f"Conflicting items detected: {', '.join(remaining_conflicts)}")
                
                # Phase 4: Apply prefix to files
                installer.apply_prefix_to_files(resolved_prefix)
                
                # Phase 5: Deploy
                logger.info(f"Deploying items from {installer.temp_workspace_path} to workspace '{installer.workspace_id}'")
                target_ws = installer.deploy()
                logger.info(f"Successfully installed '{name}'")
                
                # Phase 6: Generate entry URL
                entry_url = installer.generate_entry_url(target_ws, resolved_prefix)
                
                # Render success
                current_status['label'] = 'success'  # Prevent on_emit from overwriting
                status_html = render_install_status_html(
                    status='success',
                    jumpstart_name=config.get('name', name),
                    type=config.get('type', '').lower(),
                    workspace_id=installer.workspace_id,
                    entry_point=entry_url,
                    minutes_complete=config.get('minutes_to_complete_jumpstart'),
                    minutes_deploy=config.get('minutes_to_deploy'),
                    docs_uri=config.get('jumpstart_docs_uri'),
                    logs=log_buffer,
                )
                
                _update_live(status_label='success', entry=entry_url)
                
                if unattended:
                    print(f"Installed '{name}' to workspace '{installer.workspace_id}'")
                    return None
                
                if live_rendering:
                    return None
                
                try:
                    from IPython.display import HTML
                    return HTML(status_html)
                except Exception:
                    return status_html
                    
            except Exception as e:
                logger.exception(f"Failed to install jumpstart '{name}'")
                error_text = str(e).strip() or e.__class__.__name__
                
                # Don't overwrite conflict UI if it's already been rendered
                if conflict_already_rendered:
                    raise RuntimeError(error_text)
                
                try:
                    for line in traceback.format_exception(e):
                        clean_line = line.rstrip("\n")
                        if clean_line:
                            log_buffer.append({"level": "ERROR", "message": clean_line})
                    _update_live(
                        status_label='error',
                        entry=config.get('entry_point'),
                        err=error_text
                    )
                except Exception:
                    pass
                
                if unattended:
                    print(f"Failed to install '{name}': {error_text}")
                    raise
                
                status_html = render_install_status_html(
                    status='error',
                    jumpstart_name=config.get('name', name),
                    type=config.get('type', '').lower(),
                    workspace_id=installer.workspace_id,
                    entry_point=config.get('entry_point'),
                    minutes_complete=config.get('minutes_to_complete_jumpstart'),
                    minutes_deploy=config.get('minutes_to_deploy'),
                    docs_uri=config.get('jumpstart_docs_uri'),
                    logs=log_buffer,
                    error_message=error_text,
                )
                _update_live(status_label='error', entry=config.get('entry_point'), err=error_text)
                
                if live_rendering:
                    raise RuntimeError(error_text)
                
                try:
                    from IPython.display import HTML, display
                    display(HTML(status_html))
                except Exception:
                    pass
                
                raise RuntimeError(error_text)
