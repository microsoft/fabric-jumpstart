"""Code formatting and syntax highlighting utilities for Fabric Jumpstart."""

import html
import re
from pathlib import Path

# Load copy icon SVG once at module level
_current_dir = Path(__file__).parent
_assets_path = _current_dir / 'assets'
_copy_icon_path = _assets_path / 'copy-icon.svg'

try:
    with open(_copy_icon_path, 'r', encoding='utf-8') as f:
        _COPY_ICON_SVG = f.read()
        # Extract just the SVG content without XML declaration
        if '<?xml' in _COPY_ICON_SVG:
            _COPY_ICON_SVG = _COPY_ICON_SVG[_COPY_ICON_SVG.find('<svg'):]
except FileNotFoundError:
    # Fallback to a simple rectangle if file not found
    _COPY_ICON_SVG = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="currentColor"/></svg>'


def syntax_highlight_python(code: str) -> str:
    """Apply basic Python syntax highlighting to code snippet.
    
    Uses consistent color scheme:
    - Variables/instances: Blue (#096bbc)
    - Functions/methods: Gray (#605e5c)
    - Strings: Red (#a31515)
    - Keywords (True, False): Blue (#0431fa)
    - Punctuation: Light gray (#808080)
    
    Args:
        code: Python code string to highlight
        
    Returns:
        HTML string with syntax highlighting applied
        
    Example:
        >>> syntax_highlight_python('jumpstart.install("demo")')
        '<span style="color: #096bbc">jumpstart</span>...'
    """
    # Parse the install call pattern: instance.install("name", workspace_id="...", ...)
    # Match: <instance>.<method>(<args>)
    pattern = r'^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$'
    match = re.match(pattern, code)
    
    if not match:
        # Fallback: just escape and return
        return html.escape(code, quote=False)
    
    instance = match.group(1)
    method = match.group(2)
    args_str = match.group(3)
    
    # Build syntax-highlighted output
    result = (
        f'<span style="color: #096bbc">{html.escape(instance)}</span>'  # Variable
        f'<span style="color: #808080">.</span>'  # Punctuation
        f'<span style="color: #605e5c">{html.escape(method)}</span>'  # Method
        f'<span style="color: #0431fa">(</span>'  # Parenthesis
    )
    
    # Process arguments
    # Simple split by comma (not perfect but works for our use case)
    args = [a.strip() for a in args_str.split(',')]
    for i, arg in enumerate(args):
        if i > 0:
            result += '<span style="color: #808080">, </span>'  # Punctuation
        
        # Check if it's a keyword argument
        if '=' in arg:
            key, val = arg.split('=', 1)
            key = key.strip()
            val = val.strip()
            result += f'<span style="color: #096bbc">{html.escape(key)}</span>'  # Parameter name
            result += '<span style="color: #808080">=</span>'  # Punctuation
            
            # Check if value is a string literal
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                result += f'<span style="color: #a31515">{html.escape(val)}</span>'  # String
            else:
                # Boolean or other keywords
                result += f'<span style="color: #0431fa">{html.escape(val)}</span>'  # Keyword
        else:
            # Positional argument (string literal)
            if (arg.startswith('"') and arg.endswith('"')) or (arg.startswith("'") and arg.endswith("'")):
                result += f'<span style="color: #a31515">{html.escape(arg)}</span>'  # String
            else:
                result += html.escape(arg)
    
    result += '<span style="color: #0431fa">)</span>'  # Parenthesis
    return result


def render_copyable_code(code: str, include_syntax_highlighting: bool = True) -> str:
    """Render a code snippet in jumpstart-install style with copy button.
    
    Args:
        code: Code string to render
        include_syntax_highlighting: Whether to apply Python syntax highlighting
        
    Returns:
        HTML string with styled code block and copy button
        
    Example:
        >>> html = render_copyable_code('jumpstart.install("demo")')
        >>> 'jumpstart-install' in html
        True
    """
    if include_syntax_highlighting:
        highlighted = syntax_highlight_python(code)
    else:
        highlighted = html.escape(code, quote=False)
    
    # Use data attribute for the code, not inline in onclick
    plain_for_attr = html.escape(code, quote=True)
    
    # Simple inline handler using data attribute
    onclick = (
        "(function(btn){const text=btn.getAttribute('data-code');"
        "const ta=document.createElement('textarea');"
        "ta.value=text;ta.style.position='fixed';ta.style.opacity='0';"
        "document.body.appendChild(ta);ta.select();document.execCommand('copy');"
        "document.body.removeChild(ta);const orig=btn.innerHTML;"
        "btn.innerHTML='&lt;svg viewBox=&quot;0 0 16 16&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;&gt;&lt;path d=&quot;M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z&quot;/&gt;&lt;/svg&gt;';"
        "btn.classList.add('copied');setTimeout(function(){btn.innerHTML=orig;btn.classList.remove('copied');},2000);"
        "})(this)"
    )
    
    return ''.join([
        '<div class="jumpstart-install">',
        f'<code>{highlighted}</code>',
        f'<span class="copy-btn" role="button" tabindex="0" data-code="{plain_for_attr}" onclick="{onclick}">',
        _COPY_ICON_SVG,
        '</span>',
        '</div>',
    ])
