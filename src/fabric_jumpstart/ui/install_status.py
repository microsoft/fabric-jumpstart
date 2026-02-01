"""Render install status displays for Fabric Jumpstart."""

import html
from pathlib import Path
from typing import Optional

_response_css_path = Path(__file__).parent / "ui.css"
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


def render_install_status_html(*, status: str, jumpstart_name: str, type: str, workspace_id: Optional[str], entry_point, minutes_complete, minutes_deploy, docs_uri=None, logs=None, error_message: Optional[str] = None, extra_html: Optional[str] = None):
    """Build a styled HTML status card for install results."""
    status_lower = status.lower()
    failure_states = {'error', 'failed', 'failure', 'conflict'}

    if status_lower == 'success':
        pill_class = 'success'
        pill_label = 'Installed'
        pill_icon = '✓'
    elif status_lower in failure_states:
        pill_class = 'error'
        pill_label = 'Failed' if status_lower in {'error', 'failed', 'failure'} else status.capitalize()
        pill_icon = '✕'
    else:
        pill_class = 'info'
        pill_label = status.capitalize()
        pill_icon = '⏳'

    pill_content = f'{pill_icon} {pill_label}'
    if status_lower == 'installing':
        pill_content = ''.join([
            '<span class="pill-label">⏳ Installing</span>',
            '<span class="pill-dots" aria-hidden="true">',
            '  <span class="pill-dot"></span>',
            '  <span class="pill-dot"></span>',
            '  <span class="pill-dot"></span>',
            '</span>'
        ])

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
                f'<span>Documentation</span>'
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

    # Hero block for clear status
    hero_block = ''
    if status_lower == 'success':
        ctas = []
        if docs_uri:
            docs_str = str(docs_uri)
            if docs_str.startswith(('http://', 'https://')):
                safe_docs = html.escape(docs_str, quote=True)
                ctas.append(
                    f'<a class="install-cta secondary" href="{safe_docs}" target="_blank" rel="noopener noreferrer">'
                    f'<span>Documentation</span>'
                    f'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Zm5 14v2H5V5h2v12h12Z"/></svg>'
                    f'</a>'
                )
            else:
                ctas.append(f'<code>{html.escape(docs_str, quote=True)}</code>')

        if entry_point:
            entry_str = str(entry_point)
            if entry_str.startswith(('http://', 'https://')):
                safe_url = html.escape(entry_str, quote=True)
                ctas.append(
                    f'<a class="install-cta" href="{safe_url}" target="_blank" rel="noopener noreferrer">'
                    f'<span>Entry point</span>'
                    f'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Zm5 14v2H5V5h2v12h12Z"/></svg>'
                    f'</a>'
                )
            else:
                ctas.append(f'<code>{html.escape(entry_str, quote=True)}</code>')

        cta_block = ''.join(ctas)


        eta_str = '⏱ Est. time to complete jumpstart'
        if type == 'accelerator':
            eta_str = '⏱ Est. time to setup accelerator'
        elif type == 'tutorial':
            eta_str = 'Est. time to complete tutorial'
        elif type == 'demo':
            eta_str = '⏱ Est. time to complete demo'

        hero_block = ''.join([
            '<div class="install-hero success">',
            '  <div class="hero-icon" aria-hidden="true">🎉</div>',
            '  <div class="hero-text">',
            '    <div class="hero-kicker category-label">Installation complete</div>',
            f'    <div class="hero-title category-title">{safe_name}</div>',
            f'    <div class="hero-sub">Workspace {safe_workspace}</div>',
            f'    <div class="hero-meta">{eta_str}: {minutes_complete_label}</div>',
            '  </div>',
            f'  <div class="hero-cta">{cta_block}</div>',
            '</div>',
        ])

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

    # Hide entry/output sections on success; CTA already handled in hero
    outcome_block = error_block if error_message else ''

    # Always allow logs toggle if available
    logs_section = logs_block if logs_block else ''

    # Only show header/details when not successful
    main_sections = ''
    extra_block = extra_html or ''

    if status_lower != 'success':
        main_sections = ''.join([
            '  <div class="install-status-header">',
            '    <div>',
            f'      <div class="install-status-title">{safe_name}</div>',
            f'      <div class="install-status-subtitle">Workspace: {safe_workspace}</div>',
            '    </div>',
            f'    <div class="install-status-pill {pill_class}{" installing" if status_lower == "installing" else ""}">{pill_content}</div>',
            '  </div>',
            '  <div class="install-status-section">',
            '    <div class="install-status-section-title">Installation details</div>',
            '    <div class="install-status-grid tight">',
            *top_items,
            '    </div>',
            '  </div>',
            extra_block,
            logs_section,
            outcome_block,
        ])
    else:
        main_sections = ''.join([
            logs_section,
            outcome_block,
        ])

    return ''.join([
        _INSTALL_STATUS_CSS,
        f'<div class="install-status-card {pill_class}" role="status" aria-live="polite">',
        hero_block,
        main_sections,
        '</div>',
    ])
