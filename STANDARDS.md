# Core Standards
- Jumpstarts are mature and tested Fabric accelerators, demos, and tutorials.
- With limited exception, Jumpstarts must be complete solutions as deployed via `jumpstart.install(<jumpstart-id>)`. Unless currently impossible to completely automate, the entirety of the solution must be configured through the installation process.
    - Data must also be self-contained as part of what the Jumpstart deploys. Consider triggering data generators like `LakeGen` or public data sources.
    - Jumpstart will support deploying small data files, but the feature is not yet supported #19.
    - Jumpstart will support a pre/post deployment script concept, this feature is not yet supported #20.
- Jumpstarts do not automatically trigger Fabric Items (i.e. Pipelines, Notebooks, etc.) to run after installation. A Notebook with robust markdown instructions should be included in the installation that will reference any user actions.
    - Where Notebooks reference to do something with another Fabric Item, dynamic links should be used (use param replacement to generate dynamic link)

## Unlisted vs. Listed Jumpstarts
Jumpstarts with the `include_in_listing: False` config won't show up when listing Jumpstarts. These are _unlisted_, not meant for general discoverability. These Jumpstarts will adhere to the same rigor as listed Jumpstarts.

## Local vs. Remote Jumpstarts
- **Local** Jumpstarts that have source code contained within the this repo are only for initial testing. All production jumpstarts must be stored in a different public GitHub project.
- **Remote** Jumpstarts reside in a different GitHub Project. The source repository should be lightweight to avoid cloning a single branch taking more than a second or two.
    - Remote Jumpstarts must have a `repo_ref` that is a commit ID or ideally a tag version number (i.e. `v1.0.0`). Branch references will not be allowed so that code drift doesn't occur without a PR to the fabric-jumpstart repo to note the changes and allow for testing of the source code before the library distribution is updated.
    > Complex Jumpstarts should be self-contained in an isolated repository. Small Jumpstarts may be grouped into shared respositories, provided that the overall Project is small in size and has clear governance.

## Self-Documenting Source Code
Source code should be self-documenting where possible.
- Notebooks should self contain robust instructions via markdown. Do not reference instructions in Word documents OR in markdown files from source repositories.

## Jumpstart Ownership
- Each Jumpstart will be owned by a mail enabled security group (i.e. `fabricjumpstart.spark-structured-streaming@microsoft.com`).That group will have at least two owners.
- The group will be automatically notificed if the nightly Jumpstart CI build fails. The owners are expected to remediate any code changes ASAP as Jumpstarts with failing test cases (deployment or post-deployment solution validation) will automatically be excluded from what each new release published to PyPi to limit the possibility of users executing Jumpstarts that are known to be in a failing state.



