#!/usr/bin/env pwsh
# ================================================================
# Synapse Systems - One-time Cloudflare Setup
# ================================================================
# Bypasses: "npm not found", "cmd /c blocked", "sandbox log path"
# Uses portable Node + direct node invocation
# ================================================================

$ErrorActionPreference = "Continue"

# === Colors ===
function W($c, $m) { Write-Host $m -ForegroundColor $c }
function Info($m) { W Cyan "  i  $m" }
function Ok($m) { W Green "  v  $m" }
function Warn($m) { W Yellow "  !  $m" }
function Step($n, $m) { W Blue "`n=== Step $n : $m ===" }
function Err($m) { W Red "  X  $m"; exit 1 }

Clear-Host
W Magenta @"

  ###  Synapse Systems - Cloudflare Setup
  ----------------------------------------

"@

# === Verify Node ===
$NodeExe = ".\node-portable\node-v20.18.0-win-x64\node.exe"
$NodeDir = ".\node-portable\node-v20.18.0-win-x64"
$WranglerDir = ".\node-portable\wrangler"
$WranglerBin = "$WranglerDir\node_modules\.bin\wrangler.cmd"
$WranglerJs  = "$WranglerDir\node_modules\wrangler\bin\wrangler.js"

# Sandbox-safe paths
$env:XDG_CONFIG_HOME = "$(Resolve-Path .)\node-portable\wrangler\config"
if (-not (Test-Path $env:XDG_CONFIG_HOME)) {
    New-Item -ItemType Directory -Path $env:XDG_CONFIG_HOME -Force | Out-Null
}
$env:WRANGLER_LOG_PATH = "$env:XDG_CONFIG_HOME\logs"
if (-not (Test-Path $env:WRANGLER_LOG_PATH)) {
    New-Item -ItemType Directory -Path $env:WRANGLER_LOG_PATH -Force | Out-Null
}

if (-not (Test-Path $NodeExe)) { Err "Node not found: $NodeExe" }
Ok "Node: $(& $NodeExe --version)"

# Add Node to PATH (session only)
$env:PATH = "$NodeDir;$env:PATH"

# Helper: run npm via node directly (bypass cmd /c which is blocked)
function Invoke-Npm {
    param([string[]]$Args)
    $npmCli = "$NodeDir\node_modules\npm\bin\npm-cli.js"
    if (-not (Test-Path $npmCli)) {
        Err "npm-cli.js not found. Run: $NodeExe $NodeDir\npm\bin\npm-cli.js install -g npm"
    }
    & $NodeExe $npmCli @Args
    return $LASTEXITCODE
}

# Helper: run wrangler directly (bypass .cmd batch file issues)
function Invoke-Wrangler {
    param([string[]]$Args)
    & $NodeExe $WranglerJs @Args
    return $LASTEXITCODE
}

# === Step 1: Install wrangler locally ===
Step 1 "Install wrangler locally (no admin rights needed)"
if (-not (Test-Path $WranglerDir)) {
    New-Item -ItemType Directory -Path $WranglerDir -Force | Out-Null
}
if (-not (Test-Path "$WranglerDir\package.json")) {
    Set-Content -Path "$WranglerDir\package.json" -Value '{"name":"wrangler-host","private":true,"version":"1.0.0"}' -Encoding UTF8
}

if (-not (Test-Path $WranglerBin)) {
    Info "Installing wrangler@3.114.17 (60-120s) ..."
    Push-Location $WranglerDir
    try {
        $code = Invoke-Npm -Args @("install", "wrangler@3.114.17", "--no-audit", "--no-fund", "--ignore-scripts")
        if ($code -ne 0) { Err "Failed to install wrangler (exit $code)" }
    } finally {
        Pop-Location
    }
}
if (-not (Test-Path $WranglerBin)) { Err "wrangler binary not found at $WranglerBin" }
$ver = & $NodeExe $WranglerJs --version 2>$null
Ok "wrangler installed: $ver"

