import tempfile
import subprocess
import os

def install(workspace_id: str, **kwargs):
    from fabric_cicd import FabricWorkspace, publish_all_items, append_feature_flag, change_log_level
    from ..utils import is_fabric_runtime, gen_fabric_token

    print(f"[fabric-jumpstart] Installing 'Spark Monitoring Excellence' demo.")
    
    # Enable advanced features for comprehensive deployment
    append_feature_flag("enable_lakehouse_unpublish")
    
    # Optionally enable debug logging
    # change_log_level('DEBUG')
    
    try:
        # Create a temporary directory
        temp_dir = tempfile.mkdtemp(prefix="rti_spark_monitoring_")
        print(f"[DEBUG] Created temporary directory: {temp_dir}")

        # Clone the repository
        repo_url = "https://github.com/anumicrosoftlab/rti-spark-monitoring-artifacts.git"
        branch_name = "main"

        print(f"[DEBUG] Cloning {repo_url} (branch: {branch_name})...")
        result = subprocess.run(
            ["git", "clone", "--branch", branch_name, "--single-branch", repo_url, temp_dir],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to clone repository: {result.stderr}")
        
        print(f"✅ Successfully cloned repository to: {temp_dir}")
        repository_directory = temp_dir
        
        # Define all artifact types to deploy (excluding Eventhouse due to empty definition)
        item_type_in_scope = [
            "Notebook", 
            # "Eventhouse",  # Excluded due to empty EventhouseProperties.json causing deployment error
            "KQLDashboard",
            "KQLDatabase",
            "KQLQueryset",
            "DataPipeline",
            "Eventstream",
            "Report",
            "SemanticModel"
        ]
        
        # Initialize the FabricWorkspace object with the required parameters
        target_workspace = FabricWorkspace(
            workspace_id=workspace_id,
            repository_directory=repository_directory,
            item_type_in_scope=item_type_in_scope
        )
        
        # Publish all items defined in item_type_in_scope
        result = publish_all_items(target_workspace)
        
        if result:
            print(f"[spark_rti_monitoring] ✅ All demo artifacts deployed to workspace ID: {workspace_id}")
            return True
        else:
            print(f"[spark_rti_monitoring] ❌ Failed to deploy artifacts to workspace ID: {workspace_id}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Failed to deploy to Fabric workspace: {e}")
        return False
    finally:
        # Clean up temporary directory
        try:
            import shutil
            if 'temp_dir' in locals() and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                print(f"[DEBUG] Cleaned up temporary directory: {temp_dir}")
        except Exception as cleanup_error:
            print(f"[WARNING] Failed to clean up temporary directory: {cleanup_error}")
            pass