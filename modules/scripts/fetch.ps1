#!/usr/bin/env pwsh

$ModuleRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ModuleRoot
try
{
  Write-Host "Fetching classmap..."
  & deno run -A jsr:@veryboringhwl/creator classmap-fetch --modules-dir modules --output classmap.json
} finally
{
  Pop-Location
}
