"""Catalog rendering functions for Fabric Jumpstart."""

import base64
import html
from functools import lru_cache
from pathlib import Path

from ..constants import DEFAULT_WORKLOAD_COLORS, WORKLOAD_COLOR_MAP
from .formatting import syntax_highlight_python

# Load copy icon SVG once at module level
_current_dir = Path(__file__).parent
_assets_path = _current_dir / 'assets'
_packaged_workload_path = _assets_path / 'workload'
_repo_workload_path = Path(__file__).resolve().parent.parent.parent.parent.parent / 'assets' / 'images' / 'tags' / 'workload'
_shared_assets_path = _packaged_workload_path if _packaged_workload_path.is_dir() else _repo_workload_path
_diagrams_path = Path(__file__).resolve().parent.parent.parent.parent.parent / 'assets' / 'images' / 'diagrams'
_copy_icon_path = _assets_path / 'copy-icon.svg'
_css_path = _current_dir / 'ui.css'
_js_path = _current_dir / 'catalog.js'
try:
    with open(_copy_icon_path, 'r', encoding='utf-8') as f:
        _COPY_ICON_SVG = f.read()
        # Extract just the SVG content without XML declaration
        if '<?xml' in _COPY_ICON_SVG:
            _COPY_ICON_SVG = _COPY_ICON_SVG[_COPY_ICON_SVG.find('<svg'):]
except FileNotFoundError:
    # Fallback to a simple rectangle if file not found
    _COPY_ICON_SVG = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="currentColor"/></svg>'

def _load_text(path: Path) -> str:
    try:
        return path.read_text(encoding='utf-8')
    except FileNotFoundError:
        return ''

_JUMPSTART_CSS = _load_text(_css_path)
_JUMPSTART_JS = _load_text(_js_path)


def reload_assets():
    """Reload CSS/JS assets from disk without restarting the kernel."""
    global _JUMPSTART_CSS, _JUMPSTART_JS
    _JUMPSTART_CSS = _load_text(_css_path)
    _JUMPSTART_JS = _load_text(_js_path)


# Map workload tags to icon filenames stored in shared assets
WORKLOAD_ICON_MAP = {
    "Data Engineering": "data-engineering.svg",
    "Data Warehouse": "data-warehouse.svg",
    "Real-Time Intelligence": "real-time-intelligence.svg",
    "Data Factory": "data-factory.svg",
    "SQL Database": "sql-database.svg",
    "Power BI": "power-bi.svg",
    "Data Science": "data-science.svg"
}

DEFAULT_WORKLOAD_ICON = WORKLOAD_ICON_MAP.get("Data Engineering")


# Map jumpstart types to quick-recognition emojis for the card tag
TYPE_EMOJI_MAP = {
    "Accelerator": "🚀",
    "Demo": "▶️",
    "Tutorial": "📓",
}


@lru_cache(maxsize=32)
def _load_svg(filename: str) -> str:
    """Load an SVG from shared assets (workload icons) or ui assets (others)."""
    if not filename:
        return ''
    svg_path = _shared_assets_path / filename
    if not svg_path.exists():
        svg_path = _assets_path / filename
    try:
        return svg_path.read_text(encoding='utf-8').strip()
    except FileNotFoundError:
        return ''


def _svg_to_data_uri(svg_text: str) -> str:
    """Convert raw SVG text to a data URI to avoid ID/gradient collisions when inlined."""
    if not svg_text:
        return ''
    encoded = base64.b64encode(svg_text.encode('utf-8')).decode('ascii')
    return f"data:image/svg+xml;base64,{encoded}"


@lru_cache(maxsize=64)
def _load_diagram_svg(logical_id: str) -> str:
    """Load the light-mode diagram SVG as a data URI if it exists."""
    svg_path = _diagrams_path / f"{logical_id}_light.svg"
    if not svg_path.is_file():
        return ''
    encoded = base64.b64encode(svg_path.read_bytes()).decode('ascii')
    return f"data:image/svg+xml;base64,{encoded}"



def _format_type_label(type_value: str) -> str:
    """Return type label decorated with an emoji for quick scanning."""
    if not type_value:
        return ''
    emoji = TYPE_EMOJI_MAP.get(str(type_value), '')
    safe_text = html.escape(str(type_value), quote=True)
    return f"{emoji} {safe_text}" if emoji else safe_text



def _resolve_workload_colors(jumpstart, category_tag=None, group_by="scenario"):
    """Return primary/secondary colors for the card based on grouping context.

    - Scenario view: use the card's first workload tag.
    - Workload view: use the workload category key for consistent coloring.
    """
    if group_by == "workload" and category_tag:
        colors = WORKLOAD_COLOR_MAP.get(category_tag, DEFAULT_WORKLOAD_COLORS)
        return colors["primary"], colors["secondary"]

    workload_tags = jumpstart.get("workload_tags") or []
    primary_tag = workload_tags[0] if workload_tags else None
    colors = WORKLOAD_COLOR_MAP.get(primary_tag, DEFAULT_WORKLOAD_COLORS)
    return colors["primary"], colors["secondary"]


