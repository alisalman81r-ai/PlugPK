<#
    deploy/windows/register-task.ps1

    Registers the daily crawl with Windows Task Scheduler.

    ── This script does nothing unless you pass -Activate ────────────────

    Run without it and you get a printed plan: the exact task that would be
    created, the command it would run, and the account it would run as. Nothing is
    written. That is the default because registering this task is the moment
    unattended crawling begins, and it should take a deliberate second command
    rather than being the consequence of running a file to see what it does.

        # See what it would do (safe):
        powershell -ExecutionPolicy Bypass -File deploy\windows\register-task.ps1

        # Dry-run crawls every morning at 06:00 - writes nothing to the database:
        powershell -ExecutionPolicy Bypass -File deploy\windows\register-task.ps1 -Activate -Dry

        # The real thing:
        powershell -ExecutionPolicy Bypass -File deploy\windows\register-task.ps1 -Activate

        # Remove it:
        powershell -ExecutionPolicy Bypass -File deploy\windows\register-task.ps1 -Unregister

    ── What this is and is not ──────────────────────────────────────────

    Task Scheduler is a real scheduler: it survives reboots, it has its own
    retry-on-failure and missed-run handling, and it needs no process of ours
    running to wake up. What it is not is a scheduler for a machine that is off. If
    this catalogue is meant to be current every morning regardless of whether one
    laptop is awake, this is the wrong host, and the answer is a server with a
    systemd timer (deploy/linux/) or the HTTP trigger fired by a hosted scheduler.
    docs/CRAWLER.md sets out that choice; this script only implements one side of
    it.
#>

[CmdletBinding()]
param(
    # Without this, nothing is written.
    [switch] $Activate,

    # Register the task in dry mode, so it exercises the whole pipeline nightly
    # and writes nothing. The right way to spend the first week.
    [switch] $Dry,

    <#
        Local time, 24-hour.

        06:00 rather than midnight, deliberately. Midnight is when every scheduled
        job on the internet fires, so a source is at its slowest and most likely to
        rate-limit exactly then; and a run at 06:00 has finished before anybody
        opens the review queue, which is the point of doing it overnight at all. It
        also keeps the run inside one calendar day, so "today's crawl" on the
        dashboard means what it says.
    #>
    [string] $At = '06:00',

    [string] $TaskName = 'PlugPK daily car crawl',

    # Cap on records processed per source. 0 leaves each source's own setting.
    [int] $Budget = 0,

    [switch] $Unregister
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$wrapper  = Join-Path $PSScriptRoot 'crawl-daily.ps1'

if (-not (Test-Path $wrapper)) {
    Write-Error "crawl-daily.ps1 is missing from $PSScriptRoot."
    exit 2
}

# ── Unregister ───────────────────────────────────────────────────────
if ($Unregister) {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $existing) {
        Write-Host "No task named '$TaskName' is registered. Nothing to do."
        exit 0
    }
    if (-not $Activate) {
        Write-Host "Would unregister the task '$TaskName'."
        Write-Host "Pass -Activate -Unregister to actually remove it."
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Unregistered '$TaskName'. Nothing is scheduled any more."
    exit 0
}

# ── The plan ─────────────────────────────────────────────────────────
$argumentList = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$wrapper`""
if ($Dry)          { $argumentList += ' -Dry' }
if ($Budget -gt 0) { $argumentList += " -Budget $Budget" }

$whoami = "$env:USERDOMAIN\$env:USERNAME"

Write-Host ''
Write-Host 'Daily crawl task' -ForegroundColor Cyan
Write-Host "  name:      $TaskName"
Write-Host "  runs:      every day at $At (local time)"
Write-Host "  command:   powershell.exe $argumentList"
Write-Host "  directory: $repoRoot"
Write-Host "  as user:   $whoami"
Write-Host "  mode:      $(if ($Dry) { 'DRY - the pipeline runs and writes nothing' } else { 'live - proposals are written; Car is never written' })"
Write-Host "  logs:      $repoRoot\logs\crawler\crawl-<date>.log"
Write-Host ''

if (-not $Activate) {
    Write-Host 'Nothing was written. Re-run with -Activate to register this task.' -ForegroundColor Yellow
    Write-Host 'Read docs/PHASE4-PRODUCTION-CHECK.md first - it lists what to verify before this runs unattended.'
    Write-Host ''
    exit 0
}

# ── Register ─────────────────────────────────────────────────────────
$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument $argumentList `
    -WorkingDirectory $repoRoot

$trigger = New-ScheduledTaskTrigger -Daily -At $At

<#
    Settings, and why each one is not the default.

    StartWhenAvailable  a laptop asleep at 06:00 runs the crawl when it wakes,
                        instead of skipping the day silently. This is the setting
                        that makes a missed morning visible as a late run rather
                        than as no run.
    RestartCount/Interval  three attempts, ten minutes apart, for the case where
                        the machine is up but the network is not yet.
    ExecutionTimeLimit  four hours. A crawl that has been going that long has hung;
                        killing it closes nothing in the database, because an open
                        CrawlRun holds no lock and writes nothing to the catalogue,
                        and /admin/cars/updates shows it as unfinished.
    MultipleInstances IgnoreNew  never two crawls at once against one SQLite file.
    DontStopIfGoingOnBatteries  otherwise an unplugged laptop simply does not crawl.
#>
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 10) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 4) `
    -MultipleInstances IgnoreNew `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries

<#
    Runs as the invoking user, interactively, rather than as SYSTEM.

    SYSTEM would survive the user being logged out, which sounds better until the
    first time it matters: the .env file, the SQLite database and the npm cache all
    sit in this user's checkout, and a task running as SYSTEM reads a different
    profile and a different PATH. It would work on the machine it was tested on and
    fail on the next one, which is the worst kind of scheduled job.

    The trade is that this task needs the user to be logged in. On a machine where
    that is not true, the answer is a server - not a different -RunLevel.
#>
$principal = New-ScheduledTaskPrincipal -UserId $whoami -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description 'Checks external EV data sources and files proposals for review. Never writes to the public car catalogue - every change requires approval at /admin/cars/review.' `
    -Force | Out-Null

Write-Host "Registered '$TaskName'." -ForegroundColor Green
Write-Host ''
Write-Host 'Verify with:'
Write-Host "  Get-ScheduledTask -TaskName '$TaskName' | Get-ScheduledTaskInfo"
Write-Host 'Run it once now, without waiting for the trigger:'
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ''
