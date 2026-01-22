"""Render install responses for Fabric Jumpstart."""

import html
from pathlib import Path
from typing import Optional

_response_css_path = Path(__file__).parent / "response.css"
try:
    _INSTALL_STATUS_CSS = f"<style>{_response_css_path.read_text(encoding='utf-8')}</style>"
except FileNotFoundError:
    _INSTALL_STATUS_CSS = ''


def _format_minutes(minutes):
    """Return a human-friendly minutes label or 'Unspecified'."""
    if minutes in (None, ''):
        return 'Unspecified'
    try:
        return f"{int(minutes)} min."
    except (TypeError, ValueError):
        return html.escape(str(minutes), quote=True)


def render_install_status_html(*, status: str, jumpstart_name: str, workspace_id: Optional[str], entry_point, minutes_complete, minutes_deploy, docs_uri=None, logs=None, error_message: Optional[str] = None):
    """Build a styled HTML status card for install results."""
    status_lower = status.lower()
    pill_class = 'success' if status_lower == 'success' else 'error'
    pill_label = 'Installed' if status_lower == 'success' else 'Failed'
    pill_icon = '✓' if status_lower == 'success' else '✕'

    if status_lower not in ('success', 'error', 'failed'):
        pill_class = 'info'
        pill_label = status.capitalize()
        pill_icon = '⏳'

    safe_name = html.escape(jumpstart_name or 'Jumpstart', quote=True)
    workspace_text = workspace_id or 'Current workspace'
    safe_workspace = html.escape(str(workspace_text), quote=True)

    top_items = []
    if docs_uri:
        docs_str = str(docs_uri)
        if docs_str.startswith(('http://', 'https://')):
            safe_docs = html.escape(docs_str, quote=True)
            docs_markup = (
                f'<a class="install-status-link" href="{safe_docs}" target="_blank" rel="noopener noreferrer">'
                f'<span>Jumpstart documentation</span>'
                f'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Zm5 14v2H5V5h2v12h12Z"/></svg>'
                f'</a>'
            )
        else:
            docs_markup = f'<code>{html.escape(docs_str, quote=True)}</code>'
        top_items.append(
            f'<div class="install-status-item"><div class="install-status-label">Jumpstart documentation</div><div class="install-status-value">{docs_markup}</div></div>'
        )

    # Top row also shows deploy estimate
    minutes_deploy_label = _format_minutes(minutes_deploy)
    top_items.append(
        f'<div class="install-status-item"><div class="install-status-label">📦 Est. time to install</div><div class="install-status-value">{minutes_deploy_label}</div></div>'
    )


    minutes_complete_label = _format_minutes(minutes_complete)

    error_block = ''
    if status_lower != 'success' and error_message:
        error_block = f'<div class="install-status-error" aria-label="Error details">{html.escape(str(error_message), quote=True)}</div>'

    log_rows = ''
    if logs:
        rows = []
        for record in logs:
            level = (record.get('level') or '').lower()
            msg = record.get('message', '')
            if not msg:
                continue
            level_class = 'info'
            if level == 'warning' or level == 'warn':
                level_class = 'warning'
            elif level == 'error':
                level_class = 'error'
            rows.append(
                f'<div class="install-log-row">'
                f'<span class="install-log-badge {level_class}">{html.escape(record.get("level", "INFO"), quote=True)}</span>'
                f'<span class="install-log-message">{html.escape(str(msg), quote=True)}</span>'
                f'</div>'
            )
        if rows:
            log_rows = ''.join(rows)

    logs_block = ''
    if log_rows:
        logs_block = ''.join([
            '<div class="install-status-logs">',
            '<details id="install-logs">',
            '<summary>Logs</summary>',
            log_rows,
            '</details>',
            '<script>(function(){const k="__fabricJumpstartLogsOpen";const el=document.getElementById("install-logs");if(!el){return;}if(window[k]){el.open=true;}el.addEventListener("toggle",()=>{window[k]=el.open;});})();</script>',
            '</div>',
        ])

    entry_section = ''
    if status_lower == 'success' and entry_point:
        entry_str = str(entry_point)
        if entry_str.startswith(('http://', 'https://')):
            safe_url = html.escape(entry_str, quote=True)
            entry_markup = (
                f'<a class="install-status-link" href="{safe_url}" target="_blank" rel="noopener noreferrer">'
                f'<span>Open entry point</span>'
                f'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Zm5 14v2H5V5h2v12h12Z"/></svg>'
                f'</a>'
            )
        else:
            entry_markup = f'<code>{html.escape(entry_str, quote=True)}</code>'

        entry_section = ''.join([
            '<div class="install-status-section">',
            '<div class="install-status-section-title">Output</div>',
            '<div class="install-status-grid tight">',
            f'  <div class="install-status-item"><div class="install-status-label">Entry point</div><div class="install-status-value">{entry_markup}</div></div>',
            f'  <div class="install-status-item"><div class="install-status-label">⏱️ Est. time to complete jumpstart</div><div class="install-status-value">{minutes_complete_label}</div></div>',
            '</div>',
            '</div>',
        ])

    outcome_block = error_block if error_message else entry_section

    return ''.join([
        _INSTALL_STATUS_CSS,
        '<div class="install-status-card" role="status" aria-live="polite">',
        f'  <div class="install-status-header">',
        f'    <div>',
        f'      <div class="install-status-title">{safe_name}</div>',
        f'      <div class="install-status-subtitle">Workspace: {safe_workspace}</div>',
        f'    </div>',
        f'    <div class="install-status-pill {pill_class}">{pill_icon} {pill_label}</div>',
        f'  </div>',
        f'  <div class="install-status-section">',
        f'    <div class="install-status-section-title">Installation details</div>',
        f'    <div class="install-status-grid tight">',
        *top_items,
        f'    </div>',
        f'  </div>',
        logs_block,
        outcome_block,
        '</div>',
    ])
