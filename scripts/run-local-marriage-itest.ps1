#Requires -Version 5.1
<#
.SYNOPSIS
  Fail-closed runner for local Marriage Counseling Hub Prisma integration test (Test 9L).

.DESCRIPTION
  Prompts for target confirmation and PostgreSQL password, verifies live local PostgreSQL
  preflight and empty Marriage Hub tables via psql, sets opt-in env vars, then runs:
    npx.cmd tsx scripts/marriage-discussion-reopen-prisma.integration.ts

  Does not run migrations, seed, db push, or data imports. Does not modify .env files.
  Never prints the password or full DATABASE_URL.

.PARAMETER User
  PostgreSQL role name (default: postgres).

.PARAMETER VerifyCleanupOnly
  Read-only post-test verification: preflight local PostgreSQL and report COUNT(*) for all 18
  Marriage Hub tables. Does not set DATABASE_URL or run the integration test.
#>
[CmdletBinding()]
param(
  [string] $User = "postgres",
  [switch] $VerifyCleanupOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RequiredHost = "127.0.0.1"
$RequiredPort = 5432
$RequiredDatabase = "shanah_marriage_itest"
$RepoRoot = Split-Path $PSScriptRoot -Parent

$MarriageHubTables = @(
  "MarriageCounselingJourney"
  "MarriageJourneyConsent"
  "MarriageAssessmentResponse"
  "MarriageComparisonUnlock"
  "MarriageJournalEntry"
  "MarriageCounselingSession"
  "MarriageCounselorAssignment"
  "MarriageJourneyInvite"
  "MarriageRevisionRequest"
  "MarriageAuditLog"
  "MarriageDiscussionMark"
  "MarriageCounselorNote"
  "MarriageCurriculumVersion"
  "MarriageProgramTrack"
  "MarriageActionPlan"
  "MarriageSharedGoal"
  "MarriageSharingConsent"
  "MarriageActivitySyncSession"
)

$EnvKeysManaged = @(
  "DATABASE_URL"
  "DIRECT_URL"
  "DIRECT_DATABASE_URL"
  "MARRIAGE_PRISMA_ITEST"
  "MARRIAGE_E2E_ISOLATED"
  "MARRIAGE_COUNSELING_DATA_FILE"
  "MARRIAGE_CURRICULUM_DATA_FILE"
  "AUTH_DATA_DIR"
  "MARRIAGE_HUB_STAGE2_ENABLED"
  "PGPASSWORD"
)

function Write-Step([string] $Message) {
  Write-Host $Message
}

function Stop-Runner([string] $Message) {
  throw $Message
}

function ConvertTo-PlainSecureString([Security.SecureString] $Secure) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Get-EnvSnapshot {
  param([string[]] $Names)
  $snap = @{}
  foreach ($name in $Names) {
    $item = Get-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
    if ($item) {
      $snap[$name] = $item.Value
    } else {
      $snap[$name] = $null
    }
  }
  return $snap
}

function Restore-EnvSnapshot {
  param([hashtable] $Snapshot)
  foreach ($name in $Snapshot.Keys) {
    if ($null -eq $Snapshot[$name]) {
      Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
    } else {
      Set-Item -LiteralPath "Env:$name" -Value $Snapshot[$name]
    }
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
  if ($hostName -eq "localhost" -or $hostName -eq "::1") {
    Stop-Runner "${Label}: host must be ${RequiredHost} (not localhost or ::1)"
  }
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
    "neon.tech"
    "neon.database"
    "supabase.co"
    "amazonaws.com"
    "vercel"
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

function Invoke-PsqlViaStdin {
  param(
    [string] $PsqlPath,
    [string] $PgUser,
    [string] $PgPassword,
    [string] $Sql
  )

  # Pass SQL on stdin so Windows cmd/psql command-line parsing cannot strip PostgreSQL " identifiers.
  $env:PGPASSWORD = $PgPassword
  try {
    $result = $Sql | & $PsqlPath -h $RequiredHost -p $RequiredPort -U $PgUser -d $RequiredDatabase -tA -q -f - 2>&1
    if ($LASTEXITCODE -ne 0) {
      $detail = ($result | Out-String).Trim()
      if ($detail -match "postgres(ql)?://") {
        Stop-Runner "psql command failed (exit $LASTEXITCODE). Check user, password, and database availability."
      }
      Stop-Runner "psql command failed (exit $LASTEXITCODE). ${detail}"
    }
    return $result
  } finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}

function Invoke-PsqlScalar {
  param(
    [string] $PsqlPath,
    [string] $PgUser,
    [string] $PgPassword,
    [string] $Sql
  )

  $env:PGPASSWORD = $PgPassword
  try {
    $result = & $PsqlPath -h $RequiredHost -p $RequiredPort -U $PgUser -d $RequiredDatabase -tAc $Sql 2>&1
    if ($LASTEXITCODE -ne 0) {
      $detail = ($result | Out-String).Trim()
      if ($detail -match "postgres(ql)?://") {
        Stop-Runner "psql command failed (exit $LASTEXITCODE). Check user, password, and database availability."
      }
      Stop-Runner "psql command failed (exit $LASTEXITCODE). ${detail}"
    }
    return ($result | Out-String).Trim()
  } finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}

function Invoke-VerifyLiveTarget {
  param(
    [string] $PgUser,
    [string] $PgPassword,
    [string] $PsqlPath
  )

  $dbName = Invoke-PsqlScalar -PsqlPath $PsqlPath -PgUser $PgUser -PgPassword $PgPassword -Sql "SELECT current_database();"
  if ($dbName -ne $RequiredDatabase) {
    Stop-Runner "Preflight: connected database is '${dbName}', expected '${RequiredDatabase}'."
  }

  $serverAddr = Invoke-PsqlScalar -PsqlPath $PsqlPath -PgUser $PgUser -PgPassword $PgPassword -Sql "SELECT host(inet_server_addr());"
  if ([string]::IsNullOrWhiteSpace($serverAddr)) {
    Stop-Runner "Preflight: host(inet_server_addr()) is NULL or empty; cannot verify local PostgreSQL endpoint."
  }
  if ($serverAddr -ne $RequiredHost) {
    Stop-Runner "Preflight: server endpoint is '${serverAddr}', expected exactly ${RequiredHost}."
  }

  Write-Step "Preflight OK: database=${RequiredDatabase}, server host=${RequiredHost}, port=${RequiredPort}, psql=$PsqlPath"
}

function Get-MarriageHubTableCounts {
  param(
    [string] $PgUser,
    [string] $PgPassword,
    [string] $PsqlPath
  )

  $unionParts = @()
  foreach ($table in $MarriageHubTables) {
    $unionParts += ('SELECT ''{0}'' AS model, COUNT(*)::bigint AS cnt FROM "{1}"' -f $table, $table)
  }
  $sql = ($unionParts -join " UNION ALL ") + " ORDER BY model;"

  $lines = Invoke-PsqlViaStdin -PsqlPath $PsqlPath -PgUser $PgUser -PgPassword $PgPassword -Sql $sql

  $rawLines = ($lines | Out-String).Trim().Split([Environment]::NewLine, [StringSplitOptions]::RemoveEmptyEntries)
  $expectedCount = $MarriageHubTables.Count
  if ($rawLines.Count -ne $expectedCount) {
    Stop-Runner "Marriage Hub count query returned $($rawLines.Count) result row(s), expected exactly ${expectedCount}."
  }

  $countsByModel = @{}
  foreach ($line in $rawLines) {
    $parts = $line.Trim() -split '\|'
    if ($parts.Count -lt 2) {
      Stop-Runner "Unexpected count query output line: ${line}"
    }
    $model = $parts[0].Trim()
    $countText = $parts[1].Trim()
    if ($MarriageHubTables -notcontains $model) {
      Stop-Runner "Unexpected table in count query result: ${model}."
    }
    if ($countsByModel.ContainsKey($model)) {
      Stop-Runner "Duplicate count query result for ${model}."
    }
    $count = 0
    if (-not [long]::TryParse($countText, [ref]$count)) {
      Stop-Runner "Unexpected row count for ${model}: '${countText}'"
    }
    $countsByModel[$model] = $count
  }

  foreach ($table in $MarriageHubTables) {
    if (-not $countsByModel.ContainsKey($table)) {
      Stop-Runner "Missing count query result for ${table}."
    }
  }

  return $countsByModel
}

function Invoke-AssertMarriageHubTablesEmpty {
  param(
    [string] $PgUser,
    [string] $PgPassword,
    [string] $PsqlPath
  )

  $countsByModel = Get-MarriageHubTableCounts -PgUser $PgUser -PgPassword $PgPassword -PsqlPath $PsqlPath
  $nonEmpty = @()
  foreach ($table in $MarriageHubTables) {
    $count = $countsByModel[$table]
    if ($count -gt 0) {
      $nonEmpty += "${table} (${count})"
    }
  }

  if ($nonEmpty.Count -gt 0) {
    Stop-Runner "Marriage Counseling Hub tables must be empty before integration test; found row(s) in: $($nonEmpty -join ', ')."
  }

  Write-Step "Empty-table check OK: all $($MarriageHubTables.Count) Marriage Hub tables have zero rows."
}

function Invoke-VerifyMarriageHubCleanupOnly {
  param(
    [string] $PgUser,
    [string] $PgPassword,
    [string] $PsqlPath
  )

  $countsByModel = Get-MarriageHubTableCounts -PgUser $PgUser -PgPassword $PgPassword -PsqlPath $PsqlPath

  Write-Step "Marriage Hub row counts (read-only):"
  foreach ($table in ($MarriageHubTables | Sort-Object)) {
    Write-Host ("  {0} | {1}" -f $table, $countsByModel[$table])
  }

  $nonEmpty = @()
  foreach ($table in $MarriageHubTables) {
    $count = $countsByModel[$table]
    if ($count -gt 0) {
      $nonEmpty += "${table} (${count})"
    }
  }

  if ($nonEmpty.Count -gt 0) {
    Stop-Runner "POST-TEST VERIFY: FAIL - non-empty: $($nonEmpty -join ', ')."
  }

  Write-Step "POST-TEST VERIFY: PASS - all $($MarriageHubTables.Count) Marriage Hub tables have 0 rows."
}

function Set-IntegrationTestEnv {
  param([string] $ConnectionUri)

  Test-PostgresTargetUri -ConnectionUri $ConnectionUri -Label "DATABASE_URL"

  Remove-Item Env:DIRECT_DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:MARRIAGE_E2E_ISOLATED -ErrorAction SilentlyContinue
  Remove-Item Env:MARRIAGE_COUNSELING_DATA_FILE -ErrorAction SilentlyContinue
  Remove-Item Env:MARRIAGE_CURRICULUM_DATA_FILE -ErrorAction SilentlyContinue
  Remove-Item Env:AUTH_DATA_DIR -ErrorAction SilentlyContinue

  $env:DATABASE_URL = $ConnectionUri
  $env:DIRECT_URL = $ConnectionUri
  $env:MARRIAGE_PRISMA_ITEST = "1"
  $env:MARRIAGE_HUB_STAGE2_ENABLED = "1"

  Test-PostgresTargetUri -ConnectionUri $env:DATABASE_URL -Label "DATABASE_URL (process)"
  Test-PostgresTargetUri -ConnectionUri $env:DIRECT_URL -Label "DIRECT_URL (process)"
  if ($env:DATABASE_URL -ne $env:DIRECT_URL) {
    Stop-Runner "DATABASE_URL and DIRECT_URL must match before integration test."
  }
}

# --- Main ---
Write-Step "Target: ${RequiredHost}:${RequiredPort} / database ${RequiredDatabase}"
Write-Step ""
if ($VerifyCleanupOnly) {
  Write-Step "Post-test read-only verification (Marriage Hub table counts only)."
  Write-Step "This will NOT set DATABASE_URL, run Prisma, migrations, seed, or the integration test."
} else {
  Write-Step "Local Marriage Counseling Hub Prisma integration test runner (Test 9L)"
  Write-Step "This runs the real PostgreSQL integration test only."
  Write-Step "It will NOT run migrations, seed, db push, or application data imports."
}
Write-Step ""

$envSnapshot = Get-EnvSnapshot -Names $EnvKeysManaged
$plainPassword = $null
$securePassword = $null

try {
  $typed = Read-Host "Type ${RequiredDatabase} to confirm the target database"
  if ($typed -ne $RequiredDatabase) {
    Stop-Runner "Confirmation failed. Expected exact text: ${RequiredDatabase}"
  }

  $securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
  $plainPassword = ConvertTo-PlainSecureString $securePassword
  $securePassword.Dispose()
  $securePassword = $null
  $plainPassword = $plainPassword.Trim()
  if ([string]::IsNullOrEmpty($plainPassword)) {
    Stop-Runner "Password cannot be empty."
  }

  $psqlPath = Resolve-PsqlExecutable
  Invoke-VerifyLiveTarget -PgUser $User -PgPassword $plainPassword -PsqlPath $psqlPath

  if ($VerifyCleanupOnly) {
    Invoke-VerifyMarriageHubCleanupOnly -PgUser $User -PgPassword $plainPassword -PsqlPath $psqlPath
    Write-Step "Done. Temporary credentials restored or cleared."
  } else {
    $connectionUri = Build-LocalItestUri -PgUser $User -PgPassword $plainPassword
    Test-PostgresTargetUri -ConnectionUri $connectionUri -Label "built URI"

    $integrationScript = Join-Path $RepoRoot "scripts\marriage-discussion-reopen-prisma.integration.ts"
    if (-not (Test-Path -LiteralPath $integrationScript)) {
      Stop-Runner "Integration test script not found: scripts/marriage-discussion-reopen-prisma.integration.ts"
    }

    Invoke-AssertMarriageHubTablesEmpty -PgUser $User -PgPassword $plainPassword -PsqlPath $psqlPath

    Set-IntegrationTestEnv -ConnectionUri $connectionUri

    Push-Location $RepoRoot
    try {
      Write-Step "Running: npx.cmd tsx scripts/marriage-discussion-reopen-prisma.integration.ts"
      & npx.cmd tsx scripts/marriage-discussion-reopen-prisma.integration.ts
      if ($LASTEXITCODE -ne 0) {
        Stop-Runner "Integration test failed with exit code $LASTEXITCODE."
      }
      Write-Step "Integration test completed successfully."
      Write-Step "Done. Temporary credentials and test env vars restored or cleared."
    } finally {
      Pop-Location
    }
  }
} catch {
  Write-Error $_
  exit 1
} finally {
  if ($securePassword) {
    $securePassword.Dispose()
  }
  if ($plainPassword) {
    $plainPassword = $null
  }
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Restore-EnvSnapshot -Snapshot $envSnapshot
}
