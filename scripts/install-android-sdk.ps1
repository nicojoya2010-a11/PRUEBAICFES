$ErrorActionPreference = "Stop"

$sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$jdk = "C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot"
$tools = Join-Path $sdk "cmdline-tools\latest\bin\sdkmanager.bat"
$toolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-14742923_latest.zip"

New-Item -ItemType Directory -Force -Path (Join-Path $sdk "cmdline-tools\latest") | Out-Null

if (!(Test-Path $tools)) {
  $zip = Join-Path $env:TEMP "commandlinetools-win.zip"
  $tmp = Join-Path $env:TEMP ("android-cmdline-tools-" + [guid]::NewGuid().ToString())

  Invoke-WebRequest -Uri $toolsUrl -OutFile $zip
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  Copy-Item -Path (Join-Path $tmp "cmdline-tools\*") -Destination (Join-Path $sdk "cmdline-tools\latest") -Recurse -Force
}

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$jdk\bin;$sdk\platform-tools;$env:Path"

1..20 | ForEach-Object { "y" } | & $tools --sdk_root=$sdk --licenses
& $tools --sdk_root=$sdk "platform-tools" "platforms;android-36" "build-tools;36.0.0"

$localProperties = "sdk.dir=$($sdk -replace '\\','/')"
Set-Content -Path "android\local.properties" -Value $localProperties

Write-Host "Android SDK listo en $sdk"
