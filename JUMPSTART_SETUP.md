# Setup of a New Jumpstart
1.  Request access to `Fabric Jumpstart Ops` Core Identity group with the `Reader` role.
1.  Create M365 Group for those who own the Jumpstart named as `fabricjumpstart.spark-rti-monitoring`
1.  Create public GitHub repo in Microsoft org with M365 Group as the owner of the repo (qualifies as small code contribution, no approval needed)
1.  Create MSIT Workspace named `jumpstart.spark-rti-monitoring` and connect it to your GitHub repo (use a PAT with Content permissions on that repo)
1.  Make the M365 group the admin of the Fabric Workspace
1.  Populate the workspace with all Items that Jumpstart should deploy
    - The Items must be in a top level folder in the root of the workspace with the same ID as the jumpstart (i.e. `spark-rti-monitoring`)
    - Fabric Items must be prefixed with your Jumpstart short identifier (i.e. `srm_`). _This enables multiple Jumpstarts to be deployed in the same workspace without naming conflict_
1.  Commit Items to repo
1.  Fork fabric-jumpstart repo
1.  Create entry in `registry.yml` with the details of your Jumpstart and submit a PR





# TODO:
- Process for OSS contributions