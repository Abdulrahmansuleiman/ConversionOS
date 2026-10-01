# Render the LaunchOps client roadmap master graphic to PNG.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File assets\roadmap\src\render.ps1
#
# Output: ../out/launchops-roadmap-master.png at $Scale x the design grid
#         (default 2 -> 4800 x 3040 from the 2400 x 1520 design grid).
#
# The viewport size is read straight out of roadmap.html, so editing the canvas
# dimensions in the HTML can never silently crop the output again.
#
# Uses system Chrome in headless mode. No network needed at render time,
# Inter is vendored in ../fonts/.
#
# NOTE: keep this file pure ASCII. Windows PowerShell 5.1 reads .ps1 files as
# ANSI unless they carry a UTF-8 BOM, so any em dash in a comment breaks parsing.
param(
  [int]$Scale = 2
)

$ErrorActionPreference = 'Stop'

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) { throw 'Chrome not found. Install Chrome or edit the $chrome paths below.' }

$src    = Join-Path $PSScriptRoot 'roadmap.html'
$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'out'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$out    = Join-Path $outDir 'launchops-roadmap-master.png'

# Canvas size comes from the "html, body { width: Npx; height: Npx }" rule.
$html = [IO.File]::ReadAllText($src)
$m = [regex]::Match($html, 'html,\s*body\s*\{\s*width:\s*(\d+)px;\s*height:\s*(\d+)px;')
if (-not $m.Success) { throw "Could not read canvas size from $src" }
$W = [int]$m.Groups[1].Value
$H = [int]$m.Groups[2].Value

Remove-Item $out -ErrorAction SilentlyContinue
$uri = ([Uri]$src).AbsoluteUri

# Chrome writes progress ("N bytes written to file") to stderr. Under
# ErrorActionPreference = Stop that would abort the script, so relax it for the
# Chrome call only and verify success by checking the output file exists.
$ErrorActionPreference = 'Continue'
& $chrome `
  --headless=new `
  --disable-gpu `
  --hide-scrollbars `
  --allow-file-access-from-files `
  --force-color-profile=srgb `
  --force-device-scale-factor=$Scale `
  --virtual-time-budget=6000 `
  --window-size="$W,$H" `
  --screenshot="$out" `
  "$uri" 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $out)) { throw "Render failed - no PNG at $out" }

Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($out)
$gotW = $img.Width
$gotH = $img.Height
$img.Dispose()
$kb = [math]::Round((Get-Item $out).Length / 1KB, 1)

if ($gotW -ne ($W * $Scale) -or $gotH -ne ($H * $Scale)) {
  throw "Size mismatch: expected $($W * $Scale) x $($H * $Scale), got $gotW x $gotH"
}

Write-Output "OK  $out"
Write-Output "    design grid $W x $H  ->  ${gotW} x ${gotH} px  ($kb KB)"