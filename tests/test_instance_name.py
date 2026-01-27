"""Tests for resolving the jumpstart instance name."""


def test_module_is_returned():
    """Calling the module directly should return the module name."""
    import fabric_jumpstart

    assert fabric_jumpstart._get_instance_name() == "fabric_jumpstart"


def test_module_alias_is_returned():
    """Calling via module alias should return that alias (e.g., js)."""
    import fabric_jumpstart as js

    assert js._get_instance_name() == "js"


def test_aliased_alias_is_returned():
    """Calling via a re-aliased alias should return the new variable name."""
    import fabric_jumpstart as js

    js2 = js
    assert js2._get_instance_name() == "js2"