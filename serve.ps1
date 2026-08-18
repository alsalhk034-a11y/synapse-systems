Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.Web

$root = "f:\anas al saleh1\dist"
$port = 5173
$prefix = "http://127.0.0.1:$port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "Synapse Systems static server running on http://127.0.0.1:$port/  (Ctrl+C to stop)"
    Write-Host "Root: $root"

    $mime = @{
        ".html" = "text/html; charset=utf-8"
        ".htm"  = "text/html; charset=utf-8"
        ".js"   = "application/javascript; charset=utf-8"
        ".mjs"  = "application/javascript; charset=utf-8"
        ".css"  = "text/css; charset=utf-8"
        ".json" = "application/json; charset=utf-8"
        ".svg"  = "image/svg+xml"
        ".png"  = "image/png"
        ".jpg"  = "image/jpeg"
        ".jpeg" = "image/jpeg"
        ".gif"  = "image/gif"
        ".webp" = "image/webp"
        ".ico"  = "image/x-icon"
        ".woff" = "font/woff"
        ".woff2"= "font/woff2"
        ".ttf"  = "font/ttf"
        ".txt"  = "text/plain; charset=utf-8"
        ".map"  = "application/json; charset=utf-8"
    }

    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $resp = $ctx.Response

        $relPath = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
        if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = "index.html" }

        $fullPath = Join-Path $root $relPath
        if (-not (Test-Path $fullPath)) {
            # SPA fallback to index.html
            $fullPath = Join-Path $root "index.html"
        }

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $ct = $mime[$ext]
            if (-not $ct) { $ct = "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $resp.ContentType = $ct
            $resp.ContentLength64 = $bytes.Length
            $resp.StatusCode = 200
            $resp.OutputStream.Write($bytes, 0, $bytes.Length)
            $resp.OutputStream.Close()
            Write-Host "200  $($req.HttpMethod) $($req.Url.AbsolutePath) -> $relPath"
        } else {
            $resp.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
            $resp.ContentLength64 = $msg.Length
            $resp.OutputStream.Write($msg, 0, $msg.Length)
            $resp.OutputStream.Close()
            Write-Host "404  $($req.HttpMethod) $($req.Url.AbsolutePath)"
        }
    }
} finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
}