def _build_workload_badges(workload_tags):
    """Return a list of (label, svg_content) tuples for the workload tags."""
    tags = workload_tags or ["Unspecified"]
    badges = []
    for tag in tags:
        filename = WORKLOAD_ICON_MAP.get(tag, DEFAULT_WORKLOAD_ICON)
        svg_content = _load_svg(filename)
        data_uri = _svg_to_data_uri(svg_content)
        badges.append((tag, data_uri))
    return badges


def render_jumpstart_list(grouped_scenario, grouped_workload, grouped_type, instance_name):
    """
    Generate HTML UI for jumpstarts listing with interactive toggle and tag filters.
    
    Args:
        grouped_scenario: Dictionary of jumpstarts grouped by scenario tags
        grouped_workload: Dictionary of jumpstarts grouped by workload tags
        instance_name: The variable name of the jumpstart instance
        
    Returns:
        HTML string for rendering in notebook
    """
    
    # Extract unique tags
    scenario_tags = sorted(grouped_scenario.keys())
    workload_tags = sorted(grouped_workload.keys())
    type_tags = sorted(grouped_type.keys()) if grouped_type else []
    
    return _generate_html(
        grouped_scenario,
        grouped_workload,
        grouped_type,
        scenario_tags,
        workload_tags,
        type_tags,
        instance_name,
    )


def _generate_html(grouped_scenario, grouped_workload, grouped_type, scenario_tags, workload_tags, type_tags, instance_name):
    # Arc Jumpstart theming - load from external assets
    style = f"<style>{_JUMPSTART_CSS}</style>" if _JUMPSTART_CSS else ""
    script = f"<script>{_JUMPSTART_JS}</script>" if _JUMPSTART_JS else ""

    # Build HTML
    html_parts = [style, script, '<div class="jumpstart-container">']
    
    # Header with Arc Jumpstart styling
    html_parts.append('''
        <div class="jumpstart-header">
            <div class="jumpstart-label">DISCOVER</div>
            <h1>Fabric Jumpstart</h1>
            <p>Get started quickly with pre-built solutions, tutorials, demos, and accelerators—automated, high-quality, and open-source.</p>
        </div>
    ''')
    
    # Toggle button group with label
    html_parts.append('''
        <div class="filters-row">
            <span class="group-by-label">Group By</span>
            <div class="toggle-group">
                <button class="active" data-view="workload" onclick="toggleView('workload', this)">Workload</button>
                <button data-view="scenario" onclick="toggleView('scenario', this)">Scenario</button>
                <button data-view="type" onclick="toggleView('type', this)">Type</button>
            </div>
        </div>
    ''')
    
    # Dropdown filter bar with "+ Add Filter" button
    html_parts.append('''
        <div class="filters-bar-row">
            <div id="active-filters" class="filters-active"></div>
            <div class="add-filter-wrapper">
                <button id="add-filter-btn" class="add-filter-btn" type="button" aria-expanded="false" aria-haspopup="true" onclick="toggleFilterMenu()">+ Add Filter</button>
                <div id="filter-menu" class="filter-menu" data-open="false"></div>
            </div>
        </div>
    ''')
    
    # Scenario view
    html_parts.append('<div id="scenario-view" class="view-container">')
    html_parts.append(_render_grouped_jumpstarts(grouped_scenario, instance_name, group_by="scenario"))
    html_parts.append('</div>')
    
    # Workload view
    html_parts.append('<div id="workload-view" class="view-container active">')
    html_parts.append(_render_grouped_jumpstarts(grouped_workload, instance_name, group_by="workload"))
    html_parts.append('</div>')

    # Type view
    html_parts.append('<div id="type-view" class="view-container">')
    html_parts.append(_render_grouped_jumpstarts(grouped_type or {}, instance_name, group_by="type"))
    html_parts.append('</div>')
    
    html_parts.append('</div>')
    
    return ''.join(html_parts)


