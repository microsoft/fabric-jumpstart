<#

.SYNOPSIS
  Bootstraps a Windows machine with WSL pre-reqs.

.NOTES

  - The script recreates a WSL2 machine every time it is run to remove residual state,
    similar to a GitHub CI machine.

#>

#Requires -RunAsAdministrator

if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Error "This script requires PowerShell 7+. You are running PowerShell $($PSVersionTable.PSVersion).`nTo launch PowerShell 7 as Administrator:`n  Start Menu > search 'pwsh' > right-click 'PowerShell 7' > 'Run as administrator'"
    exit 1
}

if (wsl -l -q | Select-String -SimpleMatch "Ubuntu-24.04") {
    Write-Host "Unregistering Ubuntu-24.04"
    wsl --unregister Ubuntu-24.04
}

$memGB=[math]::Floor((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB)
$cpu=[Environment]::ProcessorCount
$swap=[math]::Floor($memGB/4)
@"
[wsl2]
memory=${memGB}GB
processors=$cpu
swap=${swap}GB
networkingMode=NAT
"@ | Set-Content -Path "$env:USERPROFILE\.wslconfig"

Write-Host "Restarting WSL to apply settings"
wsl --shutdown

winget install -e --id Microsoft.GitCredentialManagerCore

Write-Host "Installing Ubuntu-24.04"
wsl --install -d Ubuntu-24.04

code --install-extension ms-vscode-remote.remote-wsl