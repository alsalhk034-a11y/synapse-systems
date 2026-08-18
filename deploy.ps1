#!/usr/bin/env pwsh
# ================================================================
# Synapse Systems - Windows Deployment Script
# ================================================================
# يستخدم Node المحمول الموجود في المشروع
# لا يحتاج لتثبيت npm/wrangler مسبقاً
# ================================================================

param(
    [switch]$Setup,
    [switch]$Deploy,
    [switch]$Dev,
    [switch]$Tail,
    [switch]$DBShell,
    [switch]$DBBackup,
    [string]$DBQuery,
    [string]$ProjectRoot = $PSScriptRoot
)

# ألوان
function Write-Color($msg, $color = "Cyan") {
    Write-Host $msg -ForegroundColor $color
}

function Write-Step($n, $msg) {
    Write-Host ""
    Write-Host "━━━ Step ${n}: $msg ━━━" -ForegroundColor Blue
}

function Write-OK($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }
function Write-Info($msg) { Write-Host "  ℹ $msg" -ForegroundColor Yellow }

# مسارات
$NodeExe = Join-Path $ProjectRoot "node-portable\node-v20.18.0-win-x64\node.exe"
$NpmCmd = Join-Path $ProjectRoot "node-portable\node-v20.18.0-win-x64\npm.cmd"
$WranglerPkgDir = Join-Path $ProjectRoot "node-portable\wrangler"

if (-not (Test-Path $NodeExe)) {
    Write-Err "Node غير موجود في: $NodeExe"
}

# تهيئة PATH
$env:PATH = "$(Split-Path $NodeExe);$env:PATH"

# Header
Clear-Host
Write-Color @"

  🏥  Synapse Systems - Cloudflare Deployment
  ────────────────────────────────────────────
"@ "Cyan"

# دالة لتنفيذ أوامر Node
function Invoke-Node {
    param([string]$Cmd, [string[]]$Args = @())
    & $NodeExe $Cmd @Args
    return $LASTEXITCODE
}

function Invoke-Npm {
    param([string[]]$Args)
    & $NpmCmd @Args
    return $LASTEXITCODE
}

function Get-Wrangler {
    # استخدم wrangler من node-portable إذا مثبت، أو npx
    $wranglerLocal = Join-Path $WranglerPkgDir "node_modules\.bin\wrangler.cmd"
    if (Test-Path $wranglerLocal) {
        return $wranglerLocal
    }
    return $null
}

# ========== Setup: تثبيت wrangler محلياً ==========
function Invoke-Setup {
    Write-Step 1 "تثبيت wrangler محلياً في المشروع"

    if (-not (Test-Path $WranglerPkgDir)) {
        New-Item -ItemType Directory -Path $WranglerPkgDir -Force | Out-Null
    }

    # package.json مؤقت لتثبيت wrangler
    $tmpPkg = Join-Path $WranglerPkgDir "package.json"
    if (-not (Test-Path $tmpPkg)) {
        Write-Info "إنشاء package.json..."
        '{"name":"wrangler-host","private":true}' | Out-File $tmpPkg -Encoding UTF8
    }

    Write-Info "تثبيت wrangler@latest (قد يستغرق دقيقة)..."
    Push-Location $WranglerPkgDir
    try {
        $code = Invoke-Npm @("install", "wrangler@latest")
        if ($code -ne 0) { Write-Err "فشل تثبيت wrangler" }
    } finally {
        Pop-Location
    }
    Write-OK "wrangler مثبت"

    Write-Step 2 "تسجيل الدخول إلى Cloudflare"
    $wr = Get-Wrangler
    if (-not $wr) { Write-Err "wrangler غير مثبت" }
    Write-Info "سيفتح المتصفح لتسجيل الدخول..."
    & $wr login
    Write-OK "تم تسجيل الدخول"

    Write-Step 3 "إنشاء موارد Cloudflare"
    & $wr d1 create synapse-systems-db
    & $wr r2 bucket create synapse-files
    $kvOutput = & $wr kv namespace create CACHE --output json 2>&1
    Write-OK "تم إنشاء D1 + R2 + KV"

    Write-Step 4 "تحديث wrangler.toml"
    Write-Info "الآن يجب تحديث wrangler.toml بالمعرّفات الناتجة أعلاه"
    Write-Info "انسخ database_id و kv id إلى wrangler.toml"

    Write-Step 5 "توليد الأسرار"
    $jwtSecret = & $NodeExe -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"
    $encKey = & $NodeExe -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
    $dbKey = & $NodeExe -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

    Write-Info "رفع JWT_SECRET..."
    $jwtSecret | & $wr secret put JWT_SECRET
    Write-Info "رفع ENCRYPTION_KEY..."
    $encKey | & $wr secret put ENCRYPTION_KEY
    Write-Info "رفع DATABASE_ENCRYPTION_KEY..."
    $dbKey | & $wr secret put DATABASE_ENCRYPTION_KEY
    Write-OK "تم رفع الأسرار"

    Write-Step 6 "تثبيت تبعيات Worker"
    Push-Location (Join-Path $ProjectRoot "worker")
    try {
        Invoke-Npm @("install")
    } finally {
        Pop-Location
    }
    Write-OK "تبعيات Worker مثبتة"

    Write-Step 7 "تشغيل Migrations"
    $migrations = @(
        "0001_initial.sql",
        "0002_seed.sql"
    )
    foreach ($m in $migrations) {
        $path = Join-Path $ProjectRoot "worker\d1\$m"
        & $wr d1 execute synapse-systems-db --remote --file="$path"
    }
    Write-OK "تم تشغيل Migrations + Seed"

    Write-Step 8 "نشر Worker"
    Push-Location (Join-Path $ProjectRoot "worker")
    try {
        Invoke-Npm @("run", "deploy")
    } finally {
        Pop-Location
    }
    Write-OK "تم نشر Worker"

    Write-Step 9 "بناء ونشر Frontend"
    Push-Location $ProjectRoot
    try {
        Invoke-Npm @("run", "build")
        & $wr pages deploy dist --project-name synapse-systems-web
    } finally {
        Pop-Location
    }
    Write-OK "تم نشر Frontend"

    Write-Color @"

  🎉 اكتمل النشر بنجاح!
  ────────────────────────

  Frontend: https://synapse-systems-web.pages.dev
  Worker:   https://synapse-systems.<your-subdomain>.workers.dev

  سجل دخول بـ:
    Username: admin
    Password: ChangeMe123!

  ⚠ غيّر كلمة السر فوراً بعد أول دخول!

"@ "Green"
}

