"""UI rendering functions for Fabric Jumpstart."""

from pathlib import Path

from .schemas import DEFAULT_WORKLOAD_COLORS, WORKLOAD_COLOR_MAP

# Load copy icon SVG once at module level
_copy_icon_path = Path(__file__).parent / 'ui_assets' / 'copy-icon.svg'
try:
    with open(_copy_icon_path, 'r', encoding='utf-8') as f:
        _COPY_ICON_SVG = f.read()
        # Extract just the SVG content without XML declaration
        if '<?xml' in _COPY_ICON_SVG:
            _COPY_ICON_SVG = _COPY_ICON_SVG[_COPY_ICON_SVG.find('<svg'):]
except FileNotFoundError:
    # Fallback to a simple rectangle if file not found
    _COPY_ICON_SVG = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="currentColor"/></svg>'


def _resolve_workload_colors(jumpstart):
    """Return primary/secondary colors for the card based on the first workload tag."""
    workload_tags = jumpstart.get("workload_tags") or []
    primary_tag = workload_tags[0] if workload_tags else None
    colors = WORKLOAD_COLOR_MAP.get(primary_tag, DEFAULT_WORKLOAD_COLORS)
    return colors["primary"], colors["secondary"]


def render_jumpstart_list(grouped_scenario, grouped_workload, instance_name):
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
    
    return _generate_html(grouped_scenario, grouped_workload, scenario_tags, workload_tags, instance_name)


