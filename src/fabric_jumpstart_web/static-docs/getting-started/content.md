# Getting Started with Fabric Jumpstart

This tutorial walks you through the prerequisites for deploying and running a jumpstart in Microsoft Fabric. By the end, you'll have a workspace ready, a notebook open, and the `fabric-jumpstart` library installed.

## Prerequisites

Before you begin, make sure you have:

- A [Microsoft Fabric](https://www.microsoft.com/en-us/microsoft-fabric) account with an active subscription or trial
- A Fabric capacity (F2 or higher) or a Fabric trial capacity
- Permissions to create workspaces and items in your Fabric tenant


## Step 1: Create a Fabric Workspace

A workspace is the container where all your Fabric items (lakehouses, notebooks, pipelines, etc.) live. Each jumpstart is deployed into its own workspace.

1. Go to [Microsoft Fabric](https://app.fabric.microsoft.com/)
2. In the left navigation pane, select **Workspaces**
3. Select **+ New workspace**
4. Enter a name for your workspace (e.g., `my-jumpstart-workspace`)
5. Expand **Advanced** and make sure your workspace is assigned to a Fabric capacity (or trial capacity)
6. Select **Apply**

> **Tip:** Use a dedicated workspace for each jumpstart to make management and cleanup easier. If you need to install multiple jumpstarts in the same workspace, set a unique prefix for each one, for example: `jumpstart.install("demo", item_prefix="demo_")`.

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

To deploy a jumpstart into your workspace, use the `install` function with the jumpstart's logical ID:

```python
import fabric_jumpstart as jumpstart

# Install a jumpstart by its logical ID
jumpstart.install("healthcare-billing-system")
```

The installer will:

1. Download all required Fabric items (notebooks, lakehouses, pipelines, etc.)
2. Deploy them into your current workspace
3. Display a progress bar and status updates
4. Provide a summary of what was installed

> **Note:** Some jumpstarts may take a few minutes to fully deploy depending on the number of items and their sizes.

## Next Steps

After installing a jumpstart, follow the instructions provided in the jumpstart's entry-point notebook. Each jumpstart includes step-by-step guidance on how to run and explore the scenario.