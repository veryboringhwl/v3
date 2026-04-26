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

. "$PSScriptRoot\VARS.ps1"

foreach ($Dir in $Dirs) {
	$Module = Split-Path -Leaf $Dir
	$Id = Get-Id $Module
	$Fid = Get-FullId $Module
	Write-Host "Disabling $Fid"
	spicetify pkg disable $Id@
	spicetify pkg delete $Fid
}
} finally {
	Pop-Location
}
