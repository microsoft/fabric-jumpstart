# Contributing

## Bootstrap Scripts

There are three bootstrap scripts depending on what you're working on:

| Script | Use When | Installs |
|--------|----------|----------|
| `bootstrap-python.sh` | Adding a Jumpstart or working on the Python library | Python, uv |
| `bootstrap-web.sh` | Working on the website | Node.js, npm |
| `bootstrap-all.sh` | Running full CI locally, or working on both projects | Everything |

### Contributing a Jumpstart or Python Library development

If you're adding a Jumpstart or working on the Python library — no Node.js required.

```bash
GIT_ROOT=$(git rev-parse --show-toplevel)
chmod +x ${GIT_ROOT}/contrib/bootstrap-python.sh && ${GIT_ROOT}/contrib/bootstrap-python.sh
```

Or skip the script entirely and set up manually:

```bash
cd src/fabric_jumpstart && uv sync
```

### Website Only

If you're only working on the website — no Python required.

```bash
GIT_ROOT=$(git rev-parse --show-toplevel)
chmod +x ${GIT_ROOT}/contrib/bootstrap-web.sh && ${GIT_ROOT}/contrib/bootstrap-web.sh
```

### Full Monorepo (CI)

Sets up both Python and web environments. Used by CI.

```bash
GIT_ROOT=$(git rev-parse --show-toplevel)
chmod +x ${GIT_ROOT}/contrib/bootstrap-all.sh && ${GIT_ROOT}/contrib/bootstrap-all.sh
```

## How to use, on a Windows machine by installing WSL

1. Windows pre-reqs

   ```powershell
   winget install -e --id Microsoft.VisualStudioCode
   ```

1. Get a fresh new WSL machine up:

   > ⚠️ Warning: this removes your WSL machine and recreates it fresh.

   ```powershell
   $GIT_ROOT = git rev-parse --show-toplevel
   & "$GIT_ROOT\contrib\bootstrap-dev-env.ps1"
   ```

1. Clone the repo, and open VSCode in it:

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

1. Run the bootstrapper script for your use case:

   ```bash
   GIT_ROOT=$(git rev-parse --show-toplevel)

   # Python library only (most contributors):
   chmod +x ${GIT_ROOT}/contrib/bootstrap-python.sh && ${GIT_ROOT}/contrib/bootstrap-python.sh

   # Website only:
   chmod +x ${GIT_ROOT}/contrib/bootstrap-web.sh && ${GIT_ROOT}/contrib/bootstrap-web.sh

   # Full monorepo (CI):
   chmod +x ${GIT_ROOT}/contrib/bootstrap-all.sh && ${GIT_ROOT}/contrib/bootstrap-all.sh
   ```

## Running the GCI Targets Locally

After bootstrapping with the **full** script (`bootstrap-all.sh`), run the same checks that CI runs:

```bash
npx nx run-many -t clean --output-style=stream
npx nx run-many -t build test --output-style=stream
npm run fail-on-untracked-files
```