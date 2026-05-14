$ErrorActionPreference = "Stop"

$jdk = "C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot"
$sdk = "C:\Users\nicoj\AppData\Local\Android\Sdk"
$signingFile = "android\signing.properties"

if (!(Test-Path $signingFile)) {
  throw "No existe $signingFile. Ejecuta npm run android:keystore primero."
}

$signing = ConvertFrom-StringData (Get-Content $signingFile -Raw)
$keystorePath = (Resolve-Path "android\$($signing.storeFile)").Path
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$jdk\bin;$sdk\platform-tools;$env:Path"

npm run build
npx cap build android `
  --androidreleasetype AAB `
  --keystorepath $keystorePath `
  --keystorepass $signing.storePassword `
  --keystorealias $signing.keyAlias `
  --keystorealiaspass $signing.keyPassword

Write-Host "AAB firmado: android\app\build\outputs\bundle\release\app-release-signed.aab"
