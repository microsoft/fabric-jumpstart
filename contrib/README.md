# Bootstrap Scripts

Scripts to set up development environments. Each project's [contributing guide](../CONTRIBUTING.md) explains which to use.

| Script | Platform | Purpose |
|--------|----------|---------|
| `bootstrap-python.ps1` | Windows | Python library — installs uv, Ruff VS Code extension, syncs venv |
| `bootstrap-python.sh` | Linux / macOS / WSL | Python library — installs Python, uv, syncs venv |
| `bootstrap-web.sh` | Linux / macOS / WSL | Website — installs Node.js, npm dependencies |
| `bootstrap-all.sh` | Linux / macOS / WSL | Full monorepo — runs both Python and web bootstrappers |
| `bootstrap-dev-env.ps1` | Windows | Sets up a fresh WSL VM (required for website work on Windows) |

## WSL Setup (Windows — website or full monorepo)

Website and full monorepo work on Windows requires WSL.

1. Install VS Code:

   ```powershell
   winget install -e --id Microsoft.VisualStudioCode
   ```

1. Set up a fresh WSL machine. Open an **PowerShell 7** terminal elevated with **Administrator** permissions and run:

   > ⚠️ Warning: this removes your WSL dev box and recreates it fresh.

   ```powershell
   # update the below to be the full path or first `cd` to the root of the repo
   .\contrib\bootstrap-dev-env.ps1
   ```

1. Inside WSL, clone the repo and open VS Code:

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

1. Run the appropriate bootstrapper inside WSL (see table above).

## Running CI Checks Locally

After bootstrapping with `bootstrap-all.sh`:

```bash
npx nx run-many -t clean --output-style=stream
npx nx run-many -t build test --output-style=stream
npm run fail-on-untracked-files
```