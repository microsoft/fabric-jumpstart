import requests
import yaml

def download_file(url: str, dest: str):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

def set_workspace_in_yml(yml_path: str, workspace_name: str):
    import yaml
    with open(yml_path, 'r') as f:
        data = yaml.safe_load(f)
    # Modify workspace for core section
    data['core']['workspace'] = workspace_name
    with open(yml_path, 'w') as f:
        yaml.safe_dump(data, f, sort_keys=False)

        