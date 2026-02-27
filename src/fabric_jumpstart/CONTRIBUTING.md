# Contributing to fabric-jumpstart

> Please read the [root contributing guide](../../CONTRIBUTING.md) first for shared guidelines on issues, commits, and PRs.

## Adding a New Jumpstart

This is the most common contribution. You only need to add a single YAML file, run CI tests to validate the metadata input, and then test deploying your Jumpstart.

1. Create a `New Jumpstart` Issue with enough details to help maintainers determine whether the solution fits the Fabric Jumpstart mission.
2. Community contributions are more than welcome, but we do require a Microsoft sponsor for any Core Jumpstarts. This is someone who must have contributor level access to your project.
3. Keep Jumpstarts self-contained: deployments must run through `jumpstart.install()` without manual patching.
4. Please read [STANDARDS.md](STANDARDS.md) for Jumpstart design and quality expectations.
5. Follow the steps in [Setup of a New Jumpstart](#setup-of-a-new-jumpstart) to get things set up, tested, and merged in.
5. For upgrading existing Jumpstarts, follow the [Upgrading an Existing Jumpstart](#updating-an-existing-jumpstart) guide.

## Development Setup

> **No Node.js or npm required.** The Python library is self-contained — you only need [uv](https://docs.astral.sh/uv/) (the Ruff VS Code extension is optional).

### Windows

Run from PowerShell — no WSL required:

```powershell
$GIT_ROOT = git rev-parse --show-toplevel
& "$GIT_ROOT\src\fabric_jumpstart\bootstrap-python.ps1"
```

This installs [uv](https://docs.astral.sh/uv/) and the following VS Code extensions: Ruff, Pylance, and Jupyter. After installation it runs `uv sync --all-groups` so you are all set to start contributing!

## Development
See the [/src/fabric_jumpstart/dev/test_example.ipynb](./dev/test_example.ipynb) notebook for an example of how you can interactively test your Jumpstart.
- Develop in notebooks or `.py` files; restart the Python kernel after code changes so the notebook picks up fresh imports. Or, use `importlib` to reload specific modules for agile testing:
    ```python
    import importlib
    import fabric_jumpstart as jumpstart
    importlib.reload(jumpstart.core)
    importlib.reload(jumpstart.utils)
    importlib.reload(jumpstart)
    ```

## Quality Checks

Run these before submitting a PR:

```bash
cd src/fabric_jumpstart
uv run ruff check .                   # Lint
uv run ty check .                     # Type check
uv run pytest                         # All tests
uv run pytest tests/test_registry.py  # Registry validation (required for new jumpstarts)
```

## Submitting Changes

- **For new Jumpstarts:** Create a new YAML file in `src/fabric_jumpstart/fabric_jumpstart/jumpstarts/community/` named `<logical-id>.yml` with all required metadata. Core jumpstarts (Microsoft-sponsored) go in the `core/` folder.
- Run `uv run pytest tests/test_registry.py` to confirm registry validation passes.

---

## Setup of a New Jumpstart

1. [CORE] Create an M365 Group for the Jumpstart owners (e.g., `fabricjumpstart.spark-monitoring`). Any Core Jumpstart needs to have multiple maintainers.
1. Create a public GitHub repo.
1. Create a Fabric Workspace named `jumpstart.spark-monitoring` and connect it to your GitHub repo (use a PAT with Content permissions).
1. [CORE] Make the M365 group the admin of the Fabric Workspace.
1. Populate the workspace with all items the Jumpstart should deploy.
   - Items must be in a top-level folder named the same as the `logical_id` of the jumpstart (e.g., `spark-monitoring`).
   - Any data stores that need to be shared across Jumpstarts (i.e. for modules of an overall solution like Fabric Platform Monitoring) must be stored in a top-level folder called `shared-data-stores`. Otherwise, the Jumpstarts should self contain all Items in the single top-level folder (e.g. `spark-monitoring`).
   - Fabric items must not contain a solution prefix; Jumpstart can optionally add an automatic prefix at deployment (e.g., `js1_sm__`) so multiple Jumpstarts can coexist in the event of conflicting Item names. By default, no prefixing takes place, users need to opt-in to this upon being notified of Item name conflicts.
   - Do **not** use spaces in item names. Item names must either be `lower_case_snake_case` or `ProperCamelCase`. Both of these options accomodate all known naming restrictions.
1. Commit items to the repo.
1. Fork the fabric-jumpstart repo.
1. Create a new YAML file in `src/fabric_jumpstart/fabric_jumpstart/jumpstarts/community/` (or `core/` for Microsoft-sponsored jumpstarts):
   - Name the file `<logical-id>.yml` (e.g., `spark-monitoring.yml`)
   - Include all required metadata fields (see existing files for examples). _If required fields are not provided, CI tests will fail upon submission of your PR. Validate that your YAML schema conforms in advance via running `cd src/fabric_jumpstart && uv run pytest tests/test_registry.py`_
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
1. Run `fabric_jumpstart.install('<logical-id>', workspace_id='<workspace_guid>')` to validate the Jumpstart deploys correctly (see [dev_example.ipynb](../../dev/dev_example.ipynb) for a quick way to test).
1. Submit a PR with your Jumpstart YAML file.

## Updating an Existing Jumpstart

When a jumpstart's source repository publishes a new tag or ref, you can test the update before submitting a PR:

1. Use the `repo_ref` keyword argument to install with the newer ref without modifying any YAML:
   ```python
   import fabric_jumpstart as js
   js.install('retail-sales', workspace_id='<workspace_guid>', repo_ref='v2.0.0')
   ```
2. Validate that the jumpstart deploys and functions correctly with the new ref.
3. Once verified, update the `repo_ref` value in the jumpstart's YAML file and submit a PR.
4. Run `uv run pytest tests/test_registry.py` to confirm the new ref is reachable before pushing.