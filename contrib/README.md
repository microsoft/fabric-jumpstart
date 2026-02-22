# Contributing

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

1. Run the bootstrapper script, that installs all tools idempotently:

   ```bash
   GIT_ROOT=$(git rev-parse --show-toplevel)
   chmod +x ${GIT_ROOT}/contrib/bootstrap-dev-env.sh && ${GIT_ROOT}/contrib/bootstrap-dev-env.sh
   ```