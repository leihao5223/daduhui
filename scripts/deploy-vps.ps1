# 大都汇 pangxie：构建后上传到 VPS（与 scripts/pangxie-daduhui-api.service 一致）
# 用法（在 pangxie 根目录）：npm run deploy:vps
# 环境变量：ZMGJ_SSH_HOST（默认 107.149.189.112）、ZMGJ_SSH_PORT（默认 27637）
# 私钥：%USERPROFILE%\.ssh\id_ed25519
# 注意：不会上传 server/data/，避免覆盖生产 store.json

param(
  [string] $ServerHost = "",
  [int] $SshPort = 0,
  [string] $RemoteUser = "root",
  [string] $RemoteBase = "/srv/isolated/pangxie-daduhui",
  [switch] $SkipBuild,
  [string] $SystemdUnit = "pangxie-daduhui-api"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not $ServerHost) {
  $ServerHost = if ($env:ZMGJ_SSH_HOST) { $env:ZMGJ_SSH_HOST.Trim() } else { "107.149.189.112" }
}
if ($SshPort -le 0) {
  $SshPort = if ($env:ZMGJ_SSH_PORT) { [int]$env:ZMGJ_SSH_PORT } else { 27637 }
}

$key = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path $key)) {
  throw "未找到 SSH 私钥: $key（请与国辉生产部署使用同一密钥）"
}

try {
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $OutputEncoding = [Console]::OutputEncoding
} catch {}

$SshArgs = @(
  "-i", $key,
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "KexAlgorithms=curve25519-sha256",
  "-o", "ConnectTimeout=15",
  "-o", "BatchMode=yes"
)

if (-not $SkipBuild) {
  Write-Host "==> npm run build" -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "==> skip build (-SkipBuild)" -ForegroundColor Yellow
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
  Copy-Item -Recurse -Force (Join-Path $Root "dist") (Join-Path $stage "dist")
  Copy-Item -Force (Join-Path $Root "package.json") $stage
  Copy-Item -Force (Join-Path $Root "package-lock.json") $stage

  $target = "${RemoteUser}@${ServerHost}:${RemoteBase}"
  Write-Host "==> ssh mkdir $RemoteBase" -ForegroundColor Cyan
  ssh @SshArgs -p $SshPort "${RemoteUser}@${ServerHost}" "mkdir -p ${RemoteBase}"
  if ($LASTEXITCODE -ne 0) { throw "SSH mkdir failed." }

  Write-Host "==> scp server, dist, package.json" -ForegroundColor Cyan
  scp @SshArgs -P $SshPort -r (Join-Path $stage "server") "${target}/"
  if ($LASTEXITCODE -ne 0) { throw "scp server failed." }
  scp @SshArgs -P $SshPort -r (Join-Path $stage "dist") "${target}/"
  if ($LASTEXITCODE -ne 0) { throw "scp dist failed." }
  scp @SshArgs -P $SshPort (Join-Path $stage "package.json") "${target}/"
  if ($LASTEXITCODE -ne 0) { throw "scp package.json failed." }
  scp @SshArgs -P $SshPort (Join-Path $stage "package-lock.json") "${target}/"
  if ($LASTEXITCODE -ne 0) { throw "scp package-lock.json failed." }

  Write-Host "==> remote npm ci + systemctl restart $SystemdUnit" -ForegroundColor Cyan
  $remote = "cd ${RemoteBase} && (npm ci --omit=dev || npm install --omit=dev); systemctl try-restart ${SystemdUnit} 2>/dev/null || true; systemctl is-active ${SystemdUnit} 2>/dev/null || true; curl -s -o /dev/null -w 'local3301=%{http_code}\n' http://127.0.0.1:3301/ || true"
  ssh @SshArgs -p $SshPort "${RemoteUser}@${ServerHost}" $remote
  if ($LASTEXITCODE -ne 0) { throw "Remote npm/restart failed." }
} finally {
  if (Test-Path $stage) {
    Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
  }
}

Write-Host "==> deploy finished" -ForegroundColor Green
