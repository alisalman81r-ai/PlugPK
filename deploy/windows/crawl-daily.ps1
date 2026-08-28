<#
    deploy/windows/crawl-daily.ps1

    What Task Scheduler actually runs.

    A wrapper rather than pointing the task straight at npm, for four reasons that
    each cost a debugging session when they are missing:

      * a scheduled task starts in C:\Windows\System32, so the working directory
        has to be set here or `npm run` finds no package.json;
      * a task runs without a user profile, so PATH may not include node;
      * output goes nowhere unless it is redirected, and a crawl whose output went
        nowhere is a crawl nobody can review;
      * an exit code has to be returned for Task Scheduler's "last run result" to
        mean anything.

    Usage, by hand:
        powershell -ExecutionPolicy Bypass -File deploy\windows\crawl-daily.ps1
        powershell -ExecutionPolicy Bypass -File deploy\windows\crawl-daily.ps1 -Dry
#>

[CmdletBinding()]
param(
    # A full pass that writes nothing. What to use for the first scheduled runs.
    [switch] $Dry,

    # Cap on records processed per source. 0 leaves each source's own setting.
    [int] $Budget = 0,

    # Where to keep the run logs. One file per day, kept for $RetainDays.
    [string] $LogDirectory,

    [int] $RetainDays = 30
)

$ErrorActionPreference = 'Stop'

# The repository root, derived from this script's own location rather than
# assumed. The task can then be registered from anywhere, and the checkout can
# move without the task silently starting to crawl nothing.
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

if (-not (Test-Path (Join-Path $repoRoot 'package.json'))) {
    Write-Error "No package.json under $repoRoot - this script is not where it expects to be."
    exit 2
}

if (-not $LogDirectory) { $LogDirectory = Join-Path $repoRoot 'logs\crawler' }
if (-not (Test-Path $LogDirectory)) {
    New-Item -ItemType Directory -Force -Path $LogDirectory | Out-Null
}

$stamp = Get-Date -Format 'yyyy-MM-dd'
$logFile = Join-Path $LogDirectory "crawl-$stamp.log"

# npm is a .cmd shim on Windows, which PowerShell will not invoke through the
# call operator without help. Resolved rather than assumed so a missing node
# install fails with a sentence instead of a stack trace.
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue)
if (-not $npm) { $npm = (Get-Command npm -ErrorAction SilentlyContinue) }
if (-not $npm) {
    $message = "npm is not on PATH for the account this task runs as."
    Add-Content -Path $logFile -Value "$(Get-Date -Format o)  FATAL  $message" -Encoding utf8
    Write-Error $message
    exit 3
}

$arguments = @('run', 'crawl:daily', '--')
if ($Dry)          { $arguments += '--dry' }
if ($Budget -gt 0) { $arguments += @('--budget', $Budget) }

Add-Content -Path $logFile -Encoding utf8 -Value @"

================================================================
$(Get-Date -Format o)  starting
  repo:   $repoRoot
  command: npm $($arguments -join ' ')
================================================================
"@

Push-Location $repoRoot
try {
    # Output is captured and appended rather than streamed, so a partial write
    # cannot interleave with another run's lines. stderr is merged in: a crawl's
    # errors belong in the same file as its results, in order.
    $output = & $npm.Source @arguments 2>&1
    $exit = $LASTEXITCODE
    Add-Content -Path $logFile -Value $output -Encoding utf8
}
finally {
    Pop-Location
}

Add-Content -Path $logFile -Encoding utf8 -Value "$(Get-Date -Format o)  finished with exit code $exit"

# Old logs are pruned here rather than by a second scheduled task, so there is
# one thing to register and one thing to remove.
Get-ChildItem -Path $LogDirectory -Filter 'crawl-*.log' -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetainDays) } |
    Remove-Item -Force -ErrorAction SilentlyContinue

# The command's own exit code, passed through. `crawl:daily` returns 0 whenever
# the run completed, whatever the sources did - a source being down is an
# expected condition, and a task that shows "failed" every time a website is slow
# is a task whose status nobody reads.
exit $exit