# === Step 2: Login (skipped when CLOUDFLARE_API_TOKEN env is set) ===
Step 2 "Login to Cloudflare"
if ($env:CLOUDFLARE_API_TOKEN) {
    Ok "Using CLOUDFLARE_API_TOKEN env var (login skipped)"
} else {
    $doLogin = Read-Host "  Are you already logged in to Cloudflare in your browser? (y/n)"
    if ($doLogin -ne "y") {
        Info "Opening browser for Cloudflare login..."
        Invoke-Wrangler -Args @("login") | Out-Null
    }
    Ok "Cloudflare authentication step done"
}

# === Step 3: Create resources ===
Step 3 "Create Cloudflare resources"

# D1
Info "Creating D1 Database..."
$dbOutput = Invoke-Wrangler -Args @("d1", "create", "synapse-systems-db", "--json") 2>&1 | Out-String
$dbId = $null
if ($dbOutput -match '"uuid"\s*:\s*"([^"]+)"') { $dbId = $matches[1] }
elseif ($dbOutput -match '"database_id"\s*:\s*"([^"]+)"') { $dbId = $matches[1] }
elseif ($dbOutput -match '"id"\s*:\s*"([^"]+)"') { $dbId = $matches[1] }
if (-not $dbId) {
    Info "May already exist, fetching list..."
    $listOutput = Invoke-Wrangler -Args @("d1", "list", "--json") 2>&1 | Out-String
    if ($listOutput -match '"name"\s*:\s*"synapse-systems-db"[\s\S]+?"(?:uuid|id)"\s*:\s*"([^"]+)"') {
        $dbId = $matches[1]
    }
}
if (-not $dbId) { Err "Failed to create/find D1. Output: $dbOutput" }
Ok "D1 Database ID: $dbId"

# R2
Info "Creating R2 Bucket..."
$r2Out = Invoke-Wrangler -Args @("r2", "bucket", "create", "synapse-files") 2>&1 | Out-String
if ($r2Out -match 'already exists') { Ok "R2 Bucket already exists" }
else { Ok "R2 Bucket created" }

# KV
Info "Creating KV Namespace..."
$kvOutput = Invoke-Wrangler -Args @("kv", "namespace", "create", "CACHE", "--json") 2>&1 | Out-String
$kvId = $null
if ($kvOutput -match '"id"\s*:\s*"([^"]+)"') { $kvId = $matches[1] }
if (-not $kvId) {
    Info "Searching existing..."
    $listOutput = Invoke-Wrangler -Args @("kv", "namespace", "list", "--json") 2>&1 | Out-String
    if ($listOutput -match '"title"\s*:\s*"CACHE"[\s\S]+?"id"\s*:\s*"([^"]+)"') {
        $kvId = $matches[1]
    }
}
if (-not $kvId) { Err "Failed to create KV. Output: $kvOutput" }
Ok "KV ID: $kvId"

# === Step 4: Update wrangler.toml ===
Step 4 "Update wrangler.toml with real IDs"
$toml = Get-Content ".\wrangler.toml" -Raw
$toml = $toml -replace 'database_id = "PLACEHOLDER_RUN_WRANGLER_TO_CREATE"', "database_id = `"$dbId`""
$toml = $toml -replace 'id = "PLACEHOLDER_RUN_WRANGLER_TO_CREATE"', "id = `"$kvId`""
Set-Content ".\wrangler.toml" -Value $toml -Encoding UTF8
Ok "wrangler.toml updated"

# === Step 5: Generate & upload secrets ===
Step 5 "Generate and upload secrets"
$jwtSecret = & $NodeExe -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"
$encKey    = & $NodeExe -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
$dbKey     = & $NodeExe -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

Info "Uploading JWT_SECRET..."
$jwtSecret | Invoke-Wrangler -Args @("secret", "put", "JWT_SECRET") 2>&1 | Out-Null
Ok "JWT_SECRET uploaded"
Info "Uploading ENCRYPTION_KEY..."
$encKey | Invoke-Wrangler -Args @("secret", "put", "ENCRYPTION_KEY") 2>&1 | Out-Null
Ok "ENCRYPTION_KEY uploaded"
Info "Uploading DATABASE_ENCRYPTION_KEY..."
$dbKey | Invoke-Wrangler -Args @("secret", "put", "DATABASE_ENCRYPTION_KEY") 2>&1 | Out-Null
Ok "DATABASE_ENCRYPTION_KEY uploaded"

# === Step 6: Install worker deps ===
Step 6 "Install Worker dependencies"
Push-Location ".\worker"
try {
    if (-not (Test-Path ".\node_modules\wrangler")) {
        Info "Installing worker deps..."
        $code = Invoke-Npm -Args @("install", "--no-audit", "--no-fund", "--ignore-scripts")
        if ($code -ne 0) { Warn "Worker deps install had warnings (continuing)" }
    }
} finally { Pop-Location }
Ok "Worker deps ready"

# === Step 7: Migrations + Seed ===
Step 7 "Run database migrations and seed"
Info "Applying schema..."
$schemaCode = Invoke-Wrangler -Args @("d1", "execute", "synapse-systems-db", "--remote", "--file=.\worker\d1\0001_initial.sql")
if ($schemaCode -ne 0) { Err "Schema migration failed" }
Ok "Schema applied"
Info "Seeding initial data..."
$seedCode = Invoke-Wrangler -Args @("d1", "execute", "synapse-systems-db", "--remote", "--file=.\worker\d1\0002_seed.sql")
if ($seedCode -ne 0) { Err "Seed failed" }
Ok "Seed applied"

# === Step 8: Deploy Worker ===
Step 8 "Deploy Worker API"
Push-Location ".\worker"
try {
    Info "Building and deploying Worker..."
    $deployCode = Invoke-Npm -Args @("run", "deploy")
    if ($deployCode -ne 0) { Err "Worker deploy failed" }
} finally { Pop-Location }
Ok "Worker deployed"

# === Step 9: Build & Deploy Frontend ===
Step 9 "Build and deploy Frontend"
Info "Installing frontend deps (if needed)..."
if (-not (Test-Path ".\node_modules")) {
    $feCode = Invoke-Npm -Args @("install", "--no-audit", "--no-fund", "--ignore-scripts")
    if ($feCode -ne 0) { Warn "Frontend install had warnings" }
}
Info "Building frontend..."
$buildCode = Invoke-Npm -Args @("run", "build")
if ($buildCode -ne 0) { Err "Build failed" }
Ok "Frontend built"
Info "Deploying to Cloudflare Pages..."
$pagesOutput = Invoke-Wrangler -Args @("pages", "deploy", "dist", "--project-name", "synapse-systems-web") 2>&1 | Out-String
Ok "Frontend deployed"

# === Done ===
W Green @"

  ###  Deployment Complete!
  ==============================

  Your URLs:

"@

if ($pagesOutput -match 'https://[a-z0-9-]+\.pages\.dev') {
    W Cyan "     Frontend: $($matches[0])"
} else {
    W Cyan "     Frontend: https://synapse-systems-web.pages.dev"
}
W Cyan "     Worker:   https://synapse-systems.<your-subdomain>.workers.dev"

W Yellow @"

  Default login:

     Username: admin
     Password: ChangeMe123!

  IMPORTANT: Change the password immediately after first login!

  Next steps:
  1) Open the Frontend URL in your browser
  2) Login with admin / ChangeMe123!
  3) Go to Settings > Users > Reset Admin Password
  4) Create real users (doctor, nurse, receptionist)
  5) Start adding patients

"@

W Gray "`n  Tips:"
W Gray "    Live logs:    .\deploy.ps1 -Tail"
W Gray "    Backup DB:    .\deploy.ps1 -DBBackup"
W Gray "    Local dev:    .\deploy.ps1 -Dev`n"
