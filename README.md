# ⚡️Fabric Jumpstart

Fabric Jumpstart accelerates Microsoft Fabric adoption with ready-to-run accelerators, demos, and tutorials that install directly into your workspace in minutes via [fabric-cicd](https://microsoft.github.io/fabric-cicd/latest/).

## What is a Jumpstart?
- A curated, tested Fabric solution (data, notebooks, pipelines, reports, supporting assets, etc.) that you can deploy end-to-end with one call.
- Each Jumpstart is self-contained: data is bundled or generated for you, and post-install notebooks guide any manual configuration.
- Discover available Jumpstarts at https://fabric.jumpstart.microsoft.com ( ⚠️ UNDER CONSTRUCTION ⚠️ ).

## Install the Library
Requirements: Python 3.10–3.12 and access to a Microsoft Fabric workspace.

```bash
pip install fabric-jumpstart
```

## List and Install a Jumpstart
Run inside a Fabric notebook (or any Python environment with Fabric credentials):

```python
import fabric_jumpstart as jumpstart

jumpstart.list()  # renders an interactive catalog

# Copy the install command from the catalog, past in another cell and run!
jumpstart.install("spark-structured-streaming")
```

Notes
- `workspace_id` is optional when you run in a Fabric notebook; it auto-detects the current workspace. Specify to deploy to another target workspace.
- `install()` accepts extras like `item_prefix` and `unattended=True` if you prefer console logs over HTML output.

## Contributing
Please follow the contribution process in [CONTRIBUTING.md](CONTRIBUTING.md) and the coding expectations in [STANDARDS.md](STANDARDS.md).

## Learn More
- Explore jumpstarts and documentation: https://fabric.jumpstart.microsoft.com
- Package metadata and source code live in this repository under `src/fabric_jumpstart/`.