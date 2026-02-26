# Contributing

Thank you for helping improve Fabric Jumpstart! This is a monorepo with two projects — most contributors only need the Python library.

| Project | Path | Contributing Guide |
|---------|------|--------------------|
| **fabric-jumpstart** (Python library + Jumpstarts) | `src/fabric_jumpstart/` | [Contributing to Fabric Jumpstart](src/fabric_jumpstart/CONTRIBUTING.md) |
| **fabric-jumpstart-web** (Website) | `src/fabric_jumpstart_web/` | [Contributing to the Website](src/fabric_jumpstart_web/CONTRIBUTING.md) |

> **Contributing a new Jumpstart?** You only need Python and uv — head to the [fabric-jumpstart library contributing guide](src/fabric_jumpstart/CONTRIBUTING.md).

---

## Getting Started

1. **Open an issue first.** Before writing code, create an issue (or use the `New Jumpstart` template for jumpstarts) so maintainers can confirm the change fits the project's direction.
2. **Discuss larger changes** with maintainers via an issue or draft PR to align on scope before investing effort.
3. **Fork the repo** and create a feature branch from `main`.

## Quick Setup — Python Library (Jumpstart contributors)

If you're adding a Jumpstart or working on the Python library, you only need **Python** and **uv**. No Node.js required.

```bash
cd src/fabric_jumpstart
uv sync        # Creates venv and installs all dependencies
uv run pytest   # Run tests
```

Or use the bootstrap script (installs uv for you if needed):

```bash
chmod +x contrib/bootstrap-python.sh && contrib/bootstrap-python.sh
```

See the [fabric-jumpstart contributing guide](src/fabric_jumpstart/CONTRIBUTING.md) for full details.

## Full Setup — Website + Python (CI / web contributors)

Only needed if you're working on the [website](src/fabric_jumpstart_web/) or running the full CI pipeline locally. This installs Python, Node.js, and all dependencies for both projects.

See [contrib/README.md](contrib/README.md) for the bootstrap script used by CI.

### Full monorepo checks (same as CI)

```bash
npx nx run-many -t clean --output-style=stream
npx nx run-many -t build test --output-style=stream
npm run fail-on-untracked-files
```

## Commit and PR Conventions

- PRs must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) in the headline (e.g., `feat: add spark-monitoring jumpstart`).
- Use the [PR template](.github/pull_request_template.md) — include a brief rationale and note any user-facing impacts.
- Keep commits focused; avoid formatting-only churn.

## Standards

Please read [STANDARDS.md](src/fabric_jumpstart/STANDARDS.md) for Jumpstart design and quality expectations before opening a pull request.
