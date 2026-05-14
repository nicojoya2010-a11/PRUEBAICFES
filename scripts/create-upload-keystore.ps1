$ErrorActionPreference = "Stop"

$keystore = "android\upload-keystore.jks"
$properties = "android\signing.properties"
$alias = "upload"

if (Test-Path $keystore) {
  Write-Host "La keystore ya existe: $keystore"
  exit 0
}

$chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
$password = -join (1..32 | ForEach-Object { $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)] })
$jdk = "C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot"
$keytool = Join-Path $jdk "bin\keytool.exe"

& $keytool -genkeypair `
  -v `
  -storetype JKS `
  -keystore $keystore `
  -storepass $password `
  -alias $alias `
  -keypass $password `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -dname "CN=Practica ICFES, OU=App, O=Practica ICFES, L=Bogota, ST=Cundinamarca, C=CO"

@"
storeFile=upload-keystore.jks
storePassword=$password
keyAlias=$alias
keyPassword=$password
"@ | Set-Content -Path $properties

Write-Host "Keystore creada en $keystore"
Write-Host "Datos de firma guardados en $properties"
