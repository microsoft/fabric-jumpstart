import os
import tempfile
import shutil
from pathlib import Path

from fabric_jumpstart.utils import download_file

SETUP_URL = (
    "https://github.com/microsoft/fabric-toolbox/raw/main/monitoring/fabric-spark-monitoring/setup/fabric-spark-monitoring-setup.ipynb"
)

def install(workspace_name: str, environment: str = "N/A", **kwargs):
    from fabric_cicd import FabricWorkspace, publish_all_items

    print("[spark_rti_monitoring] Preparing deployment folder...")
    with tempfile.TemporaryDirectory() as staging:
        nb_name = "fabric-spark-monitoring-setup.ipynb"
        local_nb = os.path.join(staging, nb_name)
        download_file(SETUP_URL, local_nb)

        print("[spark_rti_monitoring] Deploying notebook with FabricWorkspace and publish_all_items...")

        # Use relative path from the temp directory (which contains the notebook)
        repository_directory = staging
        item_type_in_scope = ["Notebook"]


        # Create the FabricWorkspace object
        target_workspace = FabricWorkspace(
            workspace_name=workspace_name,
            environment=environment,
            repository_directory=repository_directory,
            item_type_in_scope=item_type_in_scope
        )

        # Publish the notebook
        publish_all_items(target_workspace)

    print(f"[spark_rti_monitoring] Demo notebook deployed to workspace '{workspace_name}'. Go to Fabric and run it to finish setup.")