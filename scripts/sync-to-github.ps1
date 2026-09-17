<#
  .SYNOPSIS
    Safe sync workflow for the Sankalp repo: build -> stage -> commit -> push.
    Never force-pushes. Never commits/pushes if the build fails.

  .PARAMETER Message
    Optional commit message. If omitted, one is generated from the changed
    top-level paths (e.g. "Update client/src/pages, server/src/db").
#>
param(
  [string]$Message
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Fail($msg) {
  Write-Host "`n[sync] $msg" -ForegroundColor Red
  exit 1
}

# 1. Confirm we're in a git repo
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { Fail "Not a git repository at $repoRoot. Run 'git init' first." }

# 2. Confirm origin exists
$remotes = git remote -v
if (-not ($remotes -match 'origin')) {
  Fail "No 'origin' remote configured. Run:`n  git remote add origin <YOUR_GITHUB_REPO_URL>"
}
$originUrl = (git remote get-url origin).Trim()
Write-Host "[sync] origin -> $originUrl" -ForegroundColor Cyan

# 3. Current branch
$branch = (git branch --show-current).Trim()
if (-not $branch) { Fail "Not on any branch (detached HEAD?). Checkout a branch first." }
Write-Host "[sync] branch -> $branch" -ForegroundColor Cyan

# 4. Anything to do?
git fetch origin *> $null 2>&1
$statusPorcelain = git status --porcelain
if (-not $statusPorcelain) {
  Write-Host "[sync] Working tree is clean - nothing new to stage." -ForegroundColor Yellow
}

# 5. If the branch tracks an upstream, rebase safely onto it first (never force)
$upstream = git rev-parse --abbrev-ref "$branch@{upstream}" 2>$null
if ($LASTEXITCODE -eq 0 -and $upstream) {
  Write-Host "[sync] Pulling --rebase from $upstream" -ForegroundColor Cyan
  git pull --rebase origin $branch
  if ($LASTEXITCODE -ne 0) {
    Fail "Rebase failed (likely a conflict). Resolve manually, then re-run 'npm run sync'."
  }
} else {
  Write-Host "[sync] No upstream tracked yet for '$branch' - skipping pull/rebase." -ForegroundColor Yellow
}

# 6. Build the client - do NOT commit/push if this fails
Write-Host "`n[sync] Running client build (npm run build)..." -ForegroundColor Cyan
Push-Location (Join-Path $repoRoot 'client')
npm run build
$buildExitCode = $LASTEXITCODE
Pop-Location
if ($buildExitCode -ne 0) {
  Fail "Build failed (exit code $buildExitCode). Nothing was staged, committed, or pushed. Fix the error above and re-run 'npm run sync'."
}
Write-Host "[sync] Build succeeded." -ForegroundColor Green

# 7. Stage changes
git add -A

$staged = git diff --cached --name-status
if (-not $staged) {
  Write-Host "`n[sync] No changes to commit after staging. Nothing to push." -ForegroundColor Yellow
  exit 0
}

Write-Host "`n[sync] Files to be committed:" -ForegroundColor Cyan
git diff --cached --stat

# 8. Commit
if (-not $Message) {
  $topDirs = ($staged -split "`n" | ForEach-Object {
    $parts = ($_ -split "`t")[-1] -split '/'
    if ($parts.Length -ge 2) { "$($parts[0])/$($parts[1])" } else { $parts[0] }
  } | Sort-Object -Unique) -join ', '
  if ($topDirs.Length -gt 120) { $topDirs = $topDirs.Substring(0, 117) + '...' }
  $Message = "Update $topDirs"
}
Write-Host "`n[sync] Commit message: `"$Message`"" -ForegroundColor Cyan
git commit -m "$Message"
if ($LASTEXITCODE -ne 0) { Fail "git commit failed." }
$commitHash = (git rev-parse --short HEAD).Trim()

# 9. Push (never force)
Write-Host "`n[sync] Pushing to origin/$branch" -ForegroundColor Cyan
git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
  Fail "git push failed (see error above). The commit was created locally ($commitHash) but was NOT pushed."
}

Write-Host "`n[sync] Done." -ForegroundColor Green
Write-Host "  Branch:      $branch"
Write-Host "  Commit:      $commitHash"
Write-Host "  Push result: success"
Write-Host "  Repository:  $originUrl"
