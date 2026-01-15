"""UI rendering functions for Fabric Jumpstart."""

import base64
import html
from functools import lru_cache
from pathlib import Path

from .schemas import DEFAULT_WORKLOAD_COLORS, WORKLOAD_COLOR_MAP

# Load copy icon SVG once at module level
_current_dir = Path(__file__).parent
_assets_path = _current_dir / 'ui_assets'
_copy_icon_path = _assets_path / 'copy-icon.svg'
_css_path = _current_dir / 'jumpstart.css'
_js_path = _current_dir / 'jumpstart.js'
try:
    with open(_copy_icon_path, 'r', encoding='utf-8') as f:
        _COPY_ICON_SVG = f.read()
        # Extract just the SVG content without XML declaration
        if '<?xml' in _COPY_ICON_SVG:
            _COPY_ICON_SVG = _COPY_ICON_SVG[_COPY_ICON_SVG.find('<svg'):]
except FileNotFoundError:
    # Fallback to a simple rectangle if file not found
    _COPY_ICON_SVG = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="currentColor"/></svg>'

try:
    _JUMPSTART_CSS = _css_path.read_text(encoding='utf-8')
except FileNotFoundError:
    _JUMPSTART_CSS = ''

try:
    _JUMPSTART_JS = _js_path.read_text(encoding='utf-8')
except FileNotFoundError:
    _JUMPSTART_JS = ''


# Map workload tags to icon filenames stored in ui_assets
WORKLOAD_ICON_MAP = {
    "Data Engineering": "data_engineering_24_color.svg",
    "Data Warehouse": "data_warehouse_24_color.svg",
    "Real Time Intelligence": "real_time_intelligence_24_color.svg",
    "Data Factory": "data_factory_24_color.svg",
    "SQL Database": "databases_24_color.svg",
    "Power BI": "power_bi_24_color.svg",
    "Data Science": "data_science_24_color.svg",
    "Test": "app_development_24_color.svg",
}

DEFAULT_WORKLOAD_ICON = WORKLOAD_ICON_MAP.get("Data Engineering")


@lru_cache(maxsize=32)
def _load_svg(filename: str) -> str:
    """Load an SVG from ui_assets with simple caching."""
    if not filename:
        return ''
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


def _guess_mime(path: Path) -> str:
    """Minimal mime guess based on file extension."""
    suffix = path.suffix.lower()
    if suffix in {'.jpg', '.jpeg'}:
        return 'image/jpeg'
    if suffix == '.gif':
        return 'image/gif'
    if suffix == '.svg':
        return 'image/svg+xml'
    return 'image/png'


@lru_cache(maxsize=64)
def _load_preview_image_data(path: Path) -> str:
    """Return a data URI for a preview image file if it exists, else empty string."""
    if not path.is_file():
        return ''
    mime = _guess_mime(path)
    encoded = base64.b64encode(path.read_bytes()).decode('ascii')
    return f"data:{mime};base64,{encoded}"


def _resolve_preview_image(jumpstart) -> str:
    """Resolve preview image to a data URI or external URL."""
    preview_path = jumpstart.get("preview_image")
    if not preview_path:
        return ''

    if preview_path.startswith(("http://", "https://", "data:")):
        return preview_path

    candidates = []
    try:
        candidates.append(Path(__file__).parent / 'jumpstarts' / jumpstart['id'] / preview_path)
    except KeyError:
        pass

    preview_path_obj = Path(preview_path)
    if preview_path_obj.is_absolute():
        candidates.append(preview_path_obj)
    else:
        candidates.append(Path(__file__).parent / preview_path)

    for candidate in candidates:
        data_uri = _load_preview_image_data(candidate.resolve())
        if data_uri:
            return data_uri

    return ''


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
    
    # Tag filter buttons - Scenario tags
    html_parts.append('<div id="scenario-tags" class="tag-filters tag-filter-row" style="display: none;">')
    for tag in scenario_tags:
        safe_tag = html.escape(str(tag))
        html_parts.append(
            f'<button class="tag-filter-btn" data-tag="{safe_tag}" '
            f'onclick="filterByTag(this.dataset.tag, \'scenario\', this)">{safe_tag}</button>'
        )
    html_parts.append('</div>')

    # Tag filter buttons - Workload tags
    html_parts.append('<div id="workload-tags" class="tag-filters tag-filter-row">')
    for tag in workload_tags:
        safe_tag = html.escape(str(tag))
        html_parts.append(
            f'<button class="tag-filter-btn" data-tag="{safe_tag}" '
            f'onclick="filterByTag(this.dataset.tag, \'workload\', this)">{safe_tag}</button>'
        )
    html_parts.append('</div>')

    # Tag filter buttons - Type tags
    html_parts.append('<div id="type-tags" class="tag-filters tag-filter-row" style="display: none;">')
    for tag in type_tags:
        safe_tag = html.escape(str(tag))
        html_parts.append(
            f'<button class="tag-filter-btn" data-tag="{safe_tag}" '
            f'onclick="filterByTag(this.dataset.tag, \'type\', this)">{safe_tag}</button>'
        )
    html_parts.append('</div>')
    
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
                <h2 class="category-title">{f"{category_text}s" if group_by != "type" else category_text}</h2>
                <div class="jumpstart-grid">
        ''')
        
        for j in jumpstarts_list:
            # Generate card HTML
            new_badge = '<div class="jumpstart-new-badge">NEW</div>' if j.get('is_new') else ''

            accent_primary, accent_secondary = _resolve_workload_colors(j, category_tag=category, group_by=group_by)
            accent_style = f' style="--accent-primary: {accent_primary}; --accent-secondary: {accent_secondary};"'

            preview_src = _resolve_preview_image(j)
            card_name = html.escape(j.get('name', ''), quote=True)
            preview_img_html = f'<img class="preview-img" src="{preview_src}" alt="{card_name} preview"/>' if preview_src else ''

            computed_type = (
                j.get('jumpstart_type')
                or j.get('type')
                or (category if group_by == "type" else '')
            )
            type_text = html.escape(str(computed_type or ''), quote=True)
            type_display = type_text or 'Unspecified'
            type_callout = f'<div class="type-pill" aria-label="Type: {type_display}">{type_display}</div>' if type_display else ''

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
            
            install_code = (
                f"<span style='color: #096bbc'>{instance_name}</span>."
                f"<span style='color: #605e5c'>install</span>"
                f"<span style='color: #0431fa'>(</span>"
                f"<span style='color: #a31515'>'{j['id']}'</span>"
                f"<span style='color: #0431fa'>)</span>"
            )
            install_code_plain = f"{instance_name}.install('{j['id']}')"
            
            html_parts.append(f'''
                <div class="jumpstart-card"{accent_style} data-type="{type_value}" data-workloads="{workloads_value}" data-scenarios="{scenarios_value}">
                    <div class="jumpstart-image">{preview_img_html}{new_badge}<div class="workload-ribbon">{workload_badges_html}</div></div>
                    <div class="jumpstart-content">
                        {type_callout}
                        <div class="jumpstart-name">{card_name}</div>
                        <div class="jumpstart-description" title="{description_title}">{description_text}</div>
                        <div class="jumpstart-install">
                            <code>{install_code}</code>
                            <span class="copy-btn" role="button" tabindex="0" data-code="{install_code_plain}" onclick="copyToClipboard(this)">
                                ''' + _COPY_ICON_SVG + '''
                            </span>
                        </div>
                    </div>
                </div>
            ''')
        
        html_parts.append('</div></div>')
    
    return ''.join(html_parts)
