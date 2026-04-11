#!/usr/bin/env pwsh

[CmdletBinding()]
param (
	[string]$Url = "https://raw.githubusercontent.com/spicetify/classmaps/main/1020045/classmap-191b119b48e.json",
	[string]$Output = "classmap.json",
	[string]$ModulesDir = "modules"
)

$ModuleRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ModuleRoot
try {

. "$PSScriptRoot\Resolve-BuildTool.ps1"
$BuildTool = Get-BuildToolPath

& $BuildTool classmap-fetch --url "$Url" --output "$Output" --modules-dir "$ModulesDir"
} finally {
	Pop-Location
}
