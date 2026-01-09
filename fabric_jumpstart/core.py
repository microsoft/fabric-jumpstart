from .registry import KNOWN_DEMOS
import importlib

def library():
    """Print all available demos and their descriptions."""
    print("Available demos:")
    for key, meta in KNOWN_DEMOS.items():
        desc = meta.get("description", "")
        print(f" - {key}: {meta['title']}{f' -- {desc}' if desc else ''}")

def install(name: str, **kwargs):
    """
    Install the specified demo by name.
    """
    if name not in KNOWN_DEMOS:
        raise ValueError(f"Unknown demo '{name}'. Use fabric_jumpstart.library() to list demos.")
    
    print(f"[fabric-jumpstart] Installing '{KNOWN_DEMOS[name]['title']}' demo.")
    
    # Import and call the demo's install function
    try:
        mod = importlib.import_module(KNOWN_DEMOS[name]["py_mod"])
        result = mod.install(**kwargs)
        return result
    except Exception as e:
        print(f"[fabric-jumpstart] ❌ Failed to install '{name}': {e}")
        raise