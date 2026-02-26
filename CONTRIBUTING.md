# Contributing

Thank you for helping improve Fabric Jumpstart! Please read and follow [STANDARDS.md](STANDARDS.md) before opening a pull request.

## New Jumpstart Workflow
- Create a `New Jumpstart` Issue with enough details to help maintainers determine whether the solution fits in the Fabric Jumpstart mission.
- Community contributions are more than welcome, but we do require a Microsoft sponsor for any Core Jumpstarts. This is someone who must have contributor level access to your project.
- Keep Jumpstarts self-contained: deployments must run through `jumpstart.install()` without manual patching.
- Follow the steps in [JUMPSTART_SETUP.md](JUMPSTART_SETUP.md) to get things set up, tested, and merged in.

## General Changes Workflow
- Discuss larger changes with maintainers first (issue or PR draft) to align on scope.

## Development Setup

### Windows users

1. Windows pre-reqs

   ```powershell
   winget install -e --id Microsoft.VisualStudioCode
   ```

2. Get a fresh new WSL machine up:

   > ⚠️ Warning: this removes your WSL machine and recreates it fresh.

   ```powershell
   $GIT_ROOT = git rev-parse --show-toplevel
   & "$GIT_ROOT\contrib\bootstrap-dev-env.ps1"
   ```

3. Clone the repo, and open VSCode in it:

   ```bash
   cd ~/
   
   read -p "Enter your name (e.g. 'FirstName LastName'): " user_name
   read -p "Enter your github email (e.g. 'your-github-alias@blah.com'): " user_email
   read -p "Enter the branch to switch to: (e.g. 'main') " branch_name
    
   git clone https://github.com/microsoft/fabric-jumpstart.git
   
   git config --global user.name "$user_name"
   git config --global user.email "$user_email"
   
   cd fabric-jumpstart/

   git pull origin
   git switch "$branch_name"
   code .
   ```

4. Run the bootstrapper script, that installs all tools idempotently:

   ```bash
   GIT_ROOT=$(git rev-parse --show-toplevel)
   chmod +x ${GIT_ROOT}/contrib/bootstrap-dev-env.sh && ${GIT_ROOT}/contrib/bootstrap-dev-env.sh
   ```

## Running the GCI Targets Locally

After bootstrapping, run the same checks that CI runs:

```bash
npx nx run-many -t build --output-style=stream
npx nx run-many -t test --output-style=stream
```

### Linux users

The steps above, minus WSL should work as-is.