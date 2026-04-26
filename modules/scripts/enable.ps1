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
	$Fid = Get-FullId $Module
	Write-Host "Enabling $Fid"
	spicetify pkg install $Fid $Dir
	spicetify pkg enable $Fid
}
} finally {
	Pop-Location
}
