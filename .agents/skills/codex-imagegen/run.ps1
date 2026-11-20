# Delegates image generation to `codex exec` and prints only a short summary.
param(
    [Parameter(Mandatory)] [string] $OutDir,
    [string] $Prompt,
    [string] $PromptFile,
    [ValidateSet('imagegen', 'imagegen-frontend-web', 'imagegen-frontend-mobile', 'image-to-code')]
    [string] $Skill = 'imagegen',
    [string[]] $Images = @(),
    [ValidateSet('low', 'medium', 'high', 'xhigh')]
    [string] $Effort = 'medium'
)

$ErrorActionPreference = 'Stop'

if ($PromptFile) { $Prompt = Get-Content -Raw -LiteralPath $PromptFile }
if (-not $Prompt) { throw 'Pass -Prompt or -PromptFile.' }

$OutDir = [IO.Path]::GetFullPath($OutDir)
New-Item -ItemType Directory -Force $OutDir | Out-Null
$logDir = Join-Path $env:TEMP ("codex-imagegen\" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 6))
New-Item -ItemType Directory -Force $logDir | Out-Null

$direction = switch ($Skill) {
    'imagegen' { 'Use $imagegen.' }
    'image-to-code' { 'Use $image-to-code for art direction, but run ONLY its image-generation phase; another agent writes the code. Execute every image with $imagegen.' }
    default { "Use `$$Skill for art direction and execute every image with `$imagegen." }
}

$fullPrompt = @"
$direction

Rules for this run:
- Generate with the built-in image_gen tool only. Do not use the CLI/API fallback.
- Do not write or modify any code or project files other than the images.
- Save every final image into: $OutDir
  Use descriptive kebab-case file names. Never overwrite an existing file; add -v2, -v3 instead.
- Copy each image with a plain binary file copy (Copy-Item or cp). Never rebuild an image file by
  writing bytes or text yourself. If a copy fails, retry once under a new file name; if it still
  fails, stop and report the error and the source path instead of an image path.
- Final reply: the absolute path of each saved image, one per line, nothing else.

Brief:
$Prompt
"@

$codexArgs = @(
    'exec', '--skip-git-repo-check', '--ephemeral',
    '-s', 'workspace-write', '-C', $OutDir,
    '-c', "model_reasoning_effort=`"$Effort`"",
    '-o', (Join-Path $logDir 'last-message.txt'), '--json'
)
foreach ($img in $Images) { $codexArgs += @('-i', [IO.Path]::GetFullPath($img)) }
$codexArgs += @('--', '-')

$start = Get-Date
$sw = [Diagnostics.Stopwatch]::StartNew()
$fullPrompt | & codex @codexArgs > (Join-Path $logDir 'events.jsonl') 2> (Join-Path $logDir 'stderr.log')
$exit = $LASTEXITCODE
$sw.Stop()

# Codex's sandbox often cannot read its own image store, so it fails to copy the results.
# This script runs outside the sandbox: collect every image produced during the run ourselves.
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME '.codex' }
$store = Join-Path $codexHome 'generated_images'
$rawDir = Join-Path $OutDir '_generated'
$raw = @()
# The store keeps one folder per Codex thread. Collect only this run's folder so parallel runs
# don't pick up each other's images; fall back to the whole store if the id is missing.
$threadId = Select-String -LiteralPath (Join-Path $logDir 'events.jsonl') -Pattern '"thread_id":"([^"]+)"' |
    Select-Object -First 1 | ForEach-Object { $_.Matches[0].Groups[1].Value }
if ($threadId -and (Test-Path -LiteralPath (Join-Path $store $threadId))) { $store = Join-Path $store $threadId }
if (Test-Path -LiteralPath $store) {
    $fresh = Get-ChildItem -LiteralPath $store -Recurse -File |
        Where-Object { $_.Extension -in '.png', '.jpg', '.jpeg', '.webp' -and $_.LastWriteTime -ge $start } |
        Sort-Object LastWriteTime
    if ($fresh) { New-Item -ItemType Directory -Force $rawDir | Out-Null }
    $n = 0
    foreach ($f in $fresh) {
        $n++
        $dst = Join-Path $rawDir ('{0:D2}-{1}' -f $n, $f.Name)
        Copy-Item -LiteralPath $f.FullName -Destination $dst -Force
        $raw += $dst
    }
}

"exit=$exit duration=$([int]$sw.Elapsed.TotalSeconds)s skill=$Skill effort=$Effort"
"log=$logDir"
$last = Join-Path $logDir 'last-message.txt'
$paths = if (Test-Path $last) { Get-Content $last | ForEach-Object { $_.Trim() } | Where-Object { $_ } } else { @() }

# A PNG must end with its IEND chunk and a JPEG with FF D9; anything else is a broken write.
function Test-CompleteImage([string]$path) {
    $bytes = [IO.File]::ReadAllBytes($path)
    if ($bytes.Length -lt 16) { return $false }
    $head = [BitConverter]::ToString($bytes, 0, 4)
    $tail = [BitConverter]::ToString($bytes, $bytes.Length - 8, 8)
    if ($head -eq '89-50-4E-47') { return $tail -eq '49-45-4E-44-AE-42-60-82' }
    if ($head.StartsWith('FF-D8')) { return $tail.EndsWith('FF-D9') }
    return $true
}

$invalid = 0
$good = 0
foreach ($p in $paths) {
    if (-not (Test-Path -LiteralPath $p)) { "reply=$p"; continue }
    if (Test-CompleteImage $p) { "image=$p"; $good++ } else { "invalid=$p"; $invalid++ }
}
foreach ($p in $raw) { if (Test-CompleteImage $p) { "generated=$p" } }
if (($invalid -or -not $good) -and $exit -eq 0) { $exit = 3 }
exit $exit
