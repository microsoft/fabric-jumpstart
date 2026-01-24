# Setup of a New Jumpstart
1. Request access to `Fabric Jumpstart Ops` Core Identity group with the `Reader` role.
2. Create an M365 Group for the Jumpstart owners (e.g., `fabricjumpstart.spark-monitoring`).
3. Create a public GitHub repo in the Microsoft org with that M365 group as the owner (qualifies as a small code contribution; no approval needed).
4. Create a Fabric Workspace named `jumpstart.spark-monitoring` and connect it to your GitHub repo (use a PAT with Content permissions).
5. Make the M365 group the admin of the Fabric Workspace.
6. Populate the workspace with all items the Jumpstart should deploy.
   - Items must be in a top-level folder named after the jumpstart (e.g., `spark-monitoring`).
   - Fabric items must not contain a solution prefix; Jumpstart adds a prefix at deployment (e.g., `js1_sm__`) so multiple Jumpstarts can coexist.
   - Do **not** use spaces in item names.
7. Commit items to the repo.
8. Fork the fabric-jumpstart repo.
9. Add an entry in `registry.yml` for your Jumpstart and submit a PR.
