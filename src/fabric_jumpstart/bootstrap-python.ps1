<#
.SYNOPSIS
  Bootstraps the Python development environment on Windows (no WSL required).
  Use this if you're contributing to the Python library or adding a new Jumpstart.

.NOTES
  - Installs uv (Python package manager) if not already present
  - Installs the Ruff VS Code extension for linting
  - Syncs the Python virtual environment
#>

$ErrorActionPreference = "Stop"

$RepoRoot = git rev-parse --show-toplevel
$ProjectDir = Join-Path $RepoRoot "src" "fabric_jumpstart"

# ---------- uv ----------
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "Installing uv..."
    irm https://astral.sh/uv/install.ps1 | iex
}

# ---------- Ruff VS Code extension ----------
if (Get-Command code -ErrorAction SilentlyContinue) {
    $installed = code --list-extensions 2>$null
    if ($installed -and ($installed -notcontains "charliermarsh.ruff")) {
        Write-Host "Installing Ruff VS Code extension..."
        code --install-extension charliermarsh.ruff
    }
    if ($installed -and ($installed -notcontains "ms-python.python")) {
        Write-Host "Installing Python VS Code extension..."
        code --install-extension ms-python.python
    }
    if ($installed -and ($installed -notcontains "ms-python.vscode-pylance")) {
        Write-Host "Installing Pylance VS Code extension..."
        code --install-extension ms-python.vscode-pylance
    }
    if ($installed -and ($installed -notcontains "ms-toolsai.jupyter")) {
        Write-Host "Installing Jupyter VS Code extension..."
        code --install-extension ms-toolsai.jupyter
    }
}

# ---------- Python dependencies ----------
Set-Location $ProjectDir
uv sync --all-groups

Write-Host ""
Write-Host "✅ Python environment ready"
Write-Host "   Project: $ProjectDir"
Write-Host "   uv: $(uv --version)"