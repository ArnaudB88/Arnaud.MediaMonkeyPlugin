# Build script for Arnaud.MediaMonkeyPlugin.GeniusLyrics

$pluginDir = Join-Path $PSScriptRoot "Arnaud.MediaMonkeyPlugin.GeniusLyrics"
$infoJsonPath = Join-Path $pluginDir "info.json"

# Read version from info.json
$info = Get-Content $infoJsonPath -Raw | ConvertFrom-Json
$version = $info.version

$outputFileName = "Arnaud.GeniusLyrics.v$version.mmip"
$outputPath = Join-Path $PSScriptRoot $outputFileName

# Items to include in the package (contents of the plugin folder, not the folder itself)
$itemsToZip = @(
	Join-Path $pluginDir "helpers"
	Join-Path $pluginDir "info.json"
)

# Remove existing output file if it exists
if (Test-Path $outputPath) {
	Remove-Item $outputPath -Force
}

# Create a temporary zip file, then rename to .mmip
$tempZip = [System.IO.Path]::ChangeExtension($outputPath, ".zip")

if (Test-Path $tempZip) {
	Remove-Item $tempZip -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($tempZip, 'Create')

foreach ($item in $itemsToZip) {
	if (Test-Path $item -PathType Leaf) {
		# It's a file - add directly to root of zip
		$entryName = Split-Path $item -Leaf
		[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $item, $entryName) | Out-Null
	} elseif (Test-Path $item -PathType Container) {
		# It's a folder - add all files recursively
		$folderName = Split-Path $item -Leaf
		$files = Get-ChildItem $item -Recurse -File
		foreach ($file in $files) {
			$relativePath = $file.FullName.Substring($item.Length).TrimStart('\', '/')
			$entryName = "$folderName/$relativePath".Replace('\', '/')
			[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName) | Out-Null
		}
	}
}

$zip.Dispose()

# Rename .zip to .mmip
Rename-Item $tempZip $outputPath

Write-Host "Build complete: $outputFileName"
