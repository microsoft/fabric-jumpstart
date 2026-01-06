from .registry import KNOWN_DEMOS
import importlib

def library():
    print("Available demos:")
    for key, meta in KNOWN_DEMOS.items():
        print(f" - {key}: {meta['title']}")

def install(name: str, **kwargs):
    if name not in KNOWN_DEMOS:
        raise ValueError(f"Unknown demo '{name}'. Use fabric_jumpstart.library() to list demos.")
    print(f"[fabric-jumpstart] Installing '{KNOWN_DEMOS[name]['title']}' demo.")
    mod = importlib.import_module(KNOWN_DEMOS[name]["py_mod"])
    mod.install(**kwargs)