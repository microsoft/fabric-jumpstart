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
        return f"{int(minutes)} min"
    except (TypeError, ValueError):
        return html.escape(str(minutes), quote=True)


def render_install_status_html(*, status: str, jumpstart_name: str, workspace_id: Optional[str], entry_point, minutes_complete, minutes_deploy, docs_uri=None, error_message: Optional[str] = None):
    """Build a styled HTML status card for install results."""
    status_lower = status.lower()
    pill_class = 'success' if status_lower == 'success' else 'error'
    pill_label = 'Installed' if status_lower == 'success' else 'Failed'
    pill_icon = '✓' if status_lower == 'success' else '✕'

    safe_name = html.escape(jumpstart_name or 'Jumpstart', quote=True)
    workspace_text = workspace_id or 'Current workspace'
    safe_workspace = html.escape(str(workspace_text), quote=True)

    items_markup = []
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
        items_markup.append(
            f'<div class="install-status-item"><div class="install-status-label">Jumpstart documentation</div><div class="install-status-value">{docs_markup}</div></div>'
        )

    entry_markup = 'Not provided'
    if entry_point:
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

    items_markup.append(
        f'<div class="install-status-item"><div class="install-status-label">Entry point</div><div class="install-status-value">{entry_markup}</div></div>'
    )


    minutes_complete_label = _format_minutes(minutes_complete)
    minutes_deploy_label = _format_minutes(minutes_deploy)

    error_block = ''
    if status_lower != 'success' and error_message:
        error_block = f'<div class="install-status-error" aria-label="Error details">{html.escape(str(error_message), quote=True)}</div>'

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
        f'  <div class="install-status-grid">',
        *items_markup,
        f'    <div class="install-status-item"><div class="install-status-label">⏱️ Time to complete</div><div class="install-status-value">{minutes_complete_label}</div></div>',
        f'    <div class="install-status-item"><div class="install-status-label">📦 Time to deploy</div><div class="install-status-value">{minutes_deploy_label}</div></div>',
        f'  </div>',
        error_block,
        '</div>',
    ])
