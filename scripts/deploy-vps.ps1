# pangxie (daduhui) -> /srv/isolated/pangxie-daduhui
# Default: 107.149.189.110:27637, systemd pangxie-daduhui-api, nvm Node 20
# Usage: npm run deploy:vps | npm run deploy:vps:server
# Env: ZMGJ_SSH_HOST, ZMGJ_SSH_PORT. Key: %USERPROFILE%\.ssh\id_ed25519
# Does NOT upload server/data/

param(
  [string] $ServerHost = "",
  [int] $SshPort = 0,
  [string] $RemoteUser = "root",
  [string] $RemoteBase = "/srv/isolated/pangxie-daduhui",
  [switch] $SkipBuild,
  [switch] $ServerOnly,
  [string] $SystemdUnit = "pangxie-daduhui-api"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not $ServerHost) {
  $ServerHost = if ($env:ZMGJ_SSH_HOST) { $env:ZMGJ_SSH_HOST.Trim() } else { "107.149.189.110" }
}
if ($SshPort -le 0) {
  $SshPort = if ($env:ZMGJ_SSH_PORT) { [int]$env:ZMGJ_SSH_PORT } else { 27637 }
}

$key = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path $key)) {
  throw "SSH key not found: $key"
}

$SshArgs = @(
  "-i", $key,
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "KexAlgorithms=curve25519-sha256",
  "-o", "ConnectTimeout=30"
)

if ($ServerOnly) {
  $SkipBuild = $true
  Write-Host "==> ServerOnly: skip dist and webpack" -ForegroundColor Yellow
}

if (-not $SkipBuild) {
  Write-Host "==> npm run build" -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "==> skip build (-SkipBuild)" -ForegroundColor Yellow
}

if (-not $ServerOnly) {
  if (-not (Test-Path (Join-Path $Root "dist\index.html"))) {
    throw "Missing dist/. Run npm run build first."
  }
}

$stage = Join-Path $env:TEMP ("pangxie-deploy-" + [Guid]::NewGuid().ToString("n").Substring(0, 12))
New-Item -ItemType Directory -Force $stage | Out-Null
try {
  Write-Host "==> stage copy (exclude server/data)" -ForegroundColor Cyan
  Copy-Item -Recurse -Force (Join-Path $Root "server") (Join-Path $stage "server")
  $dataDir = Join-Path $stage "server\data"
  if (Test-Path $dataDir) {
    Remove-Item -Recurse -Force $dataDir
  }
  if (-not $ServerOnly) {
    Copy-Item -Recurse -Force (Join-Path $Root "dist") (Join-Path $stage "dist")
  }
  Copy-Item -Force (Join-Path $Root "package.json") $stage
  Copy-Item -Force (Join-Path $Root "package-lock.json") $stage

  $target = "${RemoteUser}@${ServerHost}:${RemoteBase}"
  Write-Host "==> ssh mkdir $RemoteBase" -ForegroundColor Cyan
  ssh @SshArgs -p $SshPort "${RemoteUser}@${ServerHost}" "mkdir -p ${RemoteBase}"
  if ($LASTEXITCODE -ne 0) { throw "SSH mkdir failed." }

  if ($ServerOnly) {
    Write-Host "==> scp server + package files (no dist)" -ForegroundColor Cyan
  } else {
    Write-Host "==> scp server, dist, package files" -ForegroundColor Cyan
  }
  scp @SshArgs -P $SshPort -r (Join-Path $stage "server") "${target}/"
  if ($LASTEXITCODE -ne 0) { throw "scp server failed." }
  if (-not $ServerOnly) {
    scp @SshArgs -P $SshPort -r (Join-Path $stage "dist") "${target}/"
    if ($LASTEXITCODE -ne 0) { throw "scp dist failed." }
  }
  scp @SshArgs -P $SshPort (Join-Path $stage "package.json") "${target}/"
  if ($LASTEXITCODE -ne 0) { throw "scp package.json failed." }
  scp @SshArgs -P $SshPort (Join-Path $stage "package-lock.json") "${target}/"
  if ($LASTEXITCODE -ne 0) { throw "scp package-lock.json failed." }

  Write-Host "==> remote: nvm 20 + npm ci + systemctl restart $SystemdUnit" -ForegroundColor Cyan
  $remote = "bash -lc 'source /root/.nvm/nvm.sh && nvm use 20 && cd ${RemoteBase} && (npm ci --omit=dev || npm install --omit=dev) && systemctl restart ${SystemdUnit}'"
  ssh @SshArgs -p $SshPort "${RemoteUser}@${ServerHost}" $remote
  if ($LASTEXITCODE -ne 0) { throw "Remote npm/restart failed." }
} finally {
  if (Test-Path $stage) {
    Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
  }
}

Write-Host "==> deploy finished" -ForegroundColor Green
