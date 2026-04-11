#!/usr/bin/env pwsh

[CmdletBinding()]
param (
	[Parameter(ValueFromRemainingArguments = $true)]
	[string[]]$Dirs,
	[string]$ClassmapUrl = "https://raw.githubusercontent.com/spicetify/classmaps/main/1020045/classmap-191b119b48e.json",
	[string]$OutputDir = "dist"
)

$ModuleRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ModuleRoot
try {

if ($Dirs.Count -eq 0) {
	$Dirs = Get-ChildItem -Directory modules
}


. "$PSScriptRoot\Resolve-BuildTool.ps1"
$BuildTool = Get-BuildToolPath

$ArgsList = @(
	"build-release",
	"--classmap-url",
	"$ClassmapUrl",
	"--output-dir",
	"$OutputDir"
) + $Dirs

& $BuildTool @ArgsList
} finally {
	Pop-Location
}
