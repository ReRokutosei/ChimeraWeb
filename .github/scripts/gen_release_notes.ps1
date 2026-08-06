param(
  [Parameter(Mandatory)][string]$r,
  [Parameter(Mandatory)][string]$o
)

$errorActionPreference = 'Stop'
$repo = $env:GITHUB_REPOSITORY
if (-not $repo) { $repo = 'ReRokutosei/ChimeraWeb' }

function To-Handle($name, $email) {
  $nl = if ($name) { $name.ToLowerInvariant() } else { '' }
  $el = if ($email) { $email.ToLowerInvariant() } else { '' }

  if ($el -eq '199175422+chatgpt-codex-connector[bot]@users.noreply.github.com' -or $nl -eq 'chatgpt-codex-connector[bot]' -or $el -eq 'noreply@openai.com' -or $nl -eq 'codex') { return '@codex' }
  if ($el -eq '29139614+renovate[bot]@users.noreply.github.com' -or $nl -eq 'renovate[bot]') { return '@renovatebot' }
  if ($el -eq '175728472+copilot@users.noreply.github.com' -or $nl -eq 'copilot') { return '@MicrosoftCopilot' }
  if ($el -eq '136622811+coderabbitai[bot]@users.noreply.github.com' -or $nl -eq 'coderabbitai[bot]') { return '@coderabbitai' }
  if ($el -eq 'qwen-coder@alibabacloud.com' -or $nl -eq 'qwen-coder') { return '@QwenLM' }
  if ($el -eq '176961590+gemini-code-assist[bot]@users.noreply.github.com' -or $el -eq 'noreply@google.com' -or $nl -like '*gemini*') { return '@gemini-code-assist' }
  if ($el -like '*@anthropic.com' -or $nl -like '*claude*') { return '@claude' }

  if ($email -match '^\d+\+([^@]+)@users\.noreply\.github\.com$') { return "@$($matches[1])" }
  if ($email -match '^([^@]+)@users\.noreply\.github\.com$') { return "@$($matches[1])" }

  if ($name) { return "@$name" }
  return '@unknown'
}

function Get-Contributors($sha) {
  $authorName = git show -s --format='%an' $sha
  $authorEmail = git show -s --format='%ae' $sha
  $contributors = [System.Collections.Generic.List[string]]::new()
  $authorHandle = To-Handle $authorName $authorEmail
  $contributors.Add($authorHandle)

  $body = git show -s --format='%B' $sha
  $body -split "`n" | Where-Object { $_ -match '(?i)^Co-authored-by:\s+' } | ForEach-Object {
    $rest = $_ -replace '(?i)^Co-authored-by:\s+', ''
    $coName = $rest -replace ' <.*$', ''
    $coEmail = $rest -replace '^.*<', '' -replace '>$', ''
    $handle = To-Handle $coName $coEmail
    if (-not $contributors.Contains($handle)) {
      $contributors.Add($handle)
    }
  }

  return ($contributors -join ', ')
}

$features = [System.Collections.Generic.List[string]]::new()
$performance = [System.Collections.Generic.List[string]]::new()
$bugFixes = [System.Collections.Generic.List[string]]::new()
$dependencies = [System.Collections.Generic.List[string]]::new()
$maintenance = [System.Collections.Generic.List[string]]::new()

$shas = git rev-list --reverse $r
foreach ($sha in $shas) {
  $subject = git show -s --format='%s' $sha
  $shortSha = git show -s --format='%h' $sha
  $authorEmail = git show -s --format='%ae' $sha
  $contributors = Get-Contributors $sha
  $line = "* ${shortSha} ${subject} by ${contributors}"

  $isRenovate = $authorEmail -match 'renovate\[bot\]@users\.noreply\.github\.com$'

  if ($isRenovate -or $subject -match '^(fix|chore)\(deps\):') {
    $dependencies.Add($line)
  } elseif ($subject -match '^(feat|ui)(\(.+\))?:') {
    $features.Add($line)
  } elseif ($subject -match '^perf(\(.+\))?:') {
    $performance.Add($line)
  } elseif ($subject -match '^fix(\(.+\))?:') {
    $isMaintFix = ($subject -match '^fix\((ci|build|compile|deprecation|docs|inspection|lint|release|test|workflow|workflows)\):') -or
                  ($subject -match '^fix(\(.+\))?:.*(^|[ \t\W])(ci|build|compile|deprecation|docs|inspection|lint|test|workflow|workflows)($|[ \t\W])')
    if ($isMaintFix) {
      $maintenance.Add($line)
    } else {
      $bugFixes.Add($line)
    }
  } elseif ($subject -match '^chore\(release\):') {
    continue
  } elseif ($subject -match '^(refactor|docs|test|ci|build|chore|style)(\(.+\))?:') {
    $maintenance.Add($line)
  }
}

$outLines = [System.Collections.Generic.List[string]]::new()

function Add-Section($title, $items) {
  if ($items.Count -gt 0) {
    $outLines.Add("## $title")
    foreach ($item in $items) {
      $outLines.Add($item)
    }
    $outLines.Add("")
  }
}

function Add-SubSection($title, $items) {
  if ($items.Count -gt 0) {
    $outLines.Add("### $title")
    foreach ($item in $items) {
      $outLines.Add($item)
    }
    $outLines.Add("")
  }
}

Add-Section "Features & Improvements" $features
Add-Section "Performance" $performance
Add-Section "Bug Fixes" $bugFixes

$techCount = $maintenance.Count + $dependencies.Count
if ($techCount -gt 0) {
  $outLines.Add("<details>")
  $outLines.Add("<summary>Maintenance and Dependencies (${techCount} changes)</summary>")
  $outLines.Add("")
  Add-SubSection "Maintenance" $maintenance
  Add-SubSection "Dependencies" $dependencies
  $outLines.Add("</details>")
  $outLines.Add("")
}

$outLines.Add("**Full Changelog**: https://github.com/${repo}/compare/${r}")

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllLines($o, $outLines, $utf8NoBom)
