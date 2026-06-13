$user  = '$simpson-software-api'
$pass  = 'c8YfGjicw3tspe0vHxlmBR5wDHnf3LvPkgP6vBn1hdgm5vire46SmYHJYb9n'
# clean=true removes old files first; restart=true restarts the app after deploy
$uri   = 'https://simpson-software-api-f3cqdsfpedapacbp.scm.westus2-01.azurewebsites.net/api/publish?type=zip&clean=true&restart=true'
$root  = $PSScriptRoot

# ── Build Linux-compatible zip (exclude runtimes\win and wwwroot local uploads) ──
Write-Host "Building deploy.zip ..."
$publishDir = Join-Path $root 'publish'
$zipPath    = Join-Path $root 'deploy.zip'
$exclude    = @('runtimes', 'wwwroot', 'appsettings.Development.json')

# Temporarily move excluded folders out
$moved = @{}
foreach ($name in @('runtimes', 'wwwroot')) {
    $src = Join-Path $publishDir $name
    if (Test-Path $src) {
        $bak = Join-Path $root "${name}_bak"
        Move-Item $src $bak
        $moved[$src] = $bak
    }
}
$devCfg = Join-Path $publishDir 'appsettings.Development.json'
if (Test-Path $devCfg) { Remove-Item $devCfg }

Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Compress-Archive -Path "$publishDir/*" -DestinationPath $zipPath -Force

# Restore
foreach ($pair in $moved.GetEnumerator()) { Move-Item $pair.Value $pair.Key }

$bytes = [System.IO.File]::ReadAllBytes($zipPath)
Write-Host "Uploading $([math]::Round($bytes.Length / 1MB, 1)) MB ..."

$cred    = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{
    Authorization  = "Basic $cred"
    'Content-Type' = 'application/zip'
}

try {
    Add-Type -AssemblyName System.Net.Http
    $client = New-Object System.Net.Http.HttpClient
    $client.DefaultRequestHeaders.Authorization = `
        New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Basic', $cred)
    $client.Timeout = [TimeSpan]::FromSeconds(300)

    $content = New-Object System.Net.Http.ByteArrayContent(,$bytes)
    $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/zip')

    $resp = $client.PostAsync($uri, $content).Result
    $body = $resp.Content.ReadAsStringAsync().Result
    Write-Host "Status: $($resp.StatusCode) ($([int]$resp.StatusCode))"
    if ($body) { Write-Host "Body: $body" }
} catch {
    Write-Host "Exception: $($_.Exception.Message)"
}
