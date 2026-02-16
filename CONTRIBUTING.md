# Contributing

Thank you for helping improve Fabric Jumpstart! Please read and follow [STANDARDS.md](STANDARDS.md) before opening a pull request.

## New Jumpstart Workflow
- Create a `New Jumpstart` Issue with enough details to help maintainers determine whether the solution fits in the Fabric Jumpstart mission.
- Community contributions are more than welcome, but we do require a Microsoft sponsor for any Core Jumpstarts. This is someone who must have contributor level access to your project.
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
- **For new Jumpstarts:** Create a new YAML file in `src/fabric_jumpstart/jumpstarts/community/` named `<logical-id>.yml` with all required metadata. Core jumpstarts (Microsoft-sponsored) go in the `core/` folder instead.
- Run `uv run pytest tests/test_registry.py` to confirm registry validation passes.
- Keep commits focused; avoid formatting-only churn.

## Setup of a New Jumpstart
1. Create an M365 Group for the Jumpstart owners (e.g., `fabricjumpstart.spark-monitoring`). Any Core Jumpstart needs to be have multiple maintainers.
1. Create a public GitHub repo.
1. Create a Fabric Workspace named `jumpstart.spark-monitoring` and connect it to your GitHub repo (use a PAT with Content permissions).
1. Make the M365 group the admin of the Fabric Workspace.
1. Populate the workspace with all items the Jumpstart should deploy.
   - Items must be in a top-level folder named the same as the `logical_id` of the jumpstart (e.g., `spark-monitoring`).
   - Any data stores that need to be shared across Jumpstarts (i.e. for modules of an overall solution like Fabric Platform Monitoring) must be stored in a top-level folder called `shared-data-stores`. Otherwise, the Jumpstarts should self contain all Items in the single top-level folder (e.g. `spark-monitoring`).
   - Fabric items must not contain a solution prefix; Jumpstart can optionally add an automatic prefix at deployment (e.g., `js1_sm__`) so multiple Jumpstarts can coexist in the event of conflicting Item names. By default, no prefixing takes place, users need to opt-in to this upon being notified of Item name conflicts.
   - Do **not** use spaces in item names. Item names must either be `lower_case_snake_case` or `ProperCamelCase`. Both of these options accomodate all known naming restrictions.
1. Commit items to the repo.
1. Fork the fabric-jumpstart repo.
1. Create a new YAML file in `src/fabric_jumpstart/jumpstarts/community/` (or `core/` for Microsoft-sponsored jumpstarts):
   - Name the file `<logical-id>.yml` (e.g., `spark-monitoring.yml`)
   - Include all required metadata fields (see existing files for examples). _If required fields are not provided, CI tests will fail upon submission of your PR. Validate that your YAML schema conforms in advance via running `uv run pytest test_registry.py`
   - The `core` flag will be automatically set based on folder location during loading
   - Required fields (_start by copying and editing an existing YAML file_):
     - `id`: Unique positive integer (check existing IDs to avoid conflicts)
     - `logical_id`: Lowercase kebab-case identifier (e.g., `spark-monitoring`)
     - `name`: Display name
     - `description`: Max 250 characters, cannot start with the jumpstart name
     - `date_added`: MM/DD/YYYY format
     - `workload_tags`: List of valid workload tags
     - `scenario_tags`: List of valid scenario tags
     - `type`: One of: Tutorial, Demo, Accelerator
     - `source`: Object with `repo_url`, `repo_ref`, `workspace_path`, `preview_image_path`
     - `items_in_scope`: List of Fabric item types in scope for deployment (e.g., Lakehouse, Notebook)
     - `entry_point`: Either a URL or `<name>.<item_type>` format
     - `owner_email`: Valid email address
1. Submit a PR with your new jumpstart YAML file.
