#!/usr/bin/env pwsh

[CmdletBinding()]
param (
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Dirs
)

$ModuleRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ModuleRoot
try
{

  if ($Dirs.Count -eq 0)
  {
    $Dirs = Get-ChildItem -Directory modules
  }

  $jobs = @()

  . "$PSScriptRoot\VARS.ps1"

  foreach ($Dir in $Dirs)
  {
    $Module = Split-Path -Leaf $Dir
    $Id = Get-Id $Module
    Write-Host "Building $Id"
    $jobs += Start-Process -FilePath "deno" -ArgumentList @("run", "-A", "jsr:@veryboringhwl/creator", "build", "--module", "$Id", "-i", "$Dir", "-o", "$Dir", "-c", "classmap.json") -NoNewWindow -PassThru
  }

  $jobs | Wait-Process

  Write-Host "Done"
} finally
{
  Pop-Location
}
