#!/usr/bin/env pwsh

[CmdletBinding()]
param (
	[Parameter(ValueFromRemainingArguments = $true)]
	[string[]]$Dirs
)

$ModuleRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ModuleRoot
try {

if ($Dirs.Count -eq 0) {
	$Dirs = Get-ChildItem -Directory modules
}

$jobs = @()

$env:SPICETIFY_CONFIG_DIR = "$env:LOCALAPPDATA\spicetify\"

. "$PSScriptRoot\VARS.ps1"
. "$PSScriptRoot\Resolve-BuildTool.ps1"

$BuildTool = Get-BuildToolPath

foreach ($Dir in $Dirs) {
	$Module = Split-Path -Leaf $Dir
	$Id = Get-Id $Module
	Write-Host "Watching $Id"
	$jobs += Start-Process -FilePath $BuildTool -ArgumentList "--module `"$Id`" -i `"$Dir`" -o `"$Dir`" -c classmap.json -b -w --debounce 1000 --dev" -NoNewWindow -PassThru
}

$jobs | Wait-Process

Write-Host "Done"
} finally {
	Pop-Location
}
