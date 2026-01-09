import yaml

def set_workspace_in_yml(yml_path: str, workspace_name: str):
    """Update the workspace field in a demo YAML file."""
    with open(yml_path, 'r') as f:
        data = yaml.safe_load(f)
    # Modify workspace for core section
    data['core']['workspace'] = workspace_name
    with open(yml_path, 'w') as f:
        yaml.safe_dump(data, f, sort_keys=False)


def is_fabric_runtime() -> bool:
    """
    Check if code is running in a Microsoft Fabric runtime environment.
    
    Returns:
        bool: True if running in Fabric runtime, False otherwise
    """
    try:
        notebookutils = get_ipython().user_ns.get("notebookutils")  # noqa: F821
        if notebookutils and hasattr(notebookutils, 'runtime'):
            if hasattr(notebookutils.runtime, 'context'):
                return True
        return False           
    except:
        return False


def gen_fabric_token():
    """
    Generate a token credential for Fabric authentication when running in Fabric runtime.
    
    Returns:
        NotebookTokenCredential: Custom credential that uses notebookutils to get tokens
    """
    from azure.core.credentials import AccessToken, TokenCredential
    from datetime import datetime, timezone

    class NotebookTokenCredential(TokenCredential):
        """Custom credential that uses notebookutils to get tokens."""

        def __init__(self, audience='pbi'):
            self.audience = audience

        def get_token(self, *scopes, **kwargs):
            """Get token using notebookutils."""
            # Get notebookutils from global scope
            notebookutils = get_ipython().user_ns.get("notebookutils")  # noqa: F821
            if not notebookutils:
                raise RuntimeError("notebookutils not available. This function should only be called in Fabric runtime.")
            
            token_string = notebookutils.credentials.getToken(self.audience)

            # Return an AccessToken object
            # Set expiration far in the future since we don't have exact expiry info
            return AccessToken(token_string, int(datetime.now(timezone.utc).timestamp()) + 3600)

    return NotebookTokenCredential('pbi')