param(
  [switch]$Quiet,
  [ValidateSet("Premiere", "AfterEffects")]
  [string]$ConnectorHost = "Premiere"
)

$ErrorActionPreference = "Stop"

$cepRoot = Join-Path $env:APPDATA "Adobe\CEP\extensions"
$isAfterEffects = $ConnectorHost -eq "AfterEffects"
$pluginDestination = Join-Path $cepRoot $(if ($isAfterEffects) { "MCPAfterEffectsBridgeCEP" } else { "MCPBridgeCEP" })
$resolvedCepRoot = [System.IO.Path]::GetFullPath($cepRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar)
$resolvedDestination = [System.IO.Path]::GetFullPath($pluginDestination)

if (-not $resolvedDestination.StartsWith($resolvedCepRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to uninstall outside the CEP extensions directory: $resolvedDestination"
}

$hostProcess = Get-Process -Name $(if ($isAfterEffects) { "AfterFX" } else { "Adobe Premiere Pro" }) -ErrorAction SilentlyContinue
if ($hostProcess) {
  throw "$(if ($isAfterEffects) { 'After Effects' } else { 'Premiere Pro' }) is running. Fully quit it before removing the Connector."
}

if (Test-Path -LiteralPath $resolvedDestination) {
  Remove-Item -LiteralPath $resolvedDestination -Recurse -Force
  if (-not $Quiet) {
    Write-Host "Removed the $(if ($isAfterEffects) { 'After Effects' } else { 'Premiere' }) MCP Connector from $pluginDestination"
  }
}
elseif (-not $Quiet) {
  Write-Host "The $(if ($isAfterEffects) { 'After Effects' } else { 'Premiere' }) MCP Connector is not installed for this Windows user."
}

# --- SEC FORK: revoke the PlayerDebugMode keys the fork installer may have created ---
# Default ON. Set PREMIERE_MCP_SEC_REVOKE_DEBUG_MODE=0 to keep them for other unsigned
# CEP extensions (original upstream behavior).
$secRevokeDebugMode = @("0","false","off") -notcontains ([string]$env:PREMIERE_MCP_SEC_REVOKE_DEBUG_MODE).ToLower()
if ($secRevokeDebugMode) {
  $revokedKeys = @()
  foreach ($version in 9..14) {
    $key = "HKCU:\SOFTWARE\Adobe\CSXS.$version"
    $existing = Get-ItemProperty -Path $key -Name "PlayerDebugMode" -ErrorAction SilentlyContinue
    if ($null -ne $existing) {
      Remove-ItemProperty -Path $key -Name "PlayerDebugMode" -ErrorAction SilentlyContinue
      $revokedKeys += "CSXS.$version"
    }
  }
  if (-not $Quiet) {
    if ($revokedKeys.Count -gt 0) {
      Write-Host "SEC FORK: revoked PlayerDebugMode in: $($revokedKeys -join ', ')"
    }
    else {
      Write-Host "SEC FORK: no PlayerDebugMode values found to revoke."
    }
  }
}

if (-not $Quiet) {
  if (-not $secRevokeDebugMode) {
    Write-Host "CEP PlayerDebugMode settings were left unchanged because they can be used by other CEP extensions."
  }
  Write-Host "This removes only the selected connector. Remove the MCP server from your AI client's configuration separately if you no longer use it."
}
