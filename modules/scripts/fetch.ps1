#!/usr/bin/env pwsh

$ModuleRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ModuleRoot
try {
    . "$PSScriptRoot\Resolve-BuildTool.ps1"
    $BuildTool = Get-BuildToolPath

    Write-Host "Fetching classmap..."
    & $BuildTool classmap-fetch --modules-dir modules --output classmap.json
} finally {
    Pop-Location
}
