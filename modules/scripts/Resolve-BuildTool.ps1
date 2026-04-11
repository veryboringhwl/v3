#!/usr/bin/env pwsh

function Get-BuildToolPath {
	param (
		[switch]$ForceRebuild
	)

	$manifestPath = "./build/Cargo.toml"
	$releasePath = Join-Path (Get-Location) "build/target/release/spicetify-build.exe"
	$binDir = Join-Path (Get-Location) "build/bin"
	$binPath = Join-Path $binDir "spicetify-build.exe"
	$srcDir = Join-Path (Get-Location) "build/src"

	$needsBuild = $ForceRebuild -or -not (Test-Path $releasePath)
	if (-not $needsBuild) {
		$releaseTime = (Get-Item $releasePath).LastWriteTimeUtc
		$manifestTime = (Get-Item $manifestPath).LastWriteTimeUtc
		if ($manifestTime -gt $releaseTime) {
			$needsBuild = $true
		} elseif (Test-Path $srcDir) {
			$latestSrc = Get-ChildItem -Path $srcDir -Recurse -File | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
			if ($latestSrc -and $latestSrc.LastWriteTimeUtc -gt $releaseTime) {
				$needsBuild = $true
			}
		}
	}

	if ($needsBuild) {
		Write-Host "Building release build tool..."
		& cargo build --release --manifest-path $manifestPath
		if ($LASTEXITCODE -ne 0) {
			throw "Failed to build release build tool"
		}
	}

	if (-not (Test-Path $binDir)) {
		New-Item -ItemType Directory -Path $binDir | Out-Null
	}

	if (
		$ForceRebuild -or
		-not (Test-Path $binPath) -or
		((Get-Item $releasePath).LastWriteTimeUtc -gt (Get-Item $binPath).LastWriteTimeUtc)
	) {
		try {
			Copy-Item -Path $releasePath -Destination $binPath -Force -ErrorAction Stop
		} catch {
			Write-Host "Warning: build/bin tool is locked; using release binary directly for this run."
			return $releasePath
		}
	}

	return $binPath
}
