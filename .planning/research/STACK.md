# Stack Research

**Dominio:** App Android de seguridad personal (SOS manos libres) + API .NET + panel policial web
**Investigado:** 2026-10-06
**Confianza global:** MEDIA-ALTA (versiones y políticas Android/Play verificadas contra documentación oficial; los puntos marcados MEDIA/BAJA requieren spike en dispositivo real)

> Alcance: solo lo que hay que AÑADIR. No se re-investiga el back .NET 8 / Supabase existente (ver `.planning/codebase/STACK.md`).
> Regla del repo (`apps/mobile/AGENTS.md`): instalar con `npx expo install <pkg>` para que resuelva la versión compatible con SDK 57. Las versiones de abajo son las pineadas por Expo SDK 57 (`bundledNativeModules.json`, rama `sdk-57`) o la última de npm/NuGet a 2026-10-06.

---

## Hallazgos que condicionan el roadmap (leer primero)

1. **Claude NO acepta audio.** Los modelos actuales (Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 4.5) solo reciben texto e imagen. La IA de audio es un pipeline de dos pasos: transcripción (STT) y luego Claude sobre el texto. Confianza ALTA (docs oficiales de modelos).
2. **Android 14+ no deja arrancar un foreground service de tipo `microphone` (ni `camera`) desde segundo plano**, y desde Android 15 tampoco desde `BOOT_COMPLETED`. Consecuencia: para grabar el clip tras un disparo con la pantalla apagada, el servicio de protección ya debe estar corriendo, arrancado desde la app visible. Tras un reinicio del teléfono hay que pedirle al usuario que reactive la protección (notificación con acción o abrir la app). Confianza ALTA (docs oficiales).
3. **El servicio en primer plano debe vivir en Kotlin (módulo propio), no en JS.** `expo-sensors` solo funciona con la app activa; los activadores (agitar, pantalla on/off, teclas, palabra clave) y la cuenta regresiva deben correr en el servicio nativo. Cuando expira la cuenta regresiva con la app muerta, hay que ejecutar la creación de la alerta sin UI (Headless JS o POST nativo). Es el mayor riesgo técnico del proyecto. Confianza MEDIA, spike obligatorio.
4. **Botón de volumen con pantalla apagada y botón de encendido no tienen API pública directa.** Encendido: contar `ACTION_SCREEN_ON/OFF` (receiver dinámico dentro del servicio). Volumen: `MediaSession` + `VolumeProvider` o `AccessibilityService`. El AccessibilityService tiene política Play restrictiva (solo herramientas de accesibilidad pueden declararse como tales; el resto exige divulgación prominente y formulario) y es probable que Play lo rechace para este fin. Confianza MEDIA.
5. **Play Store exige declaraciones**: tipos de foreground service (video + descripción por tipo), ubicación en segundo plano (formulario + video + divulgación; la seguridad física sí cuenta como funcionalidad central), y desde 2026-08-31 las apps nuevas deben apuntar a API 36 (Expo SDK 57 ya apunta a 36). Confianza ALTA.
6. **.NET 8 termina soporte el 2026-11-10.** Planificar migración a .NET 10 LTS (soporte hasta nov 2028) después de la demo. Confianza ALTA.
7. **Twilio en Colombia: no hay alphanumeric sender ID ni long code doméstico**; solo long code internacional (el remitente puede ser reemplazado en algunas redes) o short code (4-10 semanas de aprovisionamiento). Para la demo usar número internacional; el short code se solicita ya si se quiere en producción. Confianza ALTA (guía oficial Twilio).

---

## Recommended Stack

### Core Technologies (móvil)

