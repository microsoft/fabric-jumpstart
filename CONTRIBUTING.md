# Contributing

Thank you for helping improve Fabric Jumpstart! This is a monorepo with two projects — read the shared guidance below, then follow the contributing guide for the project you're working on.

| Project | Path | Contributing Guide |
|---------|------|--------------------|
| **fabric-jumpstart** (Python library) | `src/fabric_jumpstart/` | [Contributing to the Python Library](src/fabric_jumpstart/CONTRIBUTING.md) |
| **fabric-jumpstart-web** (Website) | `src/fabric_jumpstart_web/` | [Contributing to the Website](src/fabric_jumpstart_web/CONTRIBUTING.md) |

> **Most contributions add a new Jumpstart** — that's a Python library change. Head to the [Python library contributing guide](src/fabric_jumpstart/CONTRIBUTING.md).

---

## Getting Started

1. **Open an issue first.** Before writing code, create an issue (or use the `New Jumpstart` template for jumpstarts) so maintainers can confirm the change fits the project's direction.
2. **Discuss larger changes** with maintainers via an issue or draft PR to align on scope before investing effort.
3. **Fork the repo** and create a feature branch from `main`.

## Commit and PR Conventions

- PRs must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) in the headline (e.g., `feat: add spark-monitoring jumpstart`).
- Use the [PR template](.github/pull_request_template.md) — include a brief rationale and note any user-facing impacts.
- Keep commits focused; avoid formatting-only churn.

## Full Environment Setup (both projects)

See [contrib/README.md](contrib/README.md) for the bootstrap script used by CI. This sets up both projects via [Nx](https://nx.dev/).

### Full monorepo checks (same as CI)

```bash
npx nx run-many -t clean --output-style=stream
npx nx run-many -t build test --output-style=stream
npm run fail-on-untracked-files
```

## Standards

Please read [STANDARDS.md](src/fabric_jumpstart/STANDARDS.md) for Jumpstart design and quality expectations before opening a pull request.
