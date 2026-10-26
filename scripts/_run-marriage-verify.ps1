$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $root ".tmp-marriage-verify.log"
Set-Location $root
"" | Set-Content $log
function Run-Step($name, $cmd) {
  Add-Content $log "=== $name ==="
  & cmd.exe /c $cmd 2>&1 | Tee-Object -FilePath $log -Append
  $code = $LASTEXITCODE
  Add-Content $log "EXIT:$code"
  return $code
}
$codes = @{}
$codes["curriculum"] = Run-Step "curriculum" "npm.cmd run test:marriage:curriculum"
$codes["couple-homework-hub"] = Run-Step "couple-homework-hub" "npm.cmd run test:marriage:couple-homework-hub"
$codes["explicit-consent"] = Run-Step "explicit-consent" "npm.cmd run test:marriage:explicit-consent"
$codes["homework-waiting-partner"] = Run-Step "homework-waiting-partner" "npm.cmd run test:marriage:homework-waiting-partner"
$codes["notifications"] = Run-Step "notifications" "npm.cmd run test:marriage:notifications"
$codes["hub-partner-gate"] = Run-Step "hub-partner-gate" "npm.cmd run test:marriage:hub-partner-gate"
$codes["partner-notifications"] = Run-Step "partner-notifications" "npm.cmd run test:marriage:partner-notifications"
$codes["build"] = Run-Step "build" "npm.cmd run build"
Add-Content $log "=== SUMMARY ==="
$codes.GetEnumerator() | Sort-Object Name | ForEach-Object { Add-Content $log "$($_.Key)=$($_.Value)" }