def _render_grouped_jumpstarts(grouped_jumpstarts, instance_name, group_by="scenario"):
    """Render HTML for grouped jumpstarts with Arc Jumpstart styling."""
    html_parts = []
    
    for category, jumpstarts_list in sorted(grouped_jumpstarts.items()):
        category_text = html.escape(str(category))
        category_attr = html.escape(str(category), quote=True)

        section_primary, section_secondary = _resolve_workload_colors(
            jumpstarts_list[0] if jumpstarts_list else {},
            category_tag=category,
            group_by=group_by,
        )
        # In workload view tint the EXPLORE label with the darker secondary accent.
        section_color_attr = f' style="color: {section_secondary};"' if group_by == "workload" else ''
        html_parts.append(f'''
            <div class="category-section" data-category="{category_attr}">
                <div class="category-label"{section_color_attr}>EXPLORE</div>
                <h2 class="category-title">{f"{category_text}s" if group_by == "type" else category_text}</h2>
                <div class="jumpstart-grid">
        ''')
        
        for j in jumpstarts_list:
            # Generate card HTML
            new_badge = '<div class="jumpstart-new-badge">NEW</div>' if j.get('is_new') else ''

            accent_primary, accent_secondary = _resolve_workload_colors(j, category_tag=category, group_by=group_by)
            accent_style = f' style="--accent-primary: {accent_primary}; --accent-secondary: {accent_secondary};"'

            card_name = html.escape(j.get('name', ''), quote=True)

            computed_type = (
                j.get('jumpstart_type')
                or j.get('type')
                or (category if group_by == "type" else '')
            )
            type_value = html.escape(str(computed_type or ''), quote=True)
            type_label = _format_type_label(computed_type)
            type_display = type_label or 'Unspecified'
            aria_label = html.escape(f"Type: {computed_type or 'Unspecified'}", quote=True)
            type_callout = (
                f'<div class="type-pill" aria-label="{aria_label}">{type_display}</div>'
                if type_display
                else ''
            )

            difficulty_value = j.get('difficulty', '')
            if difficulty_value:
                difficulty_level = html.escape(str(difficulty_value), quote=True)
                difficulty_callout = (
                    f'<div class="difficulty-pill difficulty-{difficulty_value.lower()}" '
                    f'aria-label="Difficulty: {difficulty_level}">{difficulty_level}</div>'
                )
            else:
                difficulty_callout = ''

            meta_pills = ''.join([pill for pill in [type_callout, difficulty_callout] if pill])

            # Core vs Community class badge
            is_core = j.get('core', True)
            class_label = '⚡️Core' if is_core else 'Community'
            class_badge = f'<div class="class-pill {"class-pill-core" if is_core else "class-pill-community"}" aria-label="Jumpstart class: {class_label}">{class_label}</div>'

            meta_block = (
                f'<div class="meta-pills" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">{class_badge}{meta_pills}</div>'
                if meta_pills or class_badge
                else ''
            )

            workload_badges = _build_workload_badges(j.get("workload_tags"))
            workload_badges_html = ''.join(
                f'<div class="workload-chip" title="{tag}" aria-label="{tag}"><span class="workload-icon"><img src="{data_uri}" alt="{tag} icon"/></span></div>'
                for tag, data_uri in workload_badges
            )

            workloads_value = html.escape('|'.join(j.get("workload_tags") or []), quote=True)
            scenarios_value = html.escape('|'.join(j.get("scenario_tags") or []), quote=True)
            type_value = html.escape(str(computed_type or ''), quote=True)

            description_text = j.get('description', '')
            description_title = html.escape(description_text, quote=True)
            
            logical_id = j.get('logical_id') or j.get('id', '')
            install_code_plain = f"{instance_name}.install('{logical_id}')"
            install_code = syntax_highlight_python(install_code_plain)

            diagram_src = _load_diagram_svg(str(logical_id))
            diagram_html = f'<div class="diagram-overlay"><img src="{diagram_src}" alt="Architecture diagram"/></div>' if diagram_src else ''

            items_in_scope = j.get('items_in_scope', [])
            deploy_min_val = j.get('minutes_to_deploy')
            complete_min_val = j.get('minutes_to_complete_jumpstart')
            meta_parts = []
            if deploy_min_val not in (None, ''):
                try:
                    meta_parts.append(f"📦 {int(deploy_min_val)} min. deploy")
                except (TypeError, ValueError):
                    meta_parts.append(f"📦 {html.escape(str(deploy_min_val))} deploy")
            if complete_min_val not in (None, ''):
                try:
                    meta_parts.append(f"⏱️ {int(complete_min_val)} min. complete")
                except (TypeError, ValueError):
                    meta_parts.append(f"⏱️ {html.escape(str(complete_min_val))}")
            if items_in_scope:
                meta_parts.append(f"{len(items_in_scope)} item types")
            meta_footer_text = '   •   '.join(meta_parts)
            meta_footer_html = f'<div class="jumpstart-meta-footer">{meta_footer_text}</div>' if meta_footer_text else ''

            html_parts.append(f'''
                <div class="jumpstart-card"{accent_style} data-type="{type_value}" data-workloads="{workloads_value}" data-scenarios="{scenarios_value}">
                    <div class="jumpstart-image">{diagram_html}{new_badge}<div class="workload-ribbon">{workload_badges_html}</div></div>
                    <div class="jumpstart-content">
                        {meta_block}
                        <div class="jumpstart-name">{card_name}</div>
                        <div class="jumpstart-description" title="{description_title}">{description_text}</div>
                        <div class="jumpstart-code-block">
                            <div class="code-header">Python</div>
                            <div class="jumpstart-install">
                                <code>{install_code}</code>
                                <span class="copy-btn" role="button" tabindex="0" data-code="{install_code_plain}" onclick="copyToClipboard(this)">
                                    ''' + _COPY_ICON_SVG + f'''
                                </span>
                            </div>
                        </div>
                        {meta_footer_html}
                    </div>
                </div>
            ''')
        
        html_parts.append('</div></div>')
    
    return ''.join(html_parts)
