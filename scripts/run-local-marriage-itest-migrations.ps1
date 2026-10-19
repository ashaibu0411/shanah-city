#Requires -Version 5.1
<#
.SYNOPSIS
  Fail-closed: apply Prisma migrations to local disposable DB shanah_marriage_itest only.

.DESCRIPTION
  Sets DATABASE_URL and DIRECT_URL explicitly, verifies the live PostgreSQL target,
  then runs `prisma migrate deploy` (no seed, no migrate dev, no db push).

  Does not modify .env files. prisma.config.ts may read .env / .env.local for keys
  that are unset; this script pre-populates DATABASE_URL and DIRECT_URL so those
  files cannot override the local itest target.

.PARAMETER User
  PostgreSQL role name (default: postgres).
#>
[CmdletBinding()]
param(
  [string] $User = "postgres"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RequiredHost = "127.0.0.1"
$RequiredPort = 5432
$RequiredDatabase = "shanah_marriage_itest"
$RepoRoot = Split-Path $PSScriptRoot -Parent

function Write-Step([string] $Message) {
  Write-Host $Message
}

function Stop-Runner([string] $Message) {
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

function Test-PostgresTargetUri {
  param(
    [string] $ConnectionUri,
    [string] $Label
  )

  if ($ConnectionUri -notmatch "^(postgres(ql)?://)") {
    Stop-Runner "${Label}: connection must use postgres:// or postgresql://"
  }

  $httpForm = $ConnectionUri -replace "^postgresql:", "http:" -replace "^postgres:", "http:"
  try {
    $uri = [Uri]$httpForm
  } catch {
    Stop-Runner "${Label}: connection URI is not valid"
  }

  $hostName = $uri.Host.ToLowerInvariant()
  if ($hostName -ne $RequiredHost) {
    Stop-Runner "${Label}: host must be ${RequiredHost} (got $($uri.Host))"
  }

  if ($uri.Port -ne $RequiredPort) {
    Stop-Runner "${Label}: port must be ${RequiredPort} (got $($uri.Port))"
  }

  $segments = $uri.AbsolutePath.Trim("/").Split("/", [StringSplitOptions]::RemoveEmptyEntries)
  if ($segments.Count -ne 1) {
    Stop-Runner "${Label}: pathname must be /${RequiredDatabase} only (got $($uri.AbsolutePath))"
  }

  $dbName = [Uri]::UnescapeDataString($segments[0])
  if ($dbName -ne $RequiredDatabase) {
    Stop-Runner "${Label}: database must be ${RequiredDatabase} (got ${dbName})"
  }

  $denyHostFragments = @(
    "neon.tech",
    "neon.database",
    "supabase.co",
    "amazonaws.com",
    "vercel",
    "pooler"
  )
  foreach ($frag in $denyHostFragments) {
    if ($hostName.Contains($frag)) {
      Stop-Runner "${Label}: remote/cloud host pattern rejected ($frag)"
    }
  }
}

function Build-LocalItestUri {
  param(
    [string] $PgUser,
    [string] $PgPassword
  )

  $encodedUser = [Uri]::EscapeDataString($PgUser)
  $encodedPass = [Uri]::EscapeDataString($PgPassword)
  return "postgresql://${encodedUser}:${encodedPass}@${RequiredHost}:${RequiredPort}/${RequiredDatabase}"
}

function Clear-SecretEnv {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue
  Remove-Item Env:DIRECT_DATABASE_URL -ErrorAction SilentlyContinue
}

function Resolve-PsqlExecutable {
  $fromPath = Get-Command psql -ErrorAction SilentlyContinue
  if ($fromPath -and $fromPath.Source) {
    return $fromPath.Source
  }

  $candidates = @(
    Join-Path ${env:ProgramFiles} "PostgreSQL\18\bin\psql.exe"
  )
  $pgRoot = Join-Path ${env:ProgramFiles} "PostgreSQL"
  if (Test-Path -LiteralPath $pgRoot) {
    $candidates += Get-ChildItem -LiteralPath $pgRoot -Directory -ErrorAction SilentlyContinue |
      ForEach-Object { Join-Path $_.FullName "bin\psql.exe" }
  }

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  Stop-Runner "psql.exe is required for preflight verification but was not found on PATH or under Program Files\PostgreSQL."
}

function Invoke-VerifyLiveTarget {
  param(
    [string] $PgUser,
    [string] $PgPassword,
    [string] $PsqlPath
  )

  $env:PGPASSWORD = $PgPassword
  try {
    $dbName = & $PsqlPath -h $RequiredHost -p $RequiredPort -U $PgUser -d $RequiredDatabase -tAc "SELECT current_database();" 2>&1
    if ($LASTEXITCODE -ne 0) {
      Stop-Runner "Preflight connection failed (exit $LASTEXITCODE). Check user, password, and that database ${RequiredDatabase} exists."
    }
    $dbName = ($dbName | Out-String).Trim()
    if ($dbName -ne $RequiredDatabase) {
      Stop-Runner "Preflight: connected database is '${dbName}', expected '${RequiredDatabase}'."
    }

    $serverAddr = & $PsqlPath -h $RequiredHost -p $RequiredPort -U $PgUser -d $RequiredDatabase -tAc "SELECT host(inet_server_addr());" 2>&1
    if ($LASTEXITCODE -ne 0) {
      Stop-Runner "Preflight server address check failed (exit $LASTEXITCODE)."
    }
    $serverAddr = ($serverAddr | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($serverAddr)) {
      Stop-Runner "Preflight: inet_server_addr() is NULL or empty; cannot verify local PostgreSQL endpoint."
    }
    if ($serverAddr -ne $RequiredHost) {
      Stop-Runner "Preflight: server endpoint is '${serverAddr}', expected exactly ${RequiredHost}."
    }

    Write-Step "Preflight OK: database=${RequiredDatabase}, host=${RequiredHost}, port=${RequiredPort}, psql=$PsqlPath"
  } finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}

function Set-MigrationTargetEnv {
  param([string] $ConnectionUri)

  Test-PostgresTargetUri -ConnectionUri $ConnectionUri -Label "DATABASE_URL"

  Remove-Item Env:DIRECT_DATABASE_URL -ErrorAction SilentlyContinue
  $env:DATABASE_URL = $ConnectionUri
  $env:DIRECT_URL = $ConnectionUri

  Test-PostgresTargetUri -ConnectionUri $env:DATABASE_URL -Label "DATABASE_URL (process)"
  Test-PostgresTargetUri -ConnectionUri $env:DIRECT_URL -Label "DIRECT_URL (process)"
}

# --- Main ---
Write-Step "Local Marriage itest migration runner (Prisma migrate deploy only)"
Write-Step "Target: ${RequiredHost}:${RequiredPort} / database ${RequiredDatabase}"
Write-Step ""
Write-Step "This will apply ALL pending migrations in prisma/migrations to that database."
Write-Step "It will NOT run seed, migrate dev, or db push."
Write-Step ""

$typed = Read-Host "Type ${RequiredDatabase} to confirm the target database"
if ($typed -ne $RequiredDatabase) {
  Stop-Runner "Confirmation failed. Expected exact text: ${RequiredDatabase}"
}

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$plainPassword = ConvertTo-PlainSecureString $securePassword
$securePassword.Dispose()
$plainPassword = $plainPassword.Trim()
if ([string]::IsNullOrEmpty($plainPassword)) {
  Stop-Runner "Password cannot be empty."
}

$connectionUri = $null
try {
  $connectionUri = Build-LocalItestUri -PgUser $User -PgPassword $plainPassword
  Test-PostgresTargetUri -ConnectionUri $connectionUri -Label "built URI"

  $psqlPath = Resolve-PsqlExecutable
  Invoke-VerifyLiveTarget -PgUser $User -PgPassword $plainPassword -PsqlPath $psqlPath

  Set-MigrationTargetEnv -ConnectionUri $connectionUri

  Push-Location $RepoRoot
  try {
    if (-not (Test-Path (Join-Path $RepoRoot "prisma\schema.prisma"))) {
      Stop-Runner "Repo root not found (missing prisma/schema.prisma). Run from shanah-city clone."
    }

    Remove-Item Env:DIRECT_DATABASE_URL -ErrorAction SilentlyContinue
    Test-PostgresTargetUri -ConnectionUri $env:DATABASE_URL -Label "DATABASE_URL (pre-migrate)"
    Test-PostgresTargetUri -ConnectionUri $env:DIRECT_URL -Label "DIRECT_URL (pre-migrate)"
    if ($env:DATABASE_URL -ne $env:DIRECT_URL) {
      Stop-Runner "DATABASE_URL and DIRECT_URL must match immediately before migrate deploy."
    }

    Write-Step "Running: prisma migrate deploy (existing migrations only)..."
    & npm.cmd exec prisma -- migrate deploy
    if ($LASTEXITCODE -ne 0) {
      Stop-Runner "prisma migrate deploy failed with exit code $LASTEXITCODE."
    }
    Write-Step "migrate deploy completed successfully."
  } finally {
    Pop-Location
  }
} finally {
  if ($plainPassword) {
    $plainPassword = $null
  }
  Clear-SecretEnv
}

Write-Step "Done. DATABASE_URL / DIRECT_URL cleared from this session."
