from .core import jumpstart as _Jumpstart

# Singleton instance used for convenience imports
jumpstart = _Jumpstart()

__all__ = ["jumpstart"]


def __getattr__(name):
	"""Delegate unknown attributes to the singleton jumpstart instance.

	This enables patterns like:
		import fabric_jumpstart as js
		js.list()
	"""
	if hasattr(jumpstart, name):
		return getattr(jumpstart, name)
	raise AttributeError(f"module 'fabric_jumpstart' has no attribute '{name}'")


def __dir__():
	# Expose module attributes plus delegated jumpstart attributes
	return sorted(set(list(globals().keys()) + dir(jumpstart)))