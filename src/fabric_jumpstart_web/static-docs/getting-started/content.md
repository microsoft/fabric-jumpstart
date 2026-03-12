# Getting Started with Fabric Jumpstart

This tutorial walks you through the prerequisites for deploying and running a jumpstart in Microsoft Fabric. By the end, you'll have a workspace ready, a notebook open, and the `fabric-jumpstart` library installed.

## Prerequisites

Before you begin, make sure you have:

- Admin, Member, or Contributor permissions on an existing workspace, or the ability to create a new workspace
- A Fabric-enabled capacity (P or F) or Fabric trial capacity assigned to the workspace

## Step 1: Select a Fabric Workspace

A workspace is the container for all Fabric items. Each jumpstart will deploys into a single workspace. If a `workspace_id` is not specified at runtime, it will deploy into the current workspace.

_If you do not have an existing workspace:_
1. Go to [Microsoft Fabric](https://app.fabric.microsoft.com/)
2. In the left navigation pane, select **Workspaces**
3. Select **+ New workspace**
4. Enter a name for your workspace (e.g., `my-jumpstart-workspace`)
5. Expand **Advanced** and make sure your workspace is assigned to a Fabric-enabled capacity
6. Select **Apply**

> **Tip:** Multiple jumpstarts can be deployed in a single workspace. If items with the same name exist across jumpstarts (or items already existing in your workspace), the installer will detect the conflict and let you choose how to resolve it:
>
> - **Use a dedicated workspace** — deploy each jumpstart in its own workspace to avoid conflicts entirely
> - **Automatic prefix** — let the installer automatically prefix items to avoid name collisions
> - **Custom prefix** — set your own prefix, e.g. `jumpstart.install("demo", item_prefix="demo_")`
> - **Upgrade** — overwrite existing items with conflicting names
>
> See [Handling Name Conflicts](https://github.com/microsoft/fabric-jumpstart/tree/main/src/fabric_jumpstart#handling-name-conflicts) for more details.

## Step 2: Create a Notebook

Notebooks are the primary interface for installing and interacting with jumpstarts. You'll use a notebook to run the installation commands and follow along with the jumpstart's guided experience.

1. Inside your workspace, select **+ New item**
2. Choose **Notebook**
3. Give the notebook a name (e.g., `jumpstart-setup`) and click **Create**
4. The notebook will open in the Fabric notebook editor

## Step 3: Install the fabric-jumpstart Library

The `fabric-jumpstart` Python library lets you browse, install, and manage jumpstarts directly from a Fabric notebook.

In the first cell of your notebook, run the following command to install the library:

```python
%pip install -q fabric-jumpstart
```

The `-q` flag runs the installation quietly, reducing output noise. After the cell finishes executing, the library is ready to use.

## Step 4: Browse Available Jumpstarts

Once the library is installed, you can explore the catalog of available jumpstarts:

```python
import fabric_jumpstart as jumpstart

# List all available jumpstarts
jumpstart.list()
```

This displays an interactive catalog of all available jumpstarts with descriptions, tags, and deployment details.

## Step 5: Install a Jumpstart

Each jumpstart in the catalog includes a ready-to-use install command — just click the copy button and paste it into a notebook cell. For example:

```python
# Install a jumpstart by its logical ID
jumpstart.install("healthcare-billing-system")
```

The installer will:

1. Deploy Fabric items (notebooks, lakehouses, pipelines, etc.) into your current workspace
1. Display progress and log messages
1. Provide a summary of what was installed

> **Note:** Each jumpstart provides an estimated install time. Deployment duration varies based on the number of items, item types, and their sizes.

## Next Steps

After installing a jumpstart, follow the "Get Started" link provided when the jumpstart installation is complete. This link will take you either to a Notebook or Jumpstart documentation page with step-by-step guidance on how to run and explore the scenario.