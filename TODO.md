- INSTALL: return jumpstart entry point on success (i.e. Notebook URL, Website link, etc.)
- visualize `items_in_scope`: can a graph be built to viz the resources that would be deployed?
- validate scenario and workload tags (needs to adhere to a known list)
- support workspace_name or id like semantic link?
- Deploy all jumpstarts to root folder in workspace? 
- Make `workspace` support ID or NAME
- add all Fabric Items within a folder to containerize the solution
- add user info about estimated deployment time
- Improve 

# Install Response
- the core.install method should return a status HTML to show the user that either the jumpstart installed successfully and what the next steps are (reference to `entry_point` - this should resolve to the URL for that item wherever it was deployed to or a URL if that was provided)
- the install method should accept kwargs, one of which would be unattended=True, if so, it will not return a rendered HTML, only a print message that it was installed
- if unsuccessful, it should return HTML with the error code(s) embedded.
- response should be formatted in the same sytle as the UI
- key things to return 
    - status
    - entry_point
    - minutes_to_complete_jumpstart


