# Contributing

Thank you for helping improve Fabric Jumpstart! Please read and follow [STANDARDS.md](STANDARDS.md) before opening a pull request.

## New Jumpstart Workflow
- Create a `New Jumpstart` Issue with enough details to help maintainers determine whether the solution fits in the Fabric Jumpstart mission.
- Community contributions are more than welcome, but we do require a Microsoft sponsor of your Jumpstart. This is someone who must have contributor level access to your project.
- Keep Jumpstarts self-contained: deployments must run through `jumpstart.install()` without manual patching.
- Follow the steps in [JUMPSTART_SETUP.md](JUMPSTART_SETUP.md) to get things set up, tested, and merged in.

## General Changes Workflow
- Discuss larger changes with maintainers first (issue or PR draft) to align on scope.

## Development Setup
- Install **uv** (https://docs.astral.sh/uv/). This project expects uv for dependency management.
- Create/sync the virtual environment:
  - Run `uv sync` in your terminal (installs Python 3.11–3.12 if needed and resolves dependencies)
- In VS Code, install the **Ruff** extension for linting.
- Develop in notebooks or `.py` files; restart the Python kernel after code changes so the notebook picks up fresh imports. Or, use importlib to reload specific modules for agile testing.
    ```python
    import importlib
    import fabric_jumpstart as jumpstart
    importlib.reload(jumpstart.core)
    importlib.reload(jumpstart.utils)
    importlib.reload(jumpstart)
    ```

## Quality Checks (required for any new features)
----------------------------
- Lint: `uv run ruff check .`
- Tests: `uv run pytest tests/`

## Submitting Changes
------------------
- Include a brief rationale in your PR description and note any user-facing impacts.
- Ensure new Jumpstarts are added to `registry.yml` with all required metadata passing tests (run `uv run pytest tests/test_registry.py` to confirm registry tests pass).
- Keep commits focused; avoid formatting-only churn.
