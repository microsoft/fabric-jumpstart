- HTML of catalog to render when jumpstart.list() is called
- HTML: filter by scenario or workload
- HTML: render Jumpstart with NEW icon if date_added is within X days (i.e. 30 days)
- HTML: sort Jumpstarts by NEW first
- visualize `items_in_scope`: can a graph be built to viz the resources that would be deployed?
- validate scenario and workload tags (needs to adhere to a known list)
- unit test to validate schema and fail if schema is wrong
- support workspace_name or id like semantic link?
- Deploy all jumpstarts to root folder in workspace? 
- Make `workspace` support ID or NAME


# Discuss with Anu
- uv
- Registry Structure
- Unlisted Jumpstarts (need to adhere to same quality, not listed because of being scoped for specific purposes... i.e. Analytics Roadshow Lab)
- Local vs Remote Jumpstarts
- YAML Schema Validation -> any point in filtering registry from list if unit tests are validating (probably not)
    - if NOT, pydantic moves to `test` dependency group and validate schema moves to test module
- IF ran w/in Fabric Notebook, not specifying a `workspace` will deploy within the current workspace



# Key process things
- dynamic links