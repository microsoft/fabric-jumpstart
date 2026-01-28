import contextlib
import logging
import re
import traceback
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import yaml
from fabric_cicd import FabricWorkspace, append_feature_flag, publish_all_items

from .constants import ITEM_URL_ROUTING_PATH_MAP
from .response import render_install_status_html
from .ui import render_jumpstart_list
from .utils import (
    _apply_item_prefix,
    _is_fabric_runtime,
    _set_item_prefix,
    clone_files_to_temp_directory,
    clone_repository,
)

logger = logging.getLogger(__name__)

_ANSI_RE = re.compile(r"\x1B[@-Z\\-_]|\x1B\[[0-?]*[ -/]*[@-~]")


def _strip_ansi(text: str) -> str:
    """Remove ANSI escape codes from a string."""
    return _ANSI_RE.sub('', text or '')


def _should_filter_log(message: str) -> bool:
    """Filter out noisy log lines we do not want to render."""
    cleaned = _strip_ansi(str(message))
    return cleaned.lstrip().startswith("#####")


class _BufferingHandler(logging.Handler):
    """Collect INFO+ log records for rendering in HTML."""

    def __init__(self, sink, on_emit=None):
        super().__init__(level=logging.INFO)
        self.sink = sink
        self.on_emit = on_emit

    def emit(self, record):
        try:
            if record.levelno >= logging.INFO:
                msg = record.getMessage()
                if _should_filter_log(msg):
                    return
                self.sink.append({
                    "level": record.levelname,
                    "message": msg,
                })
                if record.exc_info:
                    exc_text = logging.Formatter().formatException(record.exc_info)
                    for line in exc_text.splitlines():
                        if not line:
                            continue
                        self.sink.append({
                            "level": record.levelname,
                            "message": line,
                        })
                if self.on_emit:
                    self.on_emit()
        except Exception:
            # Swallow logging issues to avoid breaking install flow
            pass


