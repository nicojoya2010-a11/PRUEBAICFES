# Practica ICFES

App web y Android para practicar Saber 11 con roles de estudiante, profesor y admin.

## Desarrollo local

```bash
npm install
npm run dev
```

La app corre en `http://localhost:1234`.

Si Firebase no esta configurado, la app usa modo local. Para definir el admin local crea un archivo `.env.local`:

```env
VITE_LOCAL_ADMIN_USERNAME=tu_usuario_local
VITE_LOCAL_ADMIN_PASSWORD=tu_contrasena_local
VITE_LOCAL_ADMIN_NAME=Administrador
```

Ese archivo no se sube a GitHub.

## Firebase

1. Crea un proyecto en Firebase.
2. Activa Authentication con Email/Password.
3. Activa Firestore.
4. Copia la configuracion web en `.env.local` usando variables `VITE_FIREBASE_*`.
5. Verifica que `.firebaserc` tenga tu `projectId`.
6. Despliega reglas y hosting:

```bash
npm run firebase:login
npm run firebase:deploy
```

El proyecto actual esta apuntando a `detective-7ec8c` desde `.firebaserc`. La configuracion real de Firebase queda en `.env.local`, que no se sube a GitHub.

Ejemplo `.env.local`:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Crear admin en Firebase

Descarga un service account desde Firebase/Google Cloud y guardalo como `serviceAccountKey.json` en la raiz del proyecto. Ese archivo no se sube a Git.

PowerShell:

```powershell
$env:ADMIN_PASSWORD="tu-contrasena-segura"
npm run firebase:seed-admin
```

Por defecto crea el usuario `admin`. Puedes cambiarlo con:

```powershell
$env:ADMIN_USERNAME="nico"
$env:ADMIN_NAME="Nicolas"
$env:ADMIN_PASSWORD="tu-contrasena-segura"
npm run firebase:seed-admin
```

La app convierte el usuario en un correo interno. Por ejemplo, `DEKUVIGILANTE` inicia sesion como `dekuvigilante@icfes.local` dentro de Firebase Auth.

## Android con Capacitor

```bash
npm run cap:sync
npm run cap:open
```

Para generar AAB sin firmar:

```bash
npm run android:aab
```

Para generar AAB firmada para Play Console:

```bash
npm run android:aab:signed
```

La AAB firmada queda en:

```text
android/app/build/outputs/bundle/release/app-release-signed.aab
```

En esta maquina ya esta configurado JDK 21 y Android SDK. Guarda una copia segura de `android/upload-keystore.jks` y `android/signing.properties`; esos archivos no se suben a GitHub y son necesarios para futuras actualizaciones en Google Play.

## GitHub

```bash
git init
git add .
git commit -m "Initial ICFES app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

No subas contrasenas, `serviceAccountKey.json`, `.env`, keystores ni archivos `.jks`.
