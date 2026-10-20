#Requires -Version 5.1
<#
.SYNOPSIS
  Set session DATABASE_URL / DIRECT_URL for local shanah_marriage_itest (Phase 3E).

.DESCRIPTION
  Prompts for the local postgres password, verifies with psql (same as run-local-marriage-itest.ps1),
  then sets encoded postgresql:// URIs. Does not write env files or print passwords/URLs.
#>
[CmdletBinding()]
param(
  [string] $User = "postgres",
  [switch] $RunVerify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RequiredHost = "127.0.0.1"
$RequiredPort = 5432
$RequiredDatabase = "shanah_marriage_itest"
$RepoRoot = Split-Path $PSScriptRoot -Parent

function Stop-Helper([string] $Message) {
  Write-Error $Message
  exit 1
}

function ConvertTo-PlainSecureString([Security.SecureString] $Secure) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Resolve-PsqlExecutable {
  $fromPath = Get-Command psql -ErrorAction SilentlyContinue
  if ($fromPath -and $fromPath.Source) { return $fromPath.Source }
  $candidate = Join-Path ${env:ProgramFiles} "PostgreSQL\18\bin\psql.exe"
  if (Test-Path -LiteralPath $candidate) { return (Resolve-Path -LiteralPath $candidate).Path }
  Stop-Helper "psql.exe not found (required for password preflight)."
}

function Build-LocalItestUri {
  param([string] $PgUser, [string] $PgPassword)
  $encodedUser = [Uri]::EscapeDataString($PgUser)
  $encodedPass = [Uri]::EscapeDataString($PgPassword)
  return "postgresql://${encodedUser}:${encodedPass}@${RequiredHost}:${RequiredPort}/${RequiredDatabase}"
}

Write-Host "Target: ${RequiredHost}:${RequiredPort} / ${RequiredDatabase}"
$typed = Read-Host "Type ${RequiredDatabase} to confirm"
if ($typed -ne $RequiredDatabase) { Stop-Helper "Confirmation failed." }

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$plainPassword = (ConvertTo-PlainSecureString $securePassword).Trim()
$securePassword.Dispose()
if ([string]::IsNullOrEmpty($plainPassword)) { Stop-Helper "Password cannot be empty." }

$psqlPath = Resolve-PsqlExecutable
$env:PGPASSWORD = $plainPassword
try {
  $dbName = & $psqlPath -h $RequiredHost -p $RequiredPort -U $User -d $RequiredDatabase -tAc "SELECT current_database();" 2>&1
  if ($LASTEXITCODE -ne 0) {
    Stop-Helper "psql preflight failed (exit $LASTEXITCODE). Fix the postgres password before setting DATABASE_URL."
  }
  if (($dbName | Out-String).Trim() -ne $RequiredDatabase) {
    Stop-Helper "psql connected to unexpected database."
  }
  Write-Host "psql preflight: PASS"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

$connectionUri = Build-LocalItestUri -PgUser $User -PgPassword $plainPassword
$plainPassword = $null

$env:DATABASE_URL = $connectionUri
$env:DIRECT_URL = $connectionUri
$env:MARRIAGE_PRISMA_ITEST = "1"
$connectionUri = $null

Write-Host "Session env set: DATABASE_URL, DIRECT_URL, MARRIAGE_PRISMA_ITEST (values not displayed)."

if ($RunVerify) {
  Push-Location $RepoRoot
  try {
    & npx.cmd tsx scripts/marriage-itest-pg-verify-connection.ts
    exit $LASTEXITCODE
  } finally {
    Pop-Location
  }
}

Write-Host "Run: npx.cmd tsx scripts/marriage-itest-pg-verify-connection.ts"
