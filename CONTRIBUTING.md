# Contributing

Thank you for helping improve Fabric Jumpstart! This is a monorepo with two projects — most contributors only need the Python library.

| Project | Path | Contributing Guide |
|---------|------|--------------------|
| **fabric-jumpstart** (Python library + Jumpstarts) | `src/fabric_jumpstart/` | [Contributing to Fabric Jumpstart](src/fabric_jumpstart/CONTRIBUTING.md) |
| **fabric-jumpstart-web** (Website) | `src/fabric_jumpstart_web/` | [Contributing to the Website](src/fabric_jumpstart_web/CONTRIBUTING.md) |

> **Contributing a new Jumpstart?** Head to the [fabric-jumpstart contributing guide](src/fabric_jumpstart/CONTRIBUTING.md).

---

## Getting Started

1. **Open an issue first.** Before writing code, create an issue (or use the `New Jumpstart` template for jumpstarts) so maintainers can confirm the change fits the project's direction.
2. **Discuss larger changes** with maintainers via an issue or draft PR to align on scope before investing effort.
3. **Fork the repo** and create a feature branch from `main`.
4. **Set up your environment** by following the contributing guide for the project you're working on (linked above).

## Commit and PR Conventions

- PRs must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) in the headline (e.g., `feat: add spark-monitoring jumpstart`).
- Use the [PR template](.github/pull_request_template.md) — include a brief rationale and note any user-facing impacts.
- Keep commits focused; avoid formatting-only churn.

## Standards

Please read [STANDARDS.md](src/fabric_jumpstart/STANDARDS.md) for Jumpstart design and quality expectations before opening a pull request.