| Technology | Version | Purpose | Why Recommended | Confianza |
|------------|---------|---------|-----------------|-----------|
| Expo SDK | ~57.0.24 (ya instalado; 57.0.27 disponible) | Base del app, prebuild/CNG, EAS | Ya está en el scaffold. SDK 57 = RN 0.86, targetSdk 36, compileSdk 36, minSdk 24. Cumple el requisito Play de API 36. | ALTA |
| expo-dev-client | ~57.0.19 | Development build | Expo Go no incluye módulos nativos propios ni foreground services. Obligatorio. | ALTA |
| Expo Modules API (Kotlin) | `expo-modules-core` 57.0.21 (viene con expo) | Módulo local `alertaya-protection` en `apps/mobile/modules/` | Es el camino oficial: DSL `Module { Name; Function; AsyncFunction; Events; OnCreate }`, acceso a `appContext.reactContext`, `sendEvent` hacia JS. `npx create-expo-module --local`. | ALTA |
| Kotlin foreground Service propio | (sin dependencia; `androidx.core` ya incluido) | Núcleo manos libres: shake, screen on/off, teclas, wake word, cuenta regresiva, vibración | Único lugar donde Android permite sensores/receivers/micrófono persistentes. Se declara por config plugin (`withAndroidManifest`). | ALTA (patrón) / MEDIA (comportamiento OEM) |
| expo-location + expo-task-manager | ~57.0.20 / ~57.0.21 | Tracking de ubicación en segundo plano durante la alerta | Soportado por Expo, opción `foregroundService` en `startLocationUpdatesAsync`, plugin con `isAndroidBackgroundLocationEnabled`. `TaskManager.defineTask` en el scope global. | ALTA |
| expo-audio | ~57.0.5 | Clip de audio de 10-30 s en primer plano de la app | Reemplaza a `expo-av` (congelado en 16.0.8). Presets `HIGH_QUALITY` = .m4a AAC. Plugin `enableBackgroundRecording` añade FGS micrófono. Para disparo con pantalla apagada ver "Grabación desde el servicio" abajo. | ALTA (API) / MEDIA (uso en background) |
| expo-notifications | ~57.0.22 | Push (token Expo, canal de alta importancia) | Camino estándar; FCM V1 vía EAS. Requiere dev build. | ALTA |
| expo-router | ~57.0.25 | Navegación | Lo exige `AGENTS.md` del repo (rutas en `src/app/`). | ALTA |
| expo-secure-store | ~57.0.4 | Guardar sesión/PIN-hash/clave | Keystore de Android; legible desde Headless JS. | ALTA |
| expo-build-properties | ~57.0.22 | Ajustes Gradle (minSdk, kotlin, packaging) | Solo si hay que fijar versiones. No tocar targetSdk (ya 36). | ALTA |
| @supabase/supabase-js | 2.117.2 | Auth (login/OTP) y Realtime en cliente | Ya es el proveedor de Auth; necesita `AsyncStorage` para persistir sesión en RN. | ALTA |

### Core Technologies (back .NET: solo adiciones)

