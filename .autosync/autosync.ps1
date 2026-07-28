<#
  autosync.ps1 -- watches this repo and pushes every saved change to GitHub.

  Behaviour:
    * polls `git status --porcelain` every -IntervalSeconds
    * only commits once the change set has stopped moving for one full poll
      (so a file mid-save is never committed half-written)
    * on a rejected push, rebases onto origin and retries once
    * logs to .autosync/autosync.log (gitignored)

  Run:      powershell -ExecutionPolicy Bypass -File F:\plugPK\.autosync\autosync.ps1
  Stop:     delete .autosync/autosync.stop, or kill the process
#>

[CmdletBinding()]
param(
    [string] $RepoPath        = (Split-Path $PSScriptRoot -Parent),
    [int]    $IntervalSeconds = 5,
    [string] $Branch          = 'main'
)

$ErrorActionPreference = 'Continue'

$syncDir  = Join-Path $RepoPath '.autosync'
$logFile  = Join-Path $syncDir 'autosync.log'
$lockFile = Join-Path $syncDir 'autosync.lock'
$stopFile = Join-Path $syncDir 'autosync.stop'

function Write-Log {
    param([string] $Message, [string] $Level = 'INFO')
    $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Write-Output $line
    Add-Content -Path $logFile -Value $line -Encoding utf8
}

function Invoke-Git {
    # Runs git and returns @{ Out = <combined text>; Code = <exit code> }.
    # stderr is folded into stdout deliberately: git writes normal progress there.
    $out  = & git -C $RepoPath @args 2>&1 | Out-String
    $code = $LASTEXITCODE
    return @{ Out = $out.Trim(); Code = $code }
}

# --- single-instance guard -------------------------------------------------
if (Test-Path $lockFile) {
    $old = (Get-Content $lockFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($old -and (Get-Process -Id $old -ErrorAction SilentlyContinue)) {
        Write-Log "another autosync is already running (pid $old); exiting" 'WARN'
        exit 0
    }
    Write-Log "clearing stale lock from pid $old" 'WARN'
}
Set-Content -Path $lockFile -Value $PID -Encoding utf8
if (Test-Path $stopFile) { Remove-Item $stopFile -Force }

Write-Log "autosync started (pid $PID) on $RepoPath -> origin/$Branch, poll ${IntervalSeconds}s"

try {
    # --- make sure the branch exists and tracks origin --------------------
    $current = (Invoke-Git 'rev-parse' '--abbrev-ref' 'HEAD').Out
    if ($current -ne $Branch) {
        $null = Invoke-Git 'checkout' '-B' $Branch
        Write-Log "switched to branch $Branch"
    }

    $previousStatus = $null

    while (-not (Test-Path $stopFile)) {

        $status = (Invoke-Git 'status' '--porcelain').Out

        if ([string]::IsNullOrWhiteSpace($status)) {
            $previousStatus = $null
        }
        elseif ($status -ne $previousStatus) {
            # changes are still arriving -- wait one more poll before committing
            $previousStatus = $status
        }
        else {
            # change set is stable: commit it
            $files = ($status -split "`n").Count
            $null  = Invoke-Git 'add' '--all'

            $staged = Invoke-Git 'diff' '--cached' '--quiet'
            if ($staged.Code -eq 0) {
                # nothing actually staged (e.g. all changes were gitignored)
                $previousStatus = $null
            }
            else {
                $stamp   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
                $message = "autosync: $files file(s) at $stamp"
                $commit  = Invoke-Git 'commit' '-m' $message

                if ($commit.Code -ne 0) {
                    Write-Log "commit failed: $($commit.Out)" 'ERROR'
                }
                else {
                    $short = (Invoke-Git 'rev-parse' '--short' 'HEAD').Out
                    Write-Log "committed $short -- $message"

                    $push = Invoke-Git 'push' '-u' 'origin' $Branch
                    if ($push.Code -ne 0) {
                        Write-Log "push rejected, rebasing onto origin/$Branch" 'WARN'
                        $rebase = Invoke-Git 'pull' '--rebase' '--autostash' 'origin' $Branch
                        if ($rebase.Code -ne 0) {
                            Write-Log "rebase failed -- manual fix needed: $($rebase.Out)" 'ERROR'
                            $null = Invoke-Git 'rebase' '--abort'
                        }
                        else {
                            $retry = Invoke-Git 'push' '-u' 'origin' $Branch
                            if ($retry.Code -ne 0) {
                                Write-Log "push still failing: $($retry.Out)" 'ERROR'
                            }
                            else {
                                Write-Log "pushed $short after rebase"
                            }
                        }
                    }
                    else {
                        Write-Log "pushed $short to origin/$Branch"
                    }
                }
                $previousStatus = $null
            }
        }

        Start-Sleep -Seconds $IntervalSeconds
    }

    Write-Log "stop file detected; autosync shutting down"
}
finally {
    if (Test-Path $lockFile) { Remove-Item $lockFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $stopFile) { Remove-Item $stopFile -Force -ErrorAction SilentlyContinue }
}