def _generate_html(grouped_scenario, grouped_workload, scenario_tags, workload_tags, instance_name):
    # Arc Jumpstart theming - exact match to jumpstart.azure.com
    style = """
    <style>
        * {
            box-sizing: border-box;
        }
        .jumpstart-container {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fafafa;
        }
        .jumpstart-header {
            margin-bottom: 40px;
        }
        .jumpstart-label {
            color: #117865;
            font-size: 16px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2.25px;
            margin-bottom: 8px;
        }
        .jumpstart-header h1 {
            color: #1f1f1f;
            font-size: 32px;
            margin: 0 0 12px 0;
            font-weight: 700;
            line-height: 1.2;
        }
        .jumpstart-header p {
            color: #605e5c;
            font-size: 18px;
            font-weight: 350;
            margin: 0;
            line-height: 1.5;
        }
        
        /* Toggle button group */
        .view-toggle {
            display: flex;
            margin-bottom: 20px;
        }
        .toggle-group {
            display: inline-flex;
            border: 1px solid #d2d0ce;
            border-radius: 4px;
            overflow: hidden;
        }
        .toggle-group button {
            background: transparent;
            color: #323130;
            border: none;
            padding: 10px 32px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border-right: 1px solid #d2d0ce;
        }
        .toggle-group button:last-child {
            border-right: none;
        }
        .toggle-group button.active {
            background: linear-gradient(135deg, #117865 0%, #0C695A 100%);
            color: white;
        }
        .toggle-group button:hover:not(.active) {
            background: #ffffff;
        }
        
        /* Tag filter pills */
        .tag-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 40px;
        }
        .tag-filter-btn {
            background: transparent;
            color: #323130;
            border: 1px solid #d2d0ce;
            padding: 6px 18px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .tag-filter-btn:hover {
            background: #ffffff;
            border-color: #8a8886;
        }
        .tag-filter-btn.active {
            background: linear-gradient(135deg, #117865 0%, #0C695A 100%);
            color: white;
            border-color: transparent;
        }
        
        .category-section {
            margin-bottom: 60px;
        }
        .category-section.hidden {
            display: none;
        }
        .category-label {
            color: #117865;
            font-size: 16px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2.25px;
            margin-bottom: 4px;
        }
        .category-title {
            color: #1f1f1f;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 30px 0;
            line-height: 1.2;
        }
        .jumpstart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .jumpstart-card {
            background: #ffffff;
            border: 1px solid #edebe9;
            border-radius: 4px;
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 0.3px 0.9px 0 rgba(0,0,0,.108);
            display: flex;
            flex-direction: column;
            position: relative;
            --accent-primary: #117865;
            --accent-secondary: #0C695A;
        }
        .jumpstart-card:hover {
            box-shadow: 0 6.4px 14.4px 0 rgba(0,0,0,.132), 0 1.2px 3.6px 0 rgba(0,0,0,.108);
            transform: translateY(-2px);
        }
        .jumpstart-image {
            width: 100%;
            height: 160px;
            position: relative;
            background: linear-gradient(135deg, var(--accent-primary, #117865) 0%, var(--accent-secondary, #0C695A) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .jumpstart-new-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: #212121; <!-- var(--accent-primary, #117865) -->
            color: white;
            padding: 4px 12px;
            border-radius: 2px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .jumpstart-content {
            padding: 24px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .jumpstart-name {
            color: #1f1f1f;
            font-size: 1.5em;
            font-weight: 600;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .jumpstart-description {
            color: #605e5c;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 20px;
            flex: 1;
        }
        .jumpstart-install {
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13px;
            padding: 12px 16px;
            background: #f3f2f1;
            border-radius: 2px;
            border-left: 3px solid var(--accent-primary, #117865);
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }
        .jumpstart-install:hover {
            background: #edebe9;
        }
        .jumpstart-install:hover .copy-btn {
            opacity: 1;
        }
        .jumpstart-install code {
            color: var(--accent-primary, #117865);
            background: transparent;
            font-family: inherit;
        }
        .copy-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            padding: 4px;
            cursor: pointer;
            opacity: 0.5;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        .copy-btn:hover {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 2px;
            opacity: 1;
        }
        .copy-btn svg {
            width: 18px;
            height: 18px;
            fill: #424242;
            pointer-events: none;
        }
        .copy-btn.copied svg {
            fill: var(--accent-primary, #117865);
        }
        .view-container {
            display: none;
        }
        .view-container.active {
            display: block;
        }
    </style>
    """
    
    # JavaScript for toggle and tag filter functionality
    script = """
    <script>
        function toggleView(viewType, clickedButton) {
            // Show selected view
            document.querySelectorAll('.view-container').forEach(el => {
                el.classList.remove('active');
            });
            document.getElementById(viewType + '-view').classList.add('active');
            
            // Update toggle button states
            document.querySelectorAll('.toggle-group button').forEach(btn => {
                btn.classList.remove('active');
            });
            clickedButton.classList.add('active');
            
            // Show corresponding tag filters
            document.querySelectorAll('.tag-filter-row').forEach(row => {
                row.style.display = 'none';
            });
            document.getElementById(viewType + '-tags').style.display = 'flex';
            
            // Reset tag filters - show all
            filterByTag(null, viewType);
        }
        
        function filterByTag(tag, viewType, clickedButton) {
            const view = document.getElementById(viewType + '-view');
            const sections = view.querySelectorAll('.category-section');
            const tagButtons = document.querySelectorAll('#' + viewType + '-tags .tag-filter-btn');
            
            // Toggle behavior: clicking same tag deselects it
            if (clickedButton && clickedButton.classList.contains('active')) {
                // Deselect - show all
                tagButtons.forEach(btn => btn.classList.remove('active'));
                sections.forEach(section => section.classList.remove('hidden'));
                return;
            }
            
            // Update tag button states
            tagButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            if (clickedButton) {
                clickedButton.classList.add('active');
            }
            
            // Show/hide sections based on filter
            sections.forEach(section => {
                if (tag === null) {
                    section.classList.remove('hidden');
                } else {
                    const sectionTag = section.querySelector('.category-title').textContent;
                    section.classList.toggle('hidden', sectionTag !== tag);
                }
            });
        }
        
        function copyToClipboard(button) {
            // Get the code from the data attribute
            const text = button.getAttribute('data-code');
            
            // Store the original button content before modifying
            if (!button.dataset.originalContent) {
                button.dataset.originalContent = button.innerHTML;
            }
            
            // Use execCommand-based fallback only (Clipboard API is blocked in Fabric)
            const copyText = () => {
                return new Promise((resolve, reject) => {
                    try {
                        const textarea = document.createElement('textarea');
                        textarea.value = text;
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.select();
                        const ok = document.execCommand('copy');
                        document.body.removeChild(textarea);
                        if (ok) {
                            resolve();
                        } else {
                            reject(new Error('execCommand returned false'));
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            };
            
            copyText().then(() => {
                // Visual feedback - change to checkmark icon
                button.classList.add('copied');
                button.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"/></svg>';
                
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = button.dataset.originalContent;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy to clipboard. Please copy manually: ' + text);
            });
        }
        
        // Event delegation for copy buttons (Fabric notebooks may not support inline onclick for these)
        document.addEventListener('click', function(e) {
            const target = e.target;
            // Check if clicked element or any parent is a copy button
            const copyBtn = target.classList.contains('copy-btn') ? target : target.closest('.copy-btn');
            if (copyBtn) {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(copyBtn);
            }
        }, true); // Use capture phase for better reliability
    </script>
    """
    
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
    
    # Toggle button group
    html_parts.append('''
        <div class="view-toggle">
            <div class="toggle-group">
                <button class="active" onclick="toggleView('scenario', this)">Scenario</button>
                <button onclick="toggleView('workload', this)">Workload</button>
            </div>
        </div>
    ''')
    
    # Tag filter buttons - Scenario tags
    html_parts.append('<div id="scenario-tags" class="tag-filters tag-filter-row">')
    for tag in scenario_tags:
        html_parts.append(f'<button class="tag-filter-btn" onclick="filterByTag(\'{tag}\', \'scenario\', this)">{tag}</button>')
    html_parts.append('</div>')
    
    # Tag filter buttons - Workload tags
    html_parts.append('<div id="workload-tags" class="tag-filters tag-filter-row" style="display: none;">')
    for tag in workload_tags:
        html_parts.append(f'<button class="tag-filter-btn" onclick="filterByTag(\'{tag}\', \'workload\', this)">{tag}</button>')
    html_parts.append('</div>')
    
    # Scenario view
    html_parts.append('<div id="scenario-view" class="view-container active">')
    html_parts.append(_render_grouped_jumpstarts(grouped_scenario, instance_name))
    html_parts.append('</div>')
    
    # Workload view
    html_parts.append('<div id="workload-view" class="view-container">')
    html_parts.append(_render_grouped_jumpstarts(grouped_workload, instance_name))
    html_parts.append('</div>')
    
    html_parts.append('</div>')
    
    return ''.join(html_parts)


