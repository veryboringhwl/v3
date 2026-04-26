#!/usr/bin/env pwsh

function Get-BuildToolPath {
	param (
		[switch]$ForceRebuild
	)

	$moduleRoot = Split-Path -Parent $PSScriptRoot
	$creatorRoot = Join-Path $moduleRoot "../creator"
	$manifestPath = Join-Path $creatorRoot "Cargo.toml"
	$releasePath = Join-Path $creatorRoot "target/release/creator.exe"
	$srcDir = Join-Path $creatorRoot "src"
	$templatesDir = Join-Path $creatorRoot "templates"

	if (-not (Test-Path $manifestPath)) {
		throw "Creator manifest not found at $manifestPath"
	}

	$needsBuild = $ForceRebuild -or -not (Test-Path $releasePath)
	if (-not $needsBuild) {
		$releaseTime = (Get-Item $releasePath).LastWriteTimeUtc
		$manifestTime = (Get-Item $manifestPath).LastWriteTimeUtc
		if ($manifestTime -gt $releaseTime) {
			$needsBuild = $true
		}

		if ((-not $needsBuild) -and (Test-Path $srcDir)) {
			$latestSrc = Get-ChildItem -Path $srcDir -Recurse -File | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
			if ($latestSrc -and $latestSrc.LastWriteTimeUtc -gt $releaseTime) {
				$needsBuild = $true
			}
		}

		if ((-not $needsBuild) -and (Test-Path $templatesDir)) {
			$latestTemplate = Get-ChildItem -Path $templatesDir -Recurse -File | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
			if ($latestTemplate -and $latestTemplate.LastWriteTimeUtc -gt $releaseTime) {
				$needsBuild = $true
			}
		}
	}

	if ($needsBuild) {
		Write-Host "Building creator tool..."
		& cargo build --release --manifest-path $manifestPath
		if ($LASTEXITCODE -ne 0) {
			throw "Failed to build creator tool"
		}
	}

	return $releasePath
}
