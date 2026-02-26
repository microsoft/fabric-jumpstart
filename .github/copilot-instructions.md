# Copilot Instructions — Fabric Jumpstart

## Project Overview

Fabric Jumpstart is a monorepo providing ready-to-run accelerators, demos, and tutorials for [Microsoft Fabric](https://www.microsoft.com/en-us/microsoft-fabric). Users discover and install self-contained Fabric solutions via a Python CLI library or browse them on a companion website.

The repo is managed with [Nx](https://nx.dev/) and contains two projects:

| Project | Path | Tech Stack |
|---------|------|------------|
| **fabric-jumpstart** (Python library) | `src/fabric_jumpstart/` | Python 3.10–3.13, Hatchling, uv, Ruff, pytest |
| **fabric-jumpstart-web** (Website) | `src/fabric_jumpstart_web/` | Next.js 15, TypeScript, Fluent UI React v9, Jest |

## Repository Layout

```
├── .github/                    # CI workflows, issue/PR templates
├── contrib/                    # Bootstrap scripts for dev environment setup
├── dev/                        # Development and testing notebooks (.ipynb)
├── src/
│   ├── fabric_jumpstart/       # Python library (published to PyPI)
│   │   ├── core.py             # Main jumpstart logic
│   │   ├── installer.py        # Deployment orchestration
│   │   ├── registry.py         # Jumpstart catalog management
│   │   ├── workspace_manager.py
│   │   ├── ui/                 # In-notebook HTML rendering
│   │   ├── jumpstarts/
│   │   │   ├── core/           # Microsoft-sponsored jumpstarts (YAML)
│   │   │   └── community/      # Community-contributed jumpstarts (YAML)
│   │   └── tests/              # pytest test suite
│   └── fabric_jumpstart_web/   # Next.js website
│       ├── src/                # App source (pages, components, hooks, etc.)
│       ├── scripts/            # Content generation scripts
│       ├── locales/            # i18n translation files
│       └── __tests__/          # Jest test suite
├── tools/                      # Build utility scripts
├── CONTRIBUTING.md             # Shared contribution guidelines (issues, commits, PRs)
└── nx.json                     # Nx monorepo configuration
```

Each sub-project also has its own `CONTRIBUTING.md` with project-specific setup, quality checks, and workflows:
- [`src/fabric_jumpstart/CONTRIBUTING.md`](../src/fabric_jumpstart/CONTRIBUTING.md) — Python library (adding jumpstarts, dev setup)
- [`src/fabric_jumpstart_web/CONTRIBUTING.md`](../src/fabric_jumpstart_web/CONTRIBUTING.md) — Website (dev setup, conventions)

## Most Common Contribution: Adding a New Jumpstart

The majority of contributions add a new jumpstart. This only touches the **Python library** project — specifically a single YAML file in `src/fabric_jumpstart/jumpstarts/`.

### Jumpstart YAML Location

- **Core** (Microsoft-sponsored): `src/fabric_jumpstart/jumpstarts/core/<logical-id>.yml`
- **Community**: `src/fabric_jumpstart/jumpstarts/community/<logical-id>.yml`

### Required YAML Fields

See any existing file in `jumpstarts/core/` for a complete example. Key fields:

```yaml
id: <unique integer>
logical_id: <kebab-case-identifier>
name: <Display Name>
description: >-
  Max 250 chars. Cannot start with the jumpstart name.
date_added: MM/DD/YYYY
workload_tags: [Data Engineering, Power BI, ...]
scenario_tags: [Streaming, Monitoring, ...]
type: Tutorial | Demo | Accelerator
source:
  repo_url: <public GitHub repo URL>
  repo_ref: <tag or commit SHA — not a branch>
  workspace_path: <path in repo>
  preview_image_path: <path to preview image>
items_in_scope: [Lakehouse, Notebook, ...]
entry_point: <Name>.<ItemType> or URL
owner_email: <contact email>
```

### Validating a New Jumpstart

```bash
cd src/fabric_jumpstart
uv run pytest tests/test_registry.py
```

## Python Library — fabric-jumpstart

### Key Commands

```bash
cd src/fabric_jumpstart
uv sync                     # Create/sync virtual environment
uv run ruff check .         # Lint
uv run ty check .           # Type check
uv run pytest               # Run all tests
```

### Conventions

- **Package manager**: [uv](https://docs.astral.sh/uv/) (not pip)
- **Linter**: Ruff (with config in `pyproject.toml`; jumpstarts dir is excluded)
- **Type checker**: ty
- **Build system**: Hatchling
- **Python version**: 3.10–3.13
- Dependencies are listed in `pyproject.toml` under `[project.dependencies]`
- Dev dependencies are in `[dependency-groups]`
- Jumpstart YAML files are excluded from linting but validated by `tests/test_registry.py`

### Module Responsibilities

| Module | Purpose |
|--------|---------|
| `core.py` | Public API — `list()`, `install()`, `uninstall()` |
| `installer.py` | Deployment orchestration and conflict handling |
| `registry.py` | Loads and validates jumpstart YAML catalog |
| `workspace_manager.py` | Fabric workspace API interactions |
| `ui/` | In-notebook HTML catalog rendering |
| `constants.py` | Shared constants |
| `logger.py` | Logging setup |
| `utils.py` | Shared helper functions |

## Website — fabric-jumpstart-web

### Key Commands

```bash
cd src/fabric_jumpstart_web
npm install                  # Install dependencies
npm run dev                  # Dev server on port 8080
npm run build                # Production build (runs generate-content first)
npm run test                 # Jest with coverage
npm run lint                 # ESLint
npm run lint:fix             # ESLint auto-fix
```

### Conventions

- **Framework**: Next.js 15 with static export
- **UI library**: Fluent UI React Components v9 (Microsoft design system)
- **i18n**: next-intl
- **Styling**: CSS modules + Fluent UI tokens
- **Testing**: Jest + React Testing Library
- **Content generation**: `scripts/generate-content.ts` runs as a prebuild step

## Nx Monorepo Commands

```bash
# Build all projects
npx nx run-many -t build --parallel=3

# Test all projects
npx nx run-many -t test

# Full CI check (same as GitHub Actions)
npx nx run-many -t clean --output-style=stream
npx nx run-many -t build test --output-style=stream
npm run fail-on-untracked-files
```

## CI / GitHub Actions

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Python Matrix | `gci-python-matrix.yml` | PRs | Lint, type check, pytest across Python 3.10–3.13 |
| Full GCI | `gci-full.yaml` | PRs | Clean → build → test all projects; verify no untracked files |
| Deploy | `deploy.yaml` | Push to main | Deploy website + publish to PyPI |

## PR and Commit Conventions

- PRs follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for the headline
- Use the PR template in `.github/pull_request_template.md`
- Keep commits focused; avoid formatting-only churn

## Important Standards (from STANDARDS.md)

- Jumpstarts must be complete solutions deployable via `jumpstart.install(<id>)`
- Data must be self-contained (bundled or generated)
- Jumpstarts do not auto-trigger Fabric items — include a Notebook with instructions
- Source repos should be lightweight; `repo_ref` must be a tag or commit SHA (not a branch)
- Item names: no spaces, use `lower_case_snake_case` or `ProperCamelCase`
- Each jumpstart is owned by a mail-enabled security group with at least two owners