class _StreamToLogs:
    """Capture stdout/stderr writes and feed them into log buffer."""

    def __init__(self, sink, on_emit=None, level="INFO"):
        self.sink = sink
        self.on_emit = on_emit
        self.level = level
        self._buf = ""

    def write(self, s):
        if not s:
            return 0
        self._buf += s
        lines = self._buf.splitlines(keepends=True)
        self._buf = '' if (lines and not lines[-1].endswith('\n')) else ''
        if lines and not lines[-1].endswith('\n'):
            self._buf = lines.pop()
        for line in lines:
            msg = line.rstrip('\n')
            if msg:
                if _should_filter_log(msg):
                    continue
                self.sink.append({"level": self.level, "message": msg})
                if self.on_emit:
                    self.on_emit()
        return len(s)

    def flush(self):
        if self._buf:
            msg = self._buf
            if _should_filter_log(msg):
                self._buf = ""
                return
            self.sink.append({"level": self.level, "message": msg})
            if self.on_emit:
                self.on_emit()
            self._buf = ""

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
        # Choose the frame that holds user scope:
        # - If invoked via list(), go two frames up (user -> list -> _get_instance_name)
        # - If invoked directly, go one frame up (user -> _get_instance_name)
        current = inspect.currentframe()
        caller = current.f_back if current else None
        frame = caller.f_back if caller and caller.f_code.co_name == "list" else caller

        # Collect direct references to the instance and module aliases that expose it
        instance_names = set()
        module_aliases = set()
        if frame:
            for scope in [frame.f_locals, frame.f_globals]:
                for var_name, var_value in scope.items():
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

        # Parse the calling line to see which name was used
        try:
            import linecache
            if frame and frame.f_code:
                call_line = frame.f_lineno
                filename = frame.f_code.co_filename
                line = linecache.getline(filename, call_line).strip()

                logger.debug(f"Parsing line: {line}")

                patterns = [
                    r'(\w+)\.list\s*\(',
                    r'(\w+)\._get_instance_name\s*\(',
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
        return next(
            (
                item
                for item in self._registry
                if item.get('logical_id') == jumpstart_id
                or str(item.get('id')) == str(jumpstart_id)
            ),
            None,
        )

    def install(self, name: str, workspace_id: Optional[str] = None, **kwargs):
        """
        Install a jumpstart to a Fabric workspace.

        Args:
            name: Logical id of the jumpstart from registry
            workspace_id: Target workspace GUID (optional)
            **kwargs: Additional options (overrides registry defaults)
                - unattended: If True, suppresses live HTML output and prints to console instead
                - item_prefix: Custom prefix for created items, set as None for no prefix, defaults to auto-generated
                - debug: If True, include all jumpstart logs (INFO+) in the rendered output; otherwise only fabric-cicd logs
        """

        # Configure item prefix
        user_item_prefix = kwargs.get('item_prefix', 'auto')
        item_prefix = user_item_prefix
        if user_item_prefix == 'auto':
            config = self._get_jumpstart_by_logical_id(name)
            id = config.get('id')
            logical_id = config.get('logical_id', '')
            item_prefix = _set_item_prefix(id, logical_id)

        config['item_prefix'] = item_prefix

        entry_point = config.get('entry_point')
        prefixed_entry_point = entry_point
        if entry_point and not entry_point.startswith(('http://', 'https://')) and item_prefix is not None:
            prefixed_entry_point = f"{item_prefix}{entry_point}"

        if workspace_id is None and _is_fabric_runtime():
            import notebookutils  # ty: ignore[unresolved-import]
            workspace_id = notebookutils.runtime.context['currentWorkspaceId']

        config = self._get_jumpstart_by_logical_id(name)
        if not config:
            error_msg = f"Unknown jumpstart '{name}'. Use fabric_jumpstart.list() to list available jumpstarts."
            raise ValueError(error_msg)

        logger.info(f"Installing '{name}' to workspace '{workspace_id}'")

        source_config = config['source']
        workspace_path = source_config['workspace_path']

        if 'repo_url' in source_config:
            # Remote jumpstart
            repo_url = source_config['repo_url']
            repo_ref = source_config.get('repo_ref', 'main')

            logger.info(f"Cloning from {repo_url} (ref: {repo_ref})")
            working_repo_path = clone_repository(repository_url=repo_url, ref=repo_ref, temp_dir_prefix=item_prefix)

            logger.info(f"Repository cloned to {working_repo_path}")
        else:
            # Local jumpstart
            logger.info("Using local demo handler")
            jumpstarts_dir = Path(__file__).parent / "jumpstarts"
            logger.info(f"Using local jumpstart_dir {jumpstarts_dir}")
            repo_path = jumpstarts_dir / config.get('logical_id', name)
            working_repo_path = clone_files_to_temp_directory(source_path=repo_path, temp_dir_prefix=item_prefix)
            logger.info(f"Cloned local repo_path {repo_path} to temp {working_repo_path}")

        temp_workspace_path = working_repo_path / workspace_path.lstrip('/\\')
        items_in_scope = config.get('items_in_scope', [])
        unattended = kwargs.get('unattended', False)

        log_buffer = []
        live_handle = None
        HTML_cls = None
        live_rendering = False

        def _update_live(status_label='installing', entry=None, err=None):
            if not live_handle or HTML_cls is None:
                return
            html = render_install_status_html(
                status=status_label,
                jumpstart_name=config.get('name', name),
                type=config.get('type').lower(),
                workspace_id=workspace_id,
                entry_point=entry,
                minutes_complete=config.get('minutes_to_complete_jumpstart'),
                minutes_deploy=config.get('minutes_to_deploy'),
                docs_uri=config.get('jumpstart_docs_uri'),
                logs=log_buffer,
                error_message=err,
            )
            try:
                live_handle.update(HTML_cls(html))
            except Exception:
                pass

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

        handler = _BufferingHandler(log_buffer, on_emit=lambda: _update_live(status_label='installing', entry=None))
        stdout_proxy = _StreamToLogs(log_buffer, on_emit=lambda: _update_live(status_label='installing', entry=None), level="INFO")
        stderr_proxy = _StreamToLogs(log_buffer, on_emit=lambda: _update_live(status_label='installing', entry=None), level="ERROR")
        debug_logs = bool(kwargs.get('debug', False))

        fabric_logger = logging.getLogger('fabric_cicd')
        module_logger = logging.getLogger(__name__)
        utils_root_logger = logging.getLogger('fabric_jumpstart')
        utils_logger = logging.getLogger('fabric_jumpstart.utils')

        # Always capture fabric + jumpstart logs; debug flag toggles verbosity.
        targets = [fabric_logger, module_logger, utils_root_logger, utils_logger]

        original_states = []
        for tgt in targets:
            original_states.append((tgt, list(tgt.handlers), tgt.propagate, tgt.level))
            tgt.handlers = [handler]
            tgt.propagate = False
            tgt.setLevel(logging.DEBUG if debug_logs else logging.INFO)

        logger.info(f"Workspace path {temp_workspace_path}")
        entry_point = config.get('entry_point')
        base_names = []
        if entry_point and isinstance(entry_point, str) and '.' in entry_point:
            base_names.append(entry_point.split('.')[0])
        logger.info(
            "Applying item prefix '%s' to workspace path %s with base_names=%s",
            item_prefix,
            temp_workspace_path,
            base_names,
        )
        prefix_mappings = _apply_item_prefix(temp_workspace_path, item_prefix, base_names=base_names)
        logger.info("Item prefix mappings applied: %s", prefix_mappings)
        try:
            with contextlib.redirect_stdout(stdout_proxy), contextlib.redirect_stderr(stderr_proxy):
                logger.info(f"Deploying items from {temp_workspace_path} to workspace '{workspace_id}'")
                target_ws = self._install_items(
                    items_in_scope=items_in_scope,
                    workspace_path=temp_workspace_path,
                    workspace_id=workspace_id,
                    feature_flags=kwargs.get('feature_flags', [])
                )
            logger.info(f"Successfully installed '{name}'")

            entry_point = prefixed_entry_point or config.get('entry_point')
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
                type=config.get('type').lower(),
                workspace_id=workspace_id,
                entry_point=entry_url,
                minutes_complete=config.get('minutes_to_complete_jumpstart'),
                minutes_deploy=config.get('minutes_to_deploy'),
                docs_uri=config.get('jumpstart_docs_uri'),
                logs=log_buffer,
            )

            _update_live(status_label='success', entry=entry_url)

            if unattended:
                print(f"Installed '{name}' to workspace '{workspace_id}'")
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

            try:
                for line in traceback.format_exception(e):
                    clean_line = line.rstrip("\n")
                    if clean_line:
                        log_buffer.append({"level": "ERROR", "message": clean_line})
                _update_live(status_label='error', entry=config.get('entry_point'), err=error_text)
            except Exception:
                pass

            if unattended:
                print(f"Failed to install '{name}': {error_text}")
                raise

            status_html = render_install_status_html(
                status='error',
                jumpstart_name=config.get('name', name),
                type=config.get('type').lower(),
                workspace_id=workspace_id,
                entry_point=prefixed_entry_point,
                minutes_complete=config.get('minutes_to_complete_jumpstart'),
                minutes_deploy=config.get('minutes_to_deploy'),
                docs_uri=config.get('jumpstart_docs_uri'),
                logs=log_buffer,
                error_message=error_text,
            )
            _update_live(status_label='error', entry=prefixed_entry_point, err=error_text)
            if live_rendering:
                return None
            try:
                from IPython.display import HTML
                return HTML(status_html)
            except Exception:
                return status_html
        finally:
            for tgt, handlers, propagate, level in original_states:
                tgt.handlers = handlers
                tgt.propagate = propagate
                tgt.setLevel(level)


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
