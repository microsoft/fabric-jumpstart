<!-- PROJECT LOGO -->
<p align="center">
  <h1 align="center">⚡️ Fabric Jumpstart</h1>
  <p align="center">
    Ready-to-run accelerators, demos, and tutorials for <a href="https://www.microsoft.com/en-us/microsoft-fabric">Microsoft Fabric</a> — automated, high-quality, and open-source.
    <br />
    <br />
    <a href="https://pypi.org/project/fabric-jumpstart/">PyPI Package</a>
    ·
    <a href="https://jumpstart.fabric.microsoft.com">Browse Jumpstarts</a>
    ·
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>
</p>

## What is a Jumpstart?

A **Jumpstart** is a curated, tested Microsoft Fabric solution — data, notebooks, pipelines, reports, and supporting assets — that you can deploy end-to-end with a single call. Each Jumpstart is self-contained: data is bundled or generated for you, and post-install notebooks guide any manual configuration.

## Projects

| Project                                       | Description                                                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fabric-jumpstart**](src/fabric_jumpstart/) | Core Python library — discover, install, and manage Jumpstarts in your Fabric workspace. Published to [PyPI](https://pypi.org/project/fabric-jumpstart/). |

## Quick Start

```bash
pip install fabric-jumpstart
```

```python
import fabric_jumpstart as jumpstart

# Browse the catalog
jumpstart.list()

# Deploy to your workspace
jumpstart.install("spark-structured-streaming")
```

See the [fabric-jumpstart README](src/fabric_jumpstart/README.md) for full usage, conflict handling, and API details.

## Contributing

Please follow the contribution process in [CONTRIBUTING.md](CONTRIBUTING.md) and the coding expectations in [STANDARDS.md](STANDARDS.md).

## Learn More

- **Browse Jumpstarts**: https://jumpstart.fabric.microsoft.com
- **PyPI**: https://pypi.org/project/fabric-jumpstart/
- **fabric-cicd**: https://microsoft.github.io/fabric-cicd/latest/