# ========== Dev: تشغيل محلي ==========
function Invoke-Dev {
    Write-Step 1 "تشغيل Worker محلياً"
    $wr = Get-Wrangler
    Push-Location (Join-Path $ProjectRoot "worker")
    try {
        Start-Process -FilePath $wr -ArgumentList "dev" -NoNewWindow
        Start-Sleep -Seconds 3
        Write-OK "Worker يعمل على http://127.0.0.1:8787"
    } finally {
        Pop-Location
    }

    Write-Step 2 "تشغيل Frontend"
    Push-Location $ProjectRoot
    try {
        Invoke-Npm @("run", "dev")
    } finally {
        Pop-Location
    }
}

# ========== Tail: سجلات مباشرة ==========
function Invoke-Tail {
    $wr = Get-Wrangler
    & $wr tail
}

# ========== DB Shell ==========
function Invoke-DBShell {
    $wr = Get-Wrangler
    if ($DBQuery) {
        & $wr d1 execute synapse-systems-db --remote --command="$DBQuery"
    } else {
        Write-Info "استخدم: -DBQuery 'SELECT * FROM patients LIMIT 5'"
    }
}

# ========== DB Backup ==========
function Invoke-DBBackup {
    $wr = Get-Wrangler
    $fileName = "synapse-backup-$(Get-Date -Format 'yyyyMMdd-HHmm').sql"
    & $wr d1 export synapse-systems-db --output=$fileName
    Write-OK "تم حفظ النسخة في: $fileName"
}

# ========== Deploy فقط ==========
function Invoke-Deploy {
    $wr = Get-Wrangler
    Write-Step 1 "نشر Worker"
    Push-Location (Join-Path $ProjectRoot "worker")
    try { Invoke-Npm @("run", "deploy") } finally { Pop-Location }
    Write-OK "Worker"

    Write-Step 2 "نشر Frontend"
    Push-Location $ProjectRoot
    try {
        Invoke-Npm @("run", "build")
        & $wr pages deploy dist --project-name synapse-systems-web
    } finally { Pop-Location }
    Write-OK "Frontend"
}

# ========== Main ==========
if ($Setup) { Invoke-Setup }
elseif ($Deploy) { Invoke-Deploy }
elseif ($Dev) { Invoke-Dev }
elseif ($Tail) { Invoke-Tail }
elseif ($DBShell) { Invoke-DBShell }
elseif ($DBBackup) { Invoke-DBBackup }
else {
    Write-Color @"
استخدام:

  .\deploy.ps1 -Setup         # إعداد كامل لأول مرة
  .\deploy.ps1 -Deploy        # نشر التحديثات
  .\deploy.ps1 -Dev           # تشغيل محلي
  .\deploy.ps1 -Tail          # سجلات مباشرة
  .\deploy.ps1 -DBShell -DBQuery 'SELECT * FROM patients LIMIT 5'
  .\deploy.ps1 -DBBackup      # نسخة احتياطية

"@ "Yellow"
}
