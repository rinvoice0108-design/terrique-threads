# setup-scheduler.ps1
# 매일 오전 8시에 스레드 포스트를 생성하고 이메일로 발송합니다.
# 관리자 권한으로 실행하세요: 우클릭 → "PowerShell로 실행"

$TaskName  = "TerriqueDailyThreads"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodePath  = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $NodePath) {
  Write-Error "Node.js가 설치되어 있지 않습니다. https://nodejs.org 에서 설치 후 다시 실행하세요."
  exit 1
}

# 기존 작업이 있으면 제거
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$Action  = New-ScheduledTaskAction `
  -Execute $NodePath `
  -Argument "scripts\daily.js" `
  -WorkingDirectory $ScriptDir

$Trigger = New-ScheduledTaskTrigger -Daily -At "08:00AM"

$Settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
  -RestartCount 1 `
  -RestartInterval (New-TimeSpan -Minutes 2)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "테리크 스레드 데일리 포스트 생성 및 이메일 발송" `
  -RunLevel Highest | Out-Null

Write-Host ""
Write-Host "작업 스케줄러 등록 완료!" -ForegroundColor Green
Write-Host "  작업명  : $TaskName"
Write-Host "  실행경로: $ScriptDir"
Write-Host "  실행시간: 매일 오전 08:00"
Write-Host ""
Write-Host "즉시 테스트 실행:"
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Cyan
Write-Host ""
Write-Host "작업 삭제:"
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor Gray