def _render_grouped_jumpstarts(grouped_jumpstarts, instance_name):
    """Render HTML for grouped jumpstarts with Arc Jumpstart styling."""
    html_parts = []
    
    for category, jumpstarts_list in sorted(grouped_jumpstarts.items()):
        html_parts.append(f'''
            <div class="category-section">
                <div class="category-label">EXPLORE</div>
                <h2 class="category-title">{category}</h2>
                <div class="jumpstart-grid">
        ''')
        
        for j in jumpstarts_list:
            # Generate card HTML
            new_badge = '<div class="jumpstart-new-badge">NEW</div>' if j.get('is_new') else ''

            accent_primary, accent_secondary = _resolve_workload_colors(j)
            accent_style = f' style="--accent-primary: {accent_primary}; --accent-secondary: {accent_secondary};"'
            
            install_code = (
                f"<span style='color: #605e5c'>{instance_name}</span>."
                f"<span style='color: var(--accent-primary, #117865)'>install</span>"
                f"(<span style='color: #a31515'>'{j['id']}'</span>)"
            )
            install_code_plain = f"{instance_name}.install('{j['id']}')"
            
            html_parts.append(f'''
                <div class="jumpstart-card"{accent_style}>
                    <div class="jumpstart-image">{new_badge}</div>
                    <div class="jumpstart-content">
                        <div class="jumpstart-name">{j['name']}</div>
                        <div class="jumpstart-description">{j['description']}</div>
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
