# fabric-jumpstart

A simple, extensible public-facing Python package for provisioning Microsoft Fabric demo artifacts, using the [`fabric-cicd`](https://github.com/microsoft/fabric-cicd) library!

## Usage

```python
import fabric_jumpstart

# Browse available demos
fabric_jumpstart.library()

# Install a demo into your Fabric workspace (YAML driven)
fabric_jumpstart.install(name="spark-rti-monitoring", workspace_name="YourWorkspaceName")
```

## Add your own demos

- Define a `*.yml` deployment spec in `fabric_jumpstart/yml_templates/`
- Add an entry in `registry.py` and a new Python handler if needed.

## Requirements

- Python 3.8+
- `pip install fabric-jumpstart`
- Fabric workspace access/config