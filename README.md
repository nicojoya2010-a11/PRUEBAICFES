# Práctica ICFES

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

## Preguntas base y preguntas extra

Las 250 preguntas base se generan desde:

```text
data/questions.js
```

Para agregar muchas preguntas sin tocar la lógica, usa:

```text
data/extraQuestions.json
```

Duplica el objeto de ejemplo, cambia `"enabled": true` y completa:

```json
{
  "enabled": true,
  "areaId": "lectura",
  "skill": "Comprensión lectora",
  "difficulty": "Medio",
  "context": "Texto base opcional.",
  "prompt": "Pregunta para el estudiante.",
  "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "answer": "A",
  "explanation": "Explicación de la respuesta."
}
```

`areaId` puede ser `lectura`, `matematicas`, `sociales`, `ciencias` o `ingles`. `answer` acepta `A`, `B`, `C`, `D` o `0`, `1`, `2`, `3`. Al ejecutar `npm run build`, la app combina las 250 base con las preguntas extra y las deja disponibles offline dentro de la web y Android.

## Marca del colegio

Edita este archivo para cambiar nombre, colegio, correo y aviso legal:

```text
src/data/appConfig.json
```

La política de privacidad pública está en:

```text
public/privacy.html
```

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

La app convierte el usuario en un correo interno. Por ejemplo, `DEKUVIGILANTE` inicia sesión como `dekuvigilante@icfes.local` dentro de Firebase Auth.

## Offline

La app trae las preguntas base empacadas. En Android funcionan sin internet. En web, el usuario debe abrir la app al menos una vez con internet para que el navegador guarde los archivos. Si el estudiante ya inició sesión antes, Firebase conserva la sesión y Firestore intenta sincronizar cambios pendientes cuando vuelva la conexión.

## Temas y monetización

La app incluye temas desbloqueables por recompensas: claro, rojo neón, morado, azul profundo y verde pizarra. Los temas premium piden 5 videos de recompensa.

Por ahora el botón de video está en modo demo para probar el flujo. Para monetizar de verdad hay que crear cuenta de AdMob, generar App ID y Rewarded Ad Unit ID, y conectar el SDK de anuncios antes de publicar esa versión.

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

## Salida a mercado

Antes de mostrar o entregar una versión final:

```bash
npm run build
npm run firebase:deploy
npm run android:aab:signed
git add .
git commit -m "Prepare market release"
git push
```

Revisa que `public/privacy.html` tenga el responsable real, que `src/data/appConfig.json` tenga el nombre del colegio si aplica, y guarda copia segura del keystore de Android.