| Technology | Version | Purpose | Why Recommended | Confianza |
|------------|---------|---------|-----------------|-----------|
| Twilio (NuGet) | 8.0.2 (2026-09-28, targets net8.0) | SMS a contactos y OTP del celular | SDK oficial; `MessageResource.CreateAsync`. Usar un Messaging Service. | ALTA |
| Anthropic (NuGet, SDK oficial C#) | 12.53.0 (2026-09-30) | Análisis del texto transcrito (peligro, falsa alarma, prioridad, resumen) | Oficial, MIT, net8.0+. Modelo: `claude-sonnet-5-5` ($2/$10 por MTok). Salida con *structured outputs* (JSON por esquema) para que prioridad/riesgo sean parseables. | ALTA |
| Deepgram Nova-3 (REST con `HttpClient`) | `model=nova-3`, `language=es` (incluye es-419) | Transcripción del clip (batch) | $0.0043/min batch; clip de 30 s cuesta fracciones de centavo. Robusto en audio ruidoso/telefónico. Llamada REST de un POST: no hace falta SDK. | MEDIA (precio de terceros; verificar en consola) |
| Expo Push Service (REST `https://exp.host/--/api/v2/push/send`) | v2 | Push a contactos con la app | Un `HttpClient.PostAsJsonAsync` desde .NET; evita montar FirebaseAdmin. Subir a FCM directo solo si se necesita control fino. | ALTA |
| Supabase Storage (bucket privado) | servicio gestionado | Clips de audio | Ver "Audio cifrado". El API .NET emite la URL firmada de subida; el panel recibe URL firmada de lectura de corta vida. | MEDIA (no verifiqué doc de signed upload URLs ni cifrado en reposo; revisar en la fase) |

### Core Technologies (panel policial y página de seguimiento)

| Technology | Version | Purpose | Why Recommended | Confianza |
|------------|---------|---------|-----------------|-----------|
| Next.js | 16.3.8 (React 19) | Panel policial (`apps/web`) y ruta pública `/t/[token]` | App Router + `@supabase/ssr` para sesión de oficial. Acepta React 19. | ALTA |
| @supabase/ssr | 0.12.7 | Sesión de oficiales en Next | Peer `@supabase/supabase-js ^2.114`. | ALTA |
| maplibre-gl | 6.12.0 | Mapa (panel y seguimiento) | Sin API key obligatoria, sin costo por carga de mapa. Un solo motor para ambas pantallas. | ALTA |
| @vis.gl/react-maplibre | 8.1.3 | Wrapper React de MapLibre | Peer `maplibre-gl >=4`. Preferir sobre `react-map-gl/maplibre` (mismo equipo, entrada dedicada). | MEDIA (verificar que 8.1.3 sea la serie estable) |
| Supabase Realtime | incluido en supabase-js | Alertas nuevas y posiciones en el panel | Ver patrón en ARCHITECTURE. Para el panel (pocos oficiales) alcanza `postgres_changes`; si escala, Broadcast desde trigger de BD. | ALTA |

### Supporting Libraries (móvil)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-reanimated | 4.5.1 (pin SDK 57; NO usar la 4.7.1 de npm) | Pressable scale 0.95, stagger fade-in | Diseño a conservar. Instalar con `expo install`. |
| react-native-worklets | 0.10.1 | Dependencia de Reanimated 4 | Siempre junto a Reanimated. |
| expo-haptics | ~57.0.3 | Háptico del botón | Diseño. |
| expo-keep-awake | ~57.0.2 | Pantalla de alerta activa | Solo con la app abierta. |
| expo-intent-launcher | ~57.0.1 | Abrir ajustes de batería/exclusión OEM | Onboarding de permisos. |
| expo-battery | ~57.0.3 | Detectar ahorro de batería / mostrar nivel | Aviso al usuario si el sistema mata el servicio. |
| expo-contacts | ~57.0.6 | Importar contactos de confianza | Opcional; pide permiso extra. |
| expo-local-authentication | ~57.0.3 | PIN/biométrico para cancelar | Complementa el PIN de cancelación. |
| expo-crypto | ~57.0.3 | Hash del PIN, ids | Solo hash/aleatorios; el cifrado del audio va aparte. |
| @react-native-async-storage/async-storage | 2.2.0 | Persistencia de sesión Supabase | Requerido por supabase-js en RN. |
| @tanstack/react-query | 5.104.1 | Caché/estado servidor | Historial y contactos. |
| zustand | 5.0.15 | Estado local (alerta activa) | Ligero; encaja con Clean Architecture si se envuelve en puertos. |
| zod | 4.6.5 | Validación de DTOs | En el borde (respuestas del API). |
| react-hook-form | 7.89.0 | Formularios (registro, contactos) | Si se quiere; opcional. |
| expo-font + @expo-google-fonts/dm-sans | ~57.0.4 / (no está en el pin; instalar con `expo install`) | DM Sans | Diseño del legacy. |
| expo-linear-gradient | ~57.0.2 | Glow rojo | Diseño. |

### Supporting Libraries (nativo Kotlin, dentro del módulo local)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `SensorManager` (SDK Android) | n/a | Shake con acelerómetro (umbral ~2.5-3 g, 2-3 sacudidas en 1.5 s) | Primer activador a entregar. Con foreground service el sensor sigue activo con pantalla apagada (parcial wake lock si el OEM lo duerme). |
| `BroadcastReceiver` dinámico `ACTION_SCREEN_ON/OFF` | n/a | "Varias pulsaciones de encendido" (contar 3-5 toggles en ~3 s) | Segundo activador. No necesita permisos; hay que registrarlo en código (no en manifest). |
| `MediaSession` + `VolumeProvider` | androidx.media | Botones de volumen con pantalla apagada | Tercer activador, solo si el spike en Samsung/Xiaomi/Motorola funciona. Requiere sesión "activa" (audio silencioso). |
| FusedLocationProviderClient | `com.google.android.gms:play-services-location` (la trae `expo-location`) | Ubicación desde el servicio si se quiere independizar de JS | Solo si Headless JS no es viable; si no, usar `expo-location`. |
| Vosk Android | `com.alphacephei:vosk-android` (verificar última en Maven Central) + modelo `vosk-model-small-es-0.42` (39 MB, Apache 2.0) | Palabra clave offline con gramática restringida (`["auxilio","[unk]"]`) | Recomendado como primera opción de wake word: sin costo, sin licencia comercial, sin activación online. |
| Picovoice Porcupine | `@picovoice/porcupine-react-native` 4.0.0 / SDK Android equivalente | Wake word de bajo consumo, español, entrenamiento de frase propia | Solo si se aprueba el costo (ver "What NOT to Use" y alternativas). Requiere AccessKey. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| EAS Build (`eas build --profile development`) | Build del dev client con el módulo Kotlin | `npx eas-cli@latest`. Perfil `development` con `developmentClient: true`, APK. |
| `npx expo prebuild --clean` | Regenerar `android/` (CNG) | SDK 57 limpia por defecto. Nunca editar `android/` a mano; todo va por config plugin. |
| `npx expo-doctor` y `npx expo install --fix` | Detectar versiones incompatibles | Correr antes de cada build. |
| Config plugin propio (`withAndroidManifest`) | Declarar `<service>`, `foregroundServiceType`, permisos | Un plugin en `modules/alertaya-protection/plugin/`. |
| adb | Probar restricciones | `adb shell am compat enable FGS_BOOT_COMPLETED_RESTRICTIONS <pkg>`; buscar en logcat "Foreground service started from background can not have location/camera/microphone access". |
| Dispositivos reales (Samsung, Xiaomi, Motorola, Pixel) | Validar supervivencia del servicio | Emulador no sirve para OEM kill ni teclas con pantalla apagada. |

## Installation

```bash
# Móvil (siempre con expo install para resolver versión del SDK 57)
cd apps/mobile
npx expo install expo-dev-client expo-build-properties expo-location expo-task-manager \
  expo-audio expo-notifications expo-constants expo-device expo-secure-store expo-crypto \
  expo-haptics expo-keep-awake expo-intent-launcher expo-battery expo-local-authentication \
  expo-router expo-linking expo-font expo-linear-gradient react-native-reanimated \
  react-native-worklets react-native-gesture-handler react-native-safe-area-context \
  react-native-screens react-native-svg @react-native-async-storage/async-storage \
  @expo-google-fonts/dm-sans
npm install @supabase/supabase-js @tanstack/react-query zustand zod

# Módulo nativo local (Kotlin)
npx create-expo-module@latest --local alertaya-protection

# Panel web (apps/web)
npm install next@16 react react-dom @supabase/supabase-js @supabase/ssr maplibre-gl @vis.gl/react-maplibre

# API .NET (apps/api/AlertaYA.Api)
dotnet add package Twilio --version 8.0.2
dotnet add package Anthropic --version 12.53.0
```

app.json (extracto, plugins):

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      ["expo-location", {
        "isAndroidBackgroundLocationEnabled": true,
        "isAndroidForegroundServiceEnabled": true
      }],
      ["expo-audio", { "microphonePermission": "AlertaYA graba un clip corto al activarse una alerta." }],
      "expo-notifications",
      "expo-secure-store",
      "./modules/alertaya-protection/plugin"
    ],
    "android": {
      "permissions": [
        "CALL_PHONE", "RECORD_AUDIO", "VIBRATE", "POST_NOTIFICATIONS",
        "FOREGROUND_SERVICE", "FOREGROUND_SERVICE_LOCATION",
        "FOREGROUND_SERVICE_MICROPHONE", "FOREGROUND_SERVICE_SPECIAL_USE",
        "WAKE_LOCK"
      ]
    }
  }
}
```

## Arquitectura de plataforma Android (decisiones de stack)

**Un solo servicio `ProtectionService` con tipos dinámicos** (`ServiceCompat.startForeground(..., typeMask)`):

| Estado | Tipos | Cuándo arranca | Nota |
|--------|-------|----------------|------|
| Armado (solo shake / pantalla / teclas) | `specialUse` (con `<property PROPERTY_SPECIAL_USE_FGS_SUBTYPE>` = "personal safety trigger monitoring") | Desde la app visible (usuario activa "Protección") | Requiere declaración en Play Console. Alternativa sin Play review: ninguna fiable. |
| Armado + clip de audio habilitado o wake word | `specialUse` + `microphone` | Desde la app visible, con `RECORD_AUDIO` ya concedido | Sin esto, un disparo desde pantalla bloqueada NO podrá grabar (restricción while-in-use). |
| Alerta activa | añade `location` | Al disparar; permitido desde background porque la app tiene `ACCESS_BACKGROUND_LOCATION` (exención oficial) | Tracking vía `expo-location` o Fused nativo. |

Tras reinicio (`BOOT_COMPLETED`): NO se puede arrancar `microphone`. Mostrar notificación "Toca para reactivar protección" (la interacción con notificación es exención oficial).

**Grabación desde el servicio:** para disparos con pantalla apagada, grabar con `MediaRecorder`/`AudioRecord` nativo dentro del `ProtectionService` (ya tipo `microphone`), no con `expo-audio` (depende de JS y de la actividad). `expo-audio` queda para grabar con la app abierta (botón SOS en pantalla). Formato: AAC/M4A 16 kHz mono, 32-64 kbps (suficiente para STT; 30 s ≈ 120-240 KB).

**SOS sin UI:** el servicio ejecuta la cuenta regresiva (vibración + notificación con acción "Cancelar" + PIN al cancelar luego). Al expirar: (a) si hay actividad React viva, `sendEvent("onSosConfirmed")`; (b) si no, lanzar un `HeadlessJsTaskService` que corre el mismo caso de uso TypeScript (Clean Architecture: un solo `TriggerSosUseCase`); (c) plan B si Headless JS falla en el spike: POST nativo con OkHttp a `/api/alerts` usando el JWT guardado. Confianza MEDIA.

**Llamada al 123 (CALL_PHONE):** `Intent.ACTION_CALL` desde un servicio en segundo plano choca con el límite de arranque de actividades en background (Android 10+); lanzarlo con la app visible o desde una acción de notificación (interacción del usuario) es lo seguro. `TelecomManager.placeCall()` es la alternativa a probar en el spike (no pude verificar en documentación si lo exime). `USE_FULL_SCREEN_INTENT` está restringido en Android 14+ a apps de llamadas/alarmas: no depender de él. Consistente con la decisión del proyecto: 123 opcional con cuenta regresiva cancelable, nunca silencioso. Confianza MEDIA-BAJA.

**Audio cifrado y Ley 1581:** mínimo defendible = TLS + bucket privado + URL firmada de vida corta + RLS + cifrado en reposo del proveedor. Cifrado a nivel de aplicación (AES-GCM con clave por alerta envuelta en el servidor) es el siguiente nivel, pero choca con el pipeline de IA (necesita el audio en claro en el servidor) y suma complejidad: decidirlo con Roberto/asesor legal; no bloquea la demo. La transcripción en Deepgram implica transferencia internacional: el consentimiento explícito debe mencionarlo. Confianza MEDIA.

**IA del audio (pipeline):**

1. App sube el clip por URL firmada (emitida por el .NET).
2. Job en background (`BackgroundService` + canal en memoria/tabla `jobs`; no meter Hangfire para una demo) descarga el clip y llama a Deepgram.
3. Transcripción + contexto (hora, zona, histórico de la persona) a `claude-sonnet-5-5` con structured outputs: `{ peligro: 0-1, falsaAlarma: 0-1, prioridad: 1-4, resumen: "...", razones: [] }`.
4. Guardar en la alerta, actualizar prioridad, notificar panel por Realtime.
5. Regla de oro (Core Value): la IA solo reordena y resume; **nunca descarta ni retrasa** una alerta. Falso positivo de "falsa alarma" = riesgo de vida. Alertas sin transcripción útil (silencio, ruido) suben o mantienen prioridad, no bajan.

Prompt caching (system prompt fijo) y Batch no aplican: latencia importa, volumen es bajo.

**Página de seguimiento en vivo:** ruta pública `/t/[token]` en Next (o página estática) que consulta `GET /api/track/{token}` cada ~5 s (o SSE). No exponer Realtime con la anon key ni abrir RLS a anónimos: el token es opaco, de alta entropía, con expiración y se invalida al cerrar la alerta. Más simple y más seguro.

**Teselas de mapa:** el servidor de teselas público de OSM no admite uso en producción intensivo. Para la demo estilo raster OSM con MapLibre; para producción MapTiler / Stadia / Protomaps (PMTiles en Supabase Storage o CDN). Confianza MEDIA (no verifiqué precios).

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Kotlin FGS en módulo Expo local | `react-native-background-actions` 4.1.0 | Nunca para activadores: corre JS en el servicio, sin tipos FGS ni receivers nativos, pensado para tareas largas, no para sensores/teclas. |
| `expo-location` + TaskManager | `@react-native-firebase`/Fused nativo propio | Si Headless JS no es viable y todo el flujo SOS debe ser nativo. |
| Deepgram Nova-3 | OpenAI `gpt-4o-mini-transcribe` ($0.003/min) vía NuGet `OpenAI` 2.14.0 | Si se prefiere un proveedor único/precio menor; probar ambos con 10 clips reales en español colombiano y elegir por WER. Cambiar es una interfaz `ITranscriber`. |
| Deepgram Nova-3 | Whisper autoalojado | Solo si la política de datos prohíbe enviar audio a terceros; costo operativo alto para el equipo. |
| Claude Sonnet 5.5 sobre transcripción | Claude Haiku 4.5 (`claude-haiku-4-5`, $1/$5) | **No**: su retiro es "no antes del 2026-10-15"; es la fecha de la demo. Usar Sonnet 5.5 (retiro no antes de 2027-09-28). Opus 5.5 ($4/$20) solo si evals muestran falta de calidad. |
| Vosk (wake word) | Picovoice Porcupine | Si el presupuesto permite plan comercial y se necesita menor consumo/falsos positivos. Picovoice es B2B: no hay plan personal/no comercial, la prueba gratis es única; planes de pago desde ~$500/mes (precio de fuentes secundarias). |
| MapLibre | Leaflet 1.9.4 + `react-leaflet` 5.0.0 | Página de seguimiento ultraligera sin build. Dos motores de mapa = más mantenimiento; solo si el peso de la página importa. |
| MapLibre | `react-native-maps` / `@maplibre/maplibre-react-native` 11.5.0 | Mapa dentro de la app móvil (alerta activa). Para la demo no hace falta mapa nativo; abrir Google Maps por intent o mostrar coordenadas. Añadir cuando el diseño lo pida. |
| Expo Push Service | FCM directo con FirebaseAdmin (.NET) | Si se necesita data-message de prioridad alta garantizada para despertar la app de un contacto o salir de Expo. |
| Twilio | Proveedor local colombiano (Hablame, Infobip, Altiria) | Si Twilio en Colombia da baja entregabilidad o el short code tarda; la interfaz `ISmsSender` lo permite. |
| Supabase Realtime `postgres_changes` | Broadcast desde triggers (`realtime.broadcast_changes`) | Cuando haya decenas de oficiales o más: `postgres_changes` es monohilo y hace una lectura de RLS por suscriptor. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `expo-sensors` para el shake | Solo con la app en primer plano; no sobrevive a pantalla apagada | `SensorManager` dentro del FGS Kotlin |
| `expo-av` | Congelado en 16.0.8, reemplazado | `expo-audio` |
| Arrancar FGS `microphone` desde un receiver/background | `SecurityException`/sin acceso al micro en Android 14+; bloqueado desde BOOT en 15 | Arrancarlo desde la app visible y mantenerlo vivo |
| FGS `dataSync` para el servicio de protección | Timeout de 6 h por 24 h en Android 15; semántica equivocada; también bloqueado desde BOOT | `specialUse` (+ `microphone`/`location` según estado) |
| `shortService` | Dura ~3 min | `specialUse` |
| `SYSTEM_ALERT_WINDOW` como atajo | Desde Android 15 exige ventana overlay visible; mala señal en revisión Play | Notificación con acción / app visible |
| AccessibilityService para volumen | Política Play: solo herramientas de accesibilidad pueden declararse; el resto, formulario + divulgación + riesgo de suspensión | `MediaSession`+`VolumeProvider`; si no funciona, dejar volumen fuera de v1 o distribuir ese activador por APK directo |
| `USE_FULL_SCREEN_INTENT` | Restringido a llamadas/alarmas desde Android 14 | Notificación de alta importancia + acción |
| Enviar audio crudo a Claude | No acepta audio | STT + Claude sobre texto |
| Haiku 4.5 como modelo del pipeline | Retiro posible desde 2026-10-15 | `claude-sonnet-5-5` |
| Reanimated 4.7.1 de npm | Fuera del pin del SDK 57 (4.5.1) | `npx expo install react-native-reanimated` |
| Alphanumeric sender ID en Twilio-Colombia | No soportado | Long code internacional (demo) / short code (producción) |
| Realtime con anon key para el link público de seguimiento | Abre lectura anónima a datos de ubicación | Token opaco + endpoint del API |
| Picovoice "gratis" para producción | Producto B2B, sin plan personal; riesgo de licencia a último momento | Vosk (demo) y decisión explícita de compra si se quiere Porcupine |
| `react-native-immediate-phone-call` 2.0.0 / `react-native-send-intent` 1.3.0 | Paquetes viejos de mantenimiento incierto; un `Intent` desde el módulo propio es 5 líneas | `Intent.ACTION_CALL` en el módulo Kotlin |
| Editar `android/` a mano | Rompe con `prebuild --clean` | Config plugins |

## Stack Patterns by Variant

**Si el spike muestra que Headless JS funciona con la app muerta:**
- Un solo `TriggerSosUseCase` en TypeScript para botón, shake y teclas.
- Porque se evita duplicar lógica (Clean Architecture) y el comportamiento "no informar envío que no ocurrió" queda en un lugar.

**Si Headless JS no es fiable:**
- POST nativo (OkHttp) con `clientGeneratedId` idempotente + el mismo contrato del API; JS reconcilia al abrir.
- Porque el endpoint ya es idempotente por `clientGeneratedId`: duplicar el envío es seguro.

**Si el usuario NO concede micrófono:**
- Servicio solo `specialUse`; alerta sin clip ni wake word; el flujo SOS no se bloquea.
- Porque el botón SOS es núcleo y debe funcionar aunque falle cualquier complemento.

**Si Play rechaza `specialUse` o el background location:**
- Distribuir por APK/EAS interno para la demo y pilotos; reapelar con video del flujo.
- Porque la demo del 15-oct no depende de Play.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| expo ~57.0.24 | react-native 0.86.3, react 19.2.3 | Ya en el scaffold; no subir React a 19.3 en móvil (npm latest 19.3.0, SDK pina 19.2). |
| Next 16.3.8 | react 19.x | Panel web puede usar React 19.3; es otro paquete. |
| react-native-reanimated 4.5.1 | react-native-worklets 0.10.1 | Pin del SDK 57. |
| expo-location 57.0.20 | expo-task-manager 57.0.21 | `TaskManager.defineTask` en scope global antes de `startLocationUpdatesAsync`. |
| @supabase/ssr 0.12.7 | @supabase/supabase-js ^2.114 | supabase-js 2.117.2 cumple. |
| @vis.gl/react-maplibre 8.1.3 | maplibre-gl >=4 | maplibre-gl 6.12.0 cumple (verificar en CI de la fase). |
| Twilio 8.0.2 / Anthropic 12.53.0 | .NET 8 | Ambos targetean net8.0; mantener compatibles al migrar a .NET 10. |
| targetSdk 36 (SDK 57) | Android 16 | Edge-to-edge sin opt-out y predictive back activo (la config actual `predictiveBackGestureEnabled: false` convive, pero revisar); `userInterfaceStyle` debe pasar a `dark`. |

## Límites de factibilidad (resumen Android / Expo / Play)

| Capacidad | Factible | Límite / condición | Confianza |
|-----------|----------|--------------------|-----------|
| Shake con pantalla apagada | Sí | FGS activo; OEM puede matarlo (Xiaomi/Oppo/Huawei/Samsung): guiar exclusión de batería | MEDIA |
| Varias pulsaciones de encendido | Sí (heurística) | Contar SCREEN_ON/OFF; sin acceso a la tecla real; falsos positivos si el usuario bloquea/desbloquea; calibrar ventana | MEDIA |
| Botones de volumen, pantalla apagada | Parcial | MediaSession+VolumeProvider (probar por OEM) o AccessibilityService (riesgo Play) | MEDIA-BAJA |
| Palabra clave siempre activa | Sí, con costo | FGS `microphone` permanente iniciado desde la app visible; indicador de micrófono de Android visible; batería; no se reinicia solo tras boot (Android 15) | MEDIA |
| Clip de audio tras disparo oculto | Sí si `microphone` FGS ya corre | Si no, Android 14+ lo bloquea | ALTA |
| Tracking en segundo plano | Sí | `ACCESS_BACKGROUND_LOCATION` + declaración Play con video + divulgación; la seguridad física califica como funcionalidad central | ALTA |
| Auto-llamada 123 | Con cuenta regresiva y desde contexto permitido | Límite de actividades en background; `CALL_PHONE` no es permiso restringido de Play | MEDIA-BAJA |
| Expo Go | No | Dev build obligatorio | ALTA |
| iOS | Fuera de alcance | (decisión del proyecto) | ALTA |

## Sources

- Expo SDK 57 `bundledNativeModules.json` (github.com/expo/expo, rama `sdk-57`) — versiones pineadas (ALTA)
- https://docs.expo.dev/versions/v57.0.0/sdk/location/ — foregroundService, plugin, permisos Play (ALTA)
- https://docs.expo.dev/versions/v57.0.0/sdk/audio/ — enableBackgroundRecording, presets (ALTA)
- https://docs.expo.dev/modules/module-api/ — DSL Kotlin, eventos, lifecycle (ALTA)
- https://docs.expo.dev/push-notifications/push-notifications-setup/ — FCM V1, dev build (ALTA)
- https://expo.dev/changelog/sdk-57 — RN 0.86, prebuild clean (ALTA); targetSdk 36/minSdk 24 por búsqueda web de la doc de Expo (MEDIA)
- https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start — while-in-use y exenciones (ALTA)
- https://developer.android.com/develop/background-work/services/fgs/service-types — tipos y permisos (ALTA)
- https://developer.android.com/about/versions/15/behavior-changes-15 — BOOT_COMPLETED, dataSync, SYSTEM_ALERT_WINDOW (ALTA)
- https://developer.android.com/about/versions/16/behavior-changes-16 — edge-to-edge, predictive back (ALTA)
- https://support.google.com/googleplay/android-developer/answer/13392821 — declaración FGS (ALTA)
- https://support.google.com/googleplay/android-developer/answer/10964491 — política AccessibilityService (ALTA)
- https://support.google.com/googleplay/android-developer/answer/9799150 — ubicación en segundo plano (MEDIA, vía resumen de búsqueda)
- https://developer.android.com/google/play/requirements/target-sdk — API 36 desde 2026-08-31 (ALTA)
- https://platform.claude.com/docs/en/models/overview — modelos, precios, solo texto/imagen, retiros (ALTA)
- https://www.nuget.org/packages/Anthropic (12.53.0), /Twilio (8.0.2), /OpenAI (2.14.0) (ALTA)
- https://www.twilio.com/en-us/guidelines/co/sms — Colombia (ALTA)
- https://developers.deepgram.com/docs/models-languages-overview — Nova-3 es / es-419 (ALTA); precio por búsqueda secundaria (BAJA-MEDIA)
- https://picovoice.ai/docs/porcupine/ y /docs/faq/general — español, AccessKey, sin plan personal (MEDIA; términos comerciales no confirmados)
- https://alphacephei.com/vosk/models — `vosk-model-small-es-0.42`, 39 MB, Apache 2.0 (ALTA)
- https://supabase.com/docs/guides/realtime/benchmarks — límites de Postgres Changes (MEDIA)
- npm registry (consultado 2026-10-06) — versiones de maplibre-gl, @vis.gl/react-maplibre, next, @supabase/*, etc. (ALTA)
- endoflife / devblogs.microsoft.com — .NET 8 EOL 2026-11-10 (ALTA)

## Brechas sin verificar (resolver en la fase correspondiente)

- Si `TelecomManager.placeCall()` está exento del límite de background para el 123.
- Headless JS con la app muerta bajo Expo SDK 57 (spike de 1 día antes de comprometer la arquitectura SOS).
- Supabase Storage: signed upload URL, tamaño/MIME permitidos y detalle de cifrado en reposo.
- Versión actual de `com.alphacephei:vosk-android` en Maven Central y consumo de batería real con el micrófono continuo.
- Entregabilidad real de Twilio a operadores colombianos (Claro, Movistar, Tigo) y plazo del short code.
- Precios y términos de Picovoice para uso comercial; WER real de Deepgram vs OpenAI con clips en español colombiano.
- Si Play acepta `specialUse` para este caso (solo se sabe al enviar la declaración).

---
*Stack research for: app Android de seguridad personal (AlertaYA)*
*Researched: 2026-10-06*
