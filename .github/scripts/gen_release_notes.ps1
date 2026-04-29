param(
  [Parameter(Mandatory)][string]$r,
  [Parameter(Mandatory)][string]$o
)

$errorActionPreference = 'Stop'
$repo = $env:GITHUB_REPOSITORY
if (-not $repo) { $repo = 'ReRokutosei/ChimeraWeb' }

function To-Handle($name, $email) {
  $nl = $name.ToLowerInvariant()
  $el = $email.ToLowerInvariant()

  if ($el -eq '199175422+chatgpt-codex-connector[bot]@users.noreply.github.com' -or $nl -eq 'chatgpt-codex-connector[bot]') { return '@codex' }
  if ($el -eq '29139614+renovate[bot]@users.noreply.github.com' -or $nl -eq 'renovate[bot]') { return '@renovatebot' }
  if ($el -eq '175728472+copilot@users.noreply.github.com' -or $nl -eq 'copilot') { return '@MicrosoftCopilot' }
  if ($el -eq '136622811+coderabbitai[bot]@users.noreply.github.com' -or $nl -eq 'coderabbitai[bot]') { return '@coderabbitai' }
  if ($el -eq 'qwen-coder@alibabacloud.com' -or $nl -eq 'qwen-coder') { return '@QwenLM' }
  if ($el -eq '176961590+gemini-code-assist[bot]@users.noreply.github.com' -or $el -eq 'noreply@google.com' -or $nl -like '*gemini*') { return '@gemini-code-assist' }
  if ($el -like '*@anthropic.com' -or $nl -like '*claude*') { return '@claude' }

  if ($email -match '^(\d+)\+([^@]+)@users\.noreply\.github\.com$') { return "@$($matches[2])" }
  if ($email -match '^([^@]+)@users\.noreply\.github\.com$') { return "@$($matches[1])" }

  if ($name) { return "@$name" }
  return '@unknown'
}

function Get-Contributors($sha) {
  $authorName = git show -s --format='%an' $sha
  $authorEmail = git show -s --format='%ae' $sha
  $contributors = @(To-Handle $authorName $authorEmail)

  $body = git show -s --format='%B' $sha
  $body -split "`n" | Where-Object { $_ -match '^Co-authored-by:\s+' } | ForEach-Object {
    $rest = $_ -replace '^Co-authored-by:\s+', ''
    $coName = $rest -replace ' <.*$', ''
    $coEmail = $rest -replace '^.*<', '' -replace '>$', ''
    $handle = To-Handle $coName $coEmail
    if ($handle -notin $contributors) { $contributors += $handle }
  }

  return ($contributors -join ', ')
}

$userVisible = [System.Text.StringBuilder]::new()
$bugFixes = [System.Text.StringBuilder]::new()
$dependencies = [System.Text.StringBuilder]::new()
$maintenance = [System.Text.StringBuilder]::new()

$shas = git rev-list --reverse $r
foreach ($sha in $shas) {
  $subject = git show -s --format='%s' $sha
  $shortSha = git show -s --format='%h' $sha
  $authorEmail = git show -s --format='%ae' $sha
  $contributors = Get-Contributors $sha
  $line = "* ${shortSha} ${subject} by ${contributors}"

  $isRenovate = $authorEmail -match 'renovate\[bot\]@users\.noreply\.github\.com$'

  if ($subject -match '^(feat|perf|ui)(\(.+\))?:') {
      $null = $userVisible.AppendLine($line)
  } elseif ($subject -match '^fix(\(.+\))?:') {
      if ($subject -match '^fix\(deps\):' -or $isRenovate) {
          $null = $dependencies.AppendLine($line)
      } else {
          $null = $bugFixes.AppendLine($line)
      }
  } elseif ($subject -match '^(refactor|docs|test|ci|build|chore)(\(.+\))?:') {
      if ($subject -match '^chore\(deps\):' -or $isRenovate) {
          $null = $dependencies.AppendLine($line)
      } else {
          $null = $maintenance.AppendLine($line)
      }
  }
}

$lines = @(
  "## User Visible"
  $userVisible.ToString()
  ""
  "## Bug Fixes"
  $bugFixes.ToString()
  ""
  "## Dependencies"
  $dependencies.ToString()
  ""
  "## Maintenance"
  $maintenance.ToString()
  ""
  "**Full Changelog**: https://github.com/${repo}/compare/${r}"
)

$lines -join "`n" | Out-File -FilePath $o -Encoding utf8
