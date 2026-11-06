# Fase 1: SOS de punta a punta - Research

**Researched:** 2026-10-06
**Domain:** App Android Expo (SOS + cuenta regresiva + estados honestos) + API .NET 8 (outbox, Twilio, ProblemDetails, OpenAPI) + Supabase (migraciones, Auth) + página pública de seguimiento (Next.js en Vercel)
**Confidence:** MEDIA-ALTA (versiones y APIs verificadas; comportamiento real de Twilio en Colombia y del hosting con túnel requiere spike/confirmación)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** El botón SOS de la pantalla de inicio se activa **manteniéndolo presionado 2 s**, con un anillo que se llena (evita toques accidentales).
- **D-02:** Cuenta regresiva por defecto de **5 s** (estándar Google/Samsung). Debe ser un valor configurable por perfil (la fase 3 expone el ajuste); la columna existente `profiles.ventana_confirmacion_segundos` tiene default 4 → la migración la alinea a 5.
- **D-03:** La cuenta regresiva es **pantalla completa roja**: número gigante, glow rojo pulsante, vibración en cada segundo y un botón grande **CANCELAR**. Sin sonido.
- **D-04:** Al llegar a 0 navega **directo a la pantalla de alerta activa** (sin pantalla de confirmación "enviada": la veracidad la dan los estados por contacto).
- **D-05:** Texto del SMS directo y urgente, auto-identificado (el remitente llega como número desconocido), sin tildes para caber en un segmento GSM-7: `AlertaYA: <Nombre> activo una alerta de emergencia. Ubicacion en vivo: <link>. Si no responde, llama al 123.` En Twilio trial el proveedor antepone "Sent from your Twilio trial account" — aceptado para la demo.
- **D-06:** La página pública del link muestra: **mapa en vivo** (pin con última ubicación, círculo de precisión, "hace X s"), **nombre de la persona y estado** de la alerta (activa / finalizada), **botones** llamar a la persona, llamar al 123 y abrir en Google Maps, y el **trayecto** desde el inicio de la alerta. Sin GPS muestra "ubicación pendiente", nunca una coordenada sustituta.
- **D-07:** El link deja de mostrar ubicación **1 h después de finalizada la alerta**; luego muestra "alerta finalizada" sin datos de ubicación. Token opaco no adivinable, revocable.
- **D-08:** El link se sirve desde un **subdominio gratuito** (p. ej. Vercel) para la demo.
- **D-09:** En esta fase la alerta termina con un botón **"Estoy a salvo"** (mantener presionado 3 s): la alerta pasa a finalizada, los contactos reciben un SMS de que la persona está a salvo y el link pasa a "finalizada". El PIN se agregará encima en la fase 5 (SOS-05).
- **D-10:** La pantalla de alerta activa muestra: **estado por contacto** (en cola / enviado / entregado / fallido; "entregado" solo con DLR del proveedor), **mini mapa** con lo que ven los contactos (precisión y antigüedad o "ubicación pendiente"), **cronómetro** de tiempo activo y botón **compartir link** (share nativo de Android).
- **D-11:** Si el SMS a un contacto falla: **reintento automático 2 veces**; si sigue fallando se muestra "Falló" en rojo con la opción de **llamar a ese contacto** directamente.
- **D-12:** Si la persona sale de la app, la alerta **sigue activa**; al reabrir la app se abre directamente la pantalla de alerta activa. (El tracking con pantalla apagada real es de la fase 2; en esta fase se envía ubicación mientras la app está en primer plano.)
- **D-13:** **No hay presupuesto**: todo debe ser gratuito. Restricción que aplica a todo el proyecto.
- **D-14:** SMS con **Twilio trial** (crédito gratis, DLR por webhook de estado, solo a números verificados). Se verifican el número de Roberto y 1–2 más (idealmente de operadores distintos: Claro/Movistar/Tigo). El acceso al proveedor va detrás de un puerto (`ISmsSender`) para poder cambiarlo sin tocar el dominio. — **Reversibility:** reversible — detrás de interfaz.
- **D-15:** API .NET corre en la **PC de Roberto expuesta con Cloudflare Tunnel** (HTTPS público gratis; la PC debe estar prendida en la demo). Azure F1 descartado porque se duerme y mata los workers.
- **D-16:** Página del link (y luego el panel) en **Vercel plan gratuito**; BD y Auth en el **Supabase gratuito** existente (`vzyasmeeyvbkpoiosses`).
- **D-17:** Android **development build compilado localmente** (Gradle/Android Studio), no EAS de pago. Pruebas y demo en el **teléfono Android personal de Roberto**.

### Claude's Discretion
- Redacción exacta del SMS de "a salvo" y textos de UI dentro del tono definido.
- Intervalo de envío de ubicación en primer plano y de polling de la página del link.
- Política de backoff de los 2 reintentos de SMS.
- Estructura de navegación (Expo Router), librería de mapas gratuita (MapLibre/OSM) y layout de login/registro/contactos siguiendo el diseño del legacy.

### Deferred Ideas (OUT OF SCOPE)
- Costo de la API de Claude para la IA (fase 4): no hay presupuesto → evaluar reglas heurísticas sin LLM, créditos gratuitos o modelo gratuito al discutir la fase 4.
- Remitente SMS sin prefijo de trial / short code en Colombia → requiere pago (PLAT-V2-03).
- Hosting siempre encendido sin depender de la PC de Roberto → post-demo, cuando haya presupuesto o una opción gratuita confiable.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Registro con correo y contraseña | supabase-js `signUp` con `options.data`; el trigger `handle_new_user` ignora metadata (migración o PATCH de perfil); "Confirm email" a desactivar con confirmación de Roberto |
| AUTH-02 | Login y sesión persistente | Cliente supabase-js con adaptador `expo-secure-store`, `persistSession`, `autoRefreshToken`, AppState; guardia de sesión en Expo Router |
| CONT-01 | CRUD de contactos (nombre, teléfono, relación) | `EmergencyContactsController` ya existe; falta validación E.164 +57, duplicado (409), ProblemDetails, tests de ownership |
| SOS-01 | Disparar alerta con botón SOS | `HoldButton` Reanimated 4 + `scheduleOnRN`; `canal_activacion = boton_pulsado` |
| SOS-02 | Cuenta regresiva con vibración, cancelable | Pantalla `countdown` con deadline absoluto, `Vibration`, BackHandler deshabilitado; duración desde `profiles.ventana_confirmacion_segundos` |
| SOS-03 | Alerta guardada local antes de red; reintento sin duplicar | `clientGeneratedId` + almacenamiento local (SecureStore) + loop de sync; índice único `(user_id, client_generated_id)`; handler transaccional |
| SOS-04 | Pantalla de alerta activa con estado real por contacto | `notification_deliveries` como fuente de verdad; `DeliveryStatus` única ruta de pintado; "entregado" solo desde webhook firmado |
| NOTI-01 | SMS por Twilio con nombre y link | `ISmsSender` + `TwilioSmsSender`; `SmsTextBuilder` GSM-7; spike día 1 |
| NOTI-03 | Link público sin login con mapa, antigüedad y estado; expira y es revocable | `GET /api/public/tracking/{token}`; token HMAC-derivado + hash SHA-256; ventana de 1 h tras `finalizada_en`; página Next.js en Vercel |
| NOTI-04 | Nada se pierde si el servidor se reinicia; estado de entrega con confirmación del proveedor | Outbox Postgres + función `claim_deliveries` con `SKIP LOCKED` + lease; webhook `X-Twilio-Signature` |
| UBIC-02 | Sin GPS, alerta con "ubicación pendiente"; nunca ubicación sustituta; precisión y antigüedad | `location = null` end-to-end; `captured_at` del fix; validación servidor rechaza (0,0); UI/página con estado pendiente |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directivas extraídas de `./CLAUDE.md`, `./.claude/CLAUDE.md` y `apps/mobile/AGENTS.md` (tratadas como decisiones bloqueadas):

- Vocabulario de dominio, columnas BD, estados y mensajes de error en **español**; infraestructura/framework en inglés; comentarios y XML docs en español. Constantes como `static class` con `Todos` y `EsValido(...)` (no enums).
- `userId` siempre del claim `sub` del JWT; ownership en la query (404 para ajeno); controllers aceptan y propagan `CancellationToken`; DTOs con `static From(entity)`.
- Clean Architecture + SOLID (decisión del usuario). API en `net8.0`, `Nullable` habilitado.
- Mobile: `npx expo install <pkg>` siempre (nunca npm add); rutas en `src/app/`; no editar `android/` a mano (CNG/config plugins); consultar docs versionadas `https://docs.expo.dev/versions/v57.0.0/`; **correr `npx expo lint` y `npx tsc --noEmit` antes de dar una tarea por terminada**.
- **Veracidad:** la app nunca afirma un envío que no ocurrió ni usa una ubicación sustituta.
- **BD:** cambios de esquema solo como migraciones versionadas; **nada se aplica al remoto sin confirmación de Roberto** (incluye cambios de configuración de Auth y la tabla de historial de migraciones).
- Presupuesto cero (D-13). Solo Android. Demo 2026-10-15.
- Enforcement GSM: no editar fuera de un flujo GSM.

## Summary

La fase es un **walking skeleton de producción**: el recorrido login → contacto → mantener SOS 2 s → cuenta regresiva 5 s → alerta guardada local → `POST /api/alerts` transaccional (alerta + token + una fila de entrega por contacto) → worker envía SMS por Twilio → webhook firmado actualiza el estado → página pública muestra ubicación real o "pendiente". Casi todo el back "de verdad" (outbox, Twilio, webhook, endpoint público, estado `finalizada`) es nuevo; solo se reutilizan la máquina de estados, la idempotencia por `clientGeneratedId` y el CRUD de contactos. El front móvil (`apps/mobile`) y la página web (`apps/web`) se construyen desde cero.

Hallazgos que cambian el plan (detalle en Pitfalls y Open Questions):
1. **D-15 (Cloudflare Tunnel) necesita un hostname estable.** Los Quick Tunnels cambian de URL en cada ejecución y no tienen garantía de uptime; un túnel con nombre exige un dominio agregado a Cloudflare. La URL del API está incrustada en el build del móvil, en la página Vercel y en el `StatusCallback` de Twilio.
2. **D-05 no cabe en un segmento GSM-7** con link de 52+ caracteres: el texto fijo mide 146 caracteres con link de 128 bits en `alertaya.vercel.app`, deja 14 caracteres para el nombre y en trial Twilio antepone 38 caracteres más. Se enviarán 2 segmentos salvo que Roberto acepte recortar el texto.
3. **Vercel Hobby es "non-commercial, personal use only"** (doc oficial); aceptable para una demo interna, riesgo si es piloto con policía.
4. **Entorno de Roberto incompleto:** sin Docker, Supabase CLI, cloudflared, JDK 17, Android SDK (carpeta vacía) ni adb; `LongPathsEnabled = 0`. `supabase db pull` y Testcontainers requieren Docker.
5. **El trigger `handle_new_user` ignora `raw_user_meta_data`** (perfil con `nombre=''`, `telefono=''`): el SMS saldría sin nombre. Hay que cambiar el trigger por migración o completar el perfil tras el registro.
6. **Máquina de estados insuficiente:** no existe estado terminal "a salvo"; las alertas nacen `pendiente` y solo un worker en memoria las pasa a `activa` (tras un reinicio quedan `pendiente` y `POST location` responde 409); `PATCH /api/alerts/{id}` deja al usuario fijar estados arbitrarios.
7. **DLR en Colombia es incierto:** Twilio documenta que no todos los operadores devuelven recibos (queda en `sent`). La UI ya es honesta con "Enviado — esperando confirmación"; el spike del día 1 decide si el demo puede mostrar "Entregado".

**Primary recommendation:** Planificar como tracer-first con un spike Twilio + decisión de hostname estable el día 1; el primer corte vertical es login → SOS → alerta con filas `queued` → 1 SMS real → página pública con "ubicación pendiente", y sobre él se agregan ubicación, webhook/reintentos, robustez offline/reinicio y "Estoy a salvo". Outbox propio en Postgres (función `claim_deliveries` + `SKIP LOCKED`), sin Hangfire ni MediatR.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Registro/login y sesión persistente | Browser/Client (app Expo + supabase-js) | Supabase Auth | Auth emite el JWT; la app solo lo guarda (SecureStore) y lo refresca |
| Mantener 2 s / cuenta regresiva / vibración | Client (app) | — | 100 % local; no depende de red (SOS-03) |
| Persistir la alerta antes de la red + reintento | Client (almacenamiento local) | API | El cliente genera `clientGeneratedId`; el API garantiza idempotencia |
| Crear alerta, token, entregas | API / Backend (handler transaccional) | Database | Una transacción; unique `(user_id, client_generated_id)` |
| Cola durable y envío de SMS | API / Backend (worker `DeliveryDispatcher`) | Database (outbox) | La tabla es la cola y el registro visible |
| Proveedor SMS | Externo (Twilio) detrás de `ISmsSender` | — | Intercambiable (D-14) |
| Estado de entrega "entregado" | API (webhook firmado) | Database | Solo el callback del proveedor escribe `delivered` |
| Ubicación (captura) | Client (expo-location en primer plano) | — | Mientras la app esté en primer plano (D-12) |
| Ubicación (almacén, trayecto, antigüedad) | API / Database | — | `captured_at` del fix + `serverNow` para antigüedad |
| Máquina de estados de alerta | Domain (.NET) | — | Fuente única de transiciones, con tests |
| Página pública `/t/[token]` | Frontend (Next.js en Vercel, cliente) | API (endpoint anónimo) | Shell estático + polling; sin supabase-js ni Realtime |
| Exposición HTTPS del API | PC de Roberto + túnel | — | Hostname estable pendiente (Open Question 1) |
| Contrato tipado API ↔ móvil | API (OpenAPI) | Client (openapi-fetch) | `openapi.json` versionado, tipos generados |
| Esquema y RLS | Database (migraciones Supabase CLI) | — | Fuente de verdad; EF solo mapea |

## Standard Stack

### Core — móvil (`apps/mobile`, Expo SDK 57 / RN 0.86.3 / React 19.2.3)

Versiones de los pins de Expo `[VERIFIED: raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/bundledNativeModules.json]`; instalar con `npx expo install` (resuelve el pin).

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-router | ~57.0.25 | Navegación en `src/app/` | Lo exige `AGENTS.md`; `main` pasa a `expo-router/entry` |
| expo-dev-client | ~57.0.19 | Development build | Expo Go no incluye MapLibre |
| expo-location | ~57.0.20 | Permiso y fixes en primer plano | `requestForegroundPermissionsAsync`, `hasServicesEnabledAsync`, `watchPositionAsync` `[CITED: docs.expo.dev/versions/v57.0.0/sdk/location]` |
| expo-secure-store | ~57.0.4 | Sesión Supabase y alerta pendiente | Android: SharedPreferences cifrado con Keystore; sin límite de tamaño declarado en Android `[CITED: docs.expo.dev/versions/v57.0.0/sdk/securestore]` |
| expo-haptics / expo-keep-awake | ~57.0.3 / ~57.0.2 | Háptico de holds; pantalla encendida | UI-SPEC |
| expo-font + @expo-google-fonts/dm-sans | ~57.0.4 / 0.4.2 | DM Sans 400/600 | El paquete de fuentes no está en el pin: `expo install` lo resuelve |
| expo-linear-gradient, react-native-svg | ~57.0.2 / 15.15.4 | Glow rojo y anillo de progreso | UI-SPEC |
| react-native-reanimated + react-native-worklets | 4.5.1 / 0.10.1 | Escala, pulso, progreso de hold en UI thread | Pin SDK 57; `scheduleOnRN` y `runOnJS` exportados en worklets 0.10.1 `[VERIFIED: package/lib/typescript/index.d.ts del tarball react-native-worklets@0.10.1]` |
| react-native-screens / safe-area-context / gesture-handler | ~4.26.0 / ~5.7.0 / ~2.32.0 | Requeridos por Expo Router | Pin SDK 57 |
| @react-native-community/netinfo | 12.0.1 | Reintentar sync al volver la red; banner "Sin conexión" | Pin SDK 57 |
| @expo/vector-icons | ^15.0.2 | `MaterialIcons` (mismo set del legacy) | Pin SDK 57 |
| expo-system-ui | ~57.0.4 | Color de fondo raíz oscuro (sin flash blanco) | Pin SDK 57 |
| @supabase/supabase-js | 2.117.2 | Auth (registro/login/refresh) | `[VERIFIED: npm registry]` publicado 2026-09-25; cliente RN con `detectSessionInUrl: false` `[CITED: supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native]` |
| @tanstack/react-query | 5.104.1 | Contactos y polling del estado de la alerta (`refetchInterval`) | Evita hand-roll de polling/retry |
| zustand | 5.0.15 | Estado local de la alerta activa | Ya elegido en STACK.md |
| zod | 4.6.5 | Validar respuestas en el borde y formularios | STACK.md |
| openapi-fetch + openapi-typescript (dev) | 0.17.0 / 7.13.0 | Cliente tipado desde `openapi.json`; middleware `onRequest` para el Bearer `[CITED: openapi-ts.dev/openapi-fetch/middleware-auth]` | Sin runtime de codegen |
| @maplibre/maplibre-react-native | 11.5.0 | Mini mapa no interactivo | Peers `expo >=54`, `react-native >=0.80`; v11 solo nueva arquitectura; plugin `"@maplibre/maplibre-react-native"` en `app.json`; no funciona en Expo Go `[CITED: maplibre.org/maplibre-react-native/docs/setup/expo]` |
| react-native-webview | 13.16.1 | **Solo plan B** si MapLibre RN falla en SDK 57 | Pin SDK 57 |
| expo-splash-screen | (instalar con `expo install`) | Splash mientras se resuelve la sesión | UI-SPEC (nunca parpadeo de login) |

Mobile testing (dev): `jest-expo ~57.0.5` (usa Jest 29 y `@react-native/jest-preset ^0.86.3` como peer), `jest`, `@types/jest`. Tests de componentes con `@testing-library/react-native` 14.0.1 requieren además `test-renderer` ^1.0.0 `[ASSUMED]` (compatibilidad con jest-expo 57 sin probar); en esta fase basta lógica pura.

### Core — web pública (`apps/web`, Vercel)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^16 (latest 16.4.0, `engines.node >=20.9.0`) | Página `/t/[token]` | Decisión de UI-SPEC |
| react / react-dom | 19.x (react-dom 19.3.0) | UI | Next 16 |
| maplibre-gl | 6.13.0 | Mapa; estilo OpenFreeMap `dark` | Sin API key; atribución obligatoria "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" `[CITED: openfreemap.org/quick_start]` |
| vitest (dev) | 5.0.3 | Tests de lógica pura (estado de la página, formato de antigüedad) | Ligero |

Recomendación (ponytail): usar `maplibre-gl` directo en un componente cliente (`next/dynamic`, `ssr:false`) y **omitir `@vis.gl/react-maplibre`**; es un único mapa. UI-SPEC lo menciona como opción, el planner puede decidir.

### Core — API (.NET 8)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Twilio (NuGet) | 8.0.2 | `MessageResource.CreateAsync`, `RequestValidator` | SDK oficial `[CITED: STACK.md; nuget.org versions API lista 8.0.2]` |
| Swashbuckle.AspNetCore | 6.6.2 (ya instalado) | OpenAPI | En .NET 8 los controllers siguen con Swashbuckle (la generación nativa de controllers llega en .NET 9) |
| Swashbuckle.AspNetCore.Cli (dotnet tool) | 6.6.2 | `dotnet swagger tofile` → `openapi.json` | Misma versión que el paquete `[VERIFIED: nuget.org: 6.6.1, 6.6.2, 8.0.0]` |
| EF Core + Npgsql (+NTS) | 8.* (ya) | Mapeo; sin EF migrations | Esquema lo manda Supabase CLI |
| Microsoft.AspNetCore.RateLimiting / ProblemDetails / IExceptionHandler / TimeProvider | incluidos en .NET 8 | Rate limit público, errores RFC 9457, reloj inyectable | No agregar paquetes |

Tests API: `xunit 2.9.3`, `xunit.runner.visualstudio 3.1.4`, `coverlet.collector 6.0.4` (versiones del legacy `[CITED: .planning/codebase/TESTING.md]`), `Microsoft.NET.Test.Sdk` 18.10.1, `Microsoft.AspNetCore.Mvc.Testing` 8.0.31 `[VERIFIED: nuget.org]`, `Microsoft.Extensions.TimeProvider.Testing` 9.10.0 (nuspec incluye `net8.0` `[VERIFIED: nuget.org nuspec]`), `Testcontainers.PostgreSql` 4.15.0 `[ASSUMED]` (requiere Docker).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare named tunnel (requiere dominio en Cloudflare) | Tailscale Funnel (hostname estable `*.ts.net`, gratis en plan Personal, beta, puertos 443/8443/10000) `[CITED: tailscale.com/kb/1223/funnel]` o ngrok con 1 dominio estático gratuito `[CITED: ngrok.com/blog/free-static-domains-ngrok-users]` | Contradice D-15 literal; decisión de Roberto (Open Question 1) |
| Vercel Hobby | Cloudflare Pages / Netlify | Hobby: "non-commercial, personal use only" `[CITED: vercel.com/docs/plans/hobby]` |
| SecureStore para todo | AsyncStorage / expo-sqlite | Una dependencia nativa menos; SQLite llega en fase 2 si se necesita buffer de lotes |
| Token aleatorio guardado en claro | Token derivado por HMAC + hash SHA-256 en BD | Ver Pattern 4 |

**Installation:**
```bash
# apps/mobile
npx expo install expo-router expo-dev-client expo-location expo-secure-store expo-haptics expo-keep-awake \
  expo-font @expo-google-fonts/dm-sans expo-linear-gradient react-native-svg react-native-reanimated \
  react-native-worklets react-native-screens react-native-safe-area-context react-native-gesture-handler \
  @react-native-community/netinfo @expo/vector-icons expo-system-ui expo-splash-screen \
  @maplibre/maplibre-react-native react-native-url-polyfill
npm install @supabase/supabase-js @tanstack/react-query zustand zod openapi-fetch
npm install -D openapi-typescript
npx expo install jest-expo jest @types/jest -- --save-dev
# apps/web
npm install next@16 react react-dom maplibre-gl && npm install -D vitest typescript
# apps/api
dotnet add package Twilio --version 8.0.2
dotnet new tool-manifest && dotnet tool install Swashbuckle.AspNetCore.Cli --version 6.6.2
```

**Version verification:** versiones de npm confirmadas con `npm view` el 2026-10-06 (supabase-js 2.117.2, openapi-fetch 0.17.0, openapi-typescript 7.13.0, next 16.4.0, maplibre-gl 6.13.0, maplibre-react-native 11.5.0, zustand 5.0.15, react-query 5.104.1, zod 4.6.5, vitest 5.0.3); NuGet confirmado con la API de nuget.org.

## Package Legitimacy Audit

Ejecutado `gsd-tools query package-legitimacy check --ecosystem npm` el 2026-10-06. **Todos los `SUS` son únicamente `too-new`** (último release publicado hace < ~14 días) en paquetes de millones de descargas semanales y repositorio oficial; ninguno tiene `postinstall`. Disposición: aprobados, con **un único `checkpoint:human-verify` consolidado** antes del primer `npm install` (revisar `package-lock.json` y fijar versiones del pin de Expo / versión > 14 días). El seam no cubre NuGet.

| Package | Registry | Último release | Descargas/sem | Repo | Verdict | Disposition |
|---------|----------|----------------|---------------|------|---------|-------------|
| @supabase/supabase-js | npm | 2026-09-25 | 35.0M | supabase/supabase-js | SUS (too-new) | Aprobado, checkpoint consolidado |
| openapi-fetch / openapi-typescript | npm | 2026-02-11 | 12.0M / 10.3M | openapi-ts/openapi-typescript | OK | Aprobado |
| next | npm | 2026-10-06 | 76.9M | vercel/next.js | SUS (too-new) | Aprobado, fijar 16.3.x si se quiere > 14 d |
| maplibre-gl | npm | 2026-10-06 | 6.9M | maplibre | SUS (too-new) | Aprobado, checkpoint |
| @maplibre/maplibre-react-native | npm | 2026-10-04 | 262K | maplibre/maplibre-react-native | SUS (too-new) | Aprobado, checkpoint; peers verificados |
| @tanstack/react-query | npm | 2026-10-02 | 82.8M | TanStack/query | SUS (too-new) | Aprobado, checkpoint |
| zod | npm | 2026-09-13 | 387M | colinhacks/zod | SUS (too-new) | Aprobado, checkpoint |
| zustand | npm | 2026-08-13 | 71.5M | pmndrs/zustand | OK | Aprobado |
| vitest | npm | 2026-09-30 | 142M | vitest-dev/vitest | SUS (too-new) | Aprobado, checkpoint |
| jest-expo, @testing-library/react-native | npm | 2026-08-26 / 2026-06-23 | 4.0M / 5.1M | expo / callstack | OK | Aprobado |
| test-renderer | npm | 2026-09-17 | 1.8M | mdjastrzebski/test-renderer | SUS (too-new) | Solo si se hacen tests de componentes |
| @expo-google-fonts/dm-sans, react-native-url-polyfill, react-native-svg, @react-native-community/netinfo, react-native-webview, @expo/vector-icons | npm | varios | 0.3M–10M | oficiales | OK | Aprobado |
| react-native-reanimated, react-native-worklets, expo-router, expo-location, expo-secure-store, expo-haptics, expo-keep-awake, expo-dev-client, expo-font, expo-linear-gradient, react-native-screens, react-native-safe-area-context, react-native-gesture-handler, expo-system-ui | npm | 2026-09-11 a 2026-10-06 | 2.9M–12.4M | expo / software-mansion | SUS (too-new) | Instalar solo con `npx expo install` (pin oficial SDK 57) |
| supabase (CLI vía npx) | npm | 2026-10-06 | 6.2M | supabase/cli | SUS (too-new) | Usar `npx supabase@2.120.0`; checkpoint |
| Twilio, xunit, Swashbuckle.AspNetCore.Cli | NuGet | — | — | twilio / xunit / domaindrivendev | n/a (seam no cubre NuGet) | Twilio `[CITED: STACK.md]`; los demás ya usados en el repo/legacy |
| Testcontainers.PostgreSql, Microsoft.Extensions.TimeProvider.Testing, Microsoft.AspNetCore.Mvc.Testing | NuGet | — | — | testcontainers / dotnet | n/a | `[ASSUMED]` (nombres descubiertos en ARCHITECTURE.md/training; existen en nuget.org): incluir en el checkpoint consolidado |

**Packages removed due to [SLOP] verdict:** ninguno.
**Packages flagged [SUS]:** ver tabla; un único checkpoint consolidado (el planner no necesita ocho).

## Environment Availability

Probado en la PC de Roberto el 2026-10-06.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| .NET SDK 8 | API | ✓ | 8.0.420 (también 10.0.302) | — |
| Node / npm | mobile, web | ✓ | v24.19.0 / 11.17.0 (RN 0.87 pide ≥ 22.11; Next ≥ 20.9) | — |
| git, winget | tooling | ✓ | git 2.54.0; winget presente | — |
| Docker Desktop | `supabase db pull`, `db dump`, Testcontainers, pgTAP | ✗ | winget `Docker.DockerDesktop` 4.94.0; `HypervisorPresent=True`, 14.8 GB RAM | `pg_dump` desde cliente PostgreSQL + inspección read-only por MCP Supabase; tests de integración manuales |
| Supabase CLI | baseline + migraciones | ✗ | `npx supabase` 2.120.0 disponible | — |
| cloudflared | túnel D-15 | ✗ | winget `Cloudflare.cloudflared` 2026.10.0 | Tailscale Funnel / ngrok (Open Question 1) |
| JDK 17 | build Android | ✗ (hay JDK 21.0.8 en `C:\Program Files\Android\openjdk\jdk-21.0.8`, fuera del PATH) | winget `Microsoft.OpenJDK.17` | RN: "JDK 17 recomendado... problemas con versiones superiores" `[CITED: reactnative.dev/docs/set-up-your-environment]` |
| Android SDK (platform 36, build-tools 36.0.0, platform-tools) | build Android | ✗ (`%LOCALAPPDATA%\Android\Sdk\cmdline-tools` existe vacío) | winget `Google.AndroidStudio` 2026.2.1.8 o `sdkmanager` | EAS Build free (queda fuera de D-17; requiere confirmar) |
| adb / `ANDROID_HOME` | instalar APK | ✗ / sin definir | — | Android Studio |
| Windows LongPathsEnabled | CMake/Gradle con nueva arquitectura | ✗ (`0x0`) | requiere admin | Proyecto en ruta corta |
| psql | inspección | ✗ | — | MCP Supabase (solo lectura) |
| Cuentas: Twilio, Vercel, Cloudflare, token Supabase CLI + contraseña BD | externos | desconocido | — | Roberto debe crearlas el día 1 |
| Teléfono Android con depuración USB | demo | desconocido | — | Emulador (no sirve para vibración/GPS reales) |

**Missing dependencies with no fallback:** JDK 17 y Android SDK (instalables; bloquean el development build), hostname estable del API (bloquea SMS con link funcional).
**Missing dependencies with fallback:** Docker (instalar; alternativa limitada), cloudflared (winget).

## Architecture Patterns

### System Architecture Diagram

```
 [Teléfono Android: app Expo]
   Hold 2 s ─► Countdown 5 s (local, vibra, CANCELAR) ─► guarda PendingAlert (SecureStore, clientGeneratedId)
        │                                                        │
        │ GPS en primer plano (fix real o null)                  ▼ sync loop (NetInfo/AppState, backoff)
        │                                         POST /api/alerts  (Bearer JWT Supabase)
        │                                                        │   [sin red: reintenta con el MISMO id]
        ▼                                                        ▼
   Pantalla /alert  ◄── poll GET /api/alerts/{id}/status ──  API .NET (PC de Roberto, túnel HTTPS)
   (estado por contacto,      cada 3 s                       ┌──────────────────────────────────────┐
    mini mapa, cronómetro)                                   │ CreateAlertHandler [1 transacción]   │
        │                                                    │  alerts(activa) + tracking_links +   │
        │ POST /{id}/location (5 s)                          │  notification_deliveries(queued x    │
        │ POST /{id}/finish  ("Estoy a salvo")               │  contacto, snapshot nombre/teléfono) │
        ▼                                                    └───────────────┬──────────────────────┘
   (misma API)                                                               ▼  Postgres (Supabase)
                                              DeliveryDispatcher (BackgroundService, poll 2 s + hint Channel)
                                              claim_deliveries() SKIP LOCKED + lease ─► ISmsSender ─► Twilio
                                                                                          │ SID ⇒ status=sent
 Twilio ──POST /webhooks/twilio/status (X-Twilio-Signature)──► ApplyProviderStatus ──► delivered | retry | failed
                                                                                          
 Contacto abre SMS ─► https://<proyecto>.vercel.app/t/<token> (Next.js, sin login)
        └─ fetch cada 5 s ─► GET /api/public/tracking/{token} (anónimo, rate limit, CORS solo Vercel, no-store)
              └─ pin + precisión + "hace X s" | "ubicación pendiente" | "finalizada" (+1 h sin datos)
```

### Recommended Project Structure

```
apps/api/
├── AlertaYA.sln                      # + 4 proyectos src + tests
├── src/
│   ├── AlertaYA.Domain/              # AlertEstados(+finalizada), AlertStateMachine, DeliveryEstados, DeliveryRetryPolicy, SmsTextBuilder, TrackingToken
│   ├── AlertaYA.Application/         # Alerts/{CreateAlert,AddLocation,FinishAlert,GetAlertStatus,GetTrackingView}, Notifications/ApplyProviderStatus, Abstractions/{IApplicationDbContext,ISmsSender}
│   ├── AlertaYA.Infrastructure/      # Persistence/AppDbContext, Sms/TwilioSmsSender, Workers/DeliveryDispatcher
│   └── AlertaYA.Api/                 # Controllers, WebhooksController, Program.cs, ProblemDetails, rate limiter, CORS
├── tests/{AlertaYA.Domain.Tests, AlertaYA.Application.Tests, AlertaYA.Api.IntegrationTests}
└── openapi.json                      # exportado y versionado
apps/mobile/src/
├── app/                              # rutas (UI-SPEC "Mapa de pantallas")
├── theme/tokens.ts  i18n/es.ts
├── components/{ui/, HoldButton, DeliveryStatus, LocationMiniMap, ContactRow, Avatar}
├── features/{auth, contacts, alert}/ # api calls, hooks, lógica pura testeable
└── lib/{supabase.ts, api.ts (openapi-fetch), storage.ts, phone.ts}
apps/web/src/app/t/[token]/           # page.tsx, TrackingView.tsx (cliente), lib/trackingState.ts
supabase/{config.toml, migrations/0000_baseline + 0001_..., tests/}
```

Refactor a 4 proyectos **solo en el corte alerta/entregas** (Anti-Pattern 8 de ARCHITECTURE.md): mover mecánicamente `Domain/` (+ entidades) → `AlertaYA.Domain`, `AppDbContext` → Infrastructure; los controllers de perfiles/contactos pueden seguir en Api referenciando Infrastructure hasta que se migren. Borrar la carpeta EF `Migrations/` (la BD no tiene `__EFMigrationsHistory`) `[CITED: INTEGRATIONS.md]`.

### Pattern 1: Outbox transaccional + función `claim_deliveries`

**What:** `CreateAlertHandler` inserta en una sola transacción la alerta, el enlace de seguimiento y una fila `notification_deliveries` por contacto (`status='queued'`, snapshot de nombre y teléfono E.164, `kind='alert'`). El worker reclama filas con `FOR UPDATE SKIP LOCKED` + lease y recupera `sending` vencidos tras un reinicio.
**Por qué función SQL:** EF Core compone `FromSql` como subquery (`SELECT ... FROM (<sql>)`); un `WITH ... UPDATE ... RETURNING` directo no es composable `[CITED: learn.microsoft.com/ef/core/querying/sql-queries]`. Una función que devuelve `setof` sí lo es; llamar `FromSql($"select * from private.claim_deliveries({n}, {lease})")` sobre el `DbSet`. Comportamiento exacto con Npgsql `[ASSUMED]` → cubrir con test de integración. Revocar `EXECUTE` a `public, anon, authenticated` y ponerla en esquema `private` (si no, queda expuesta como RPC de PostgREST).

Estados de entrega propuestos (vocabulario español en BD/constantes, `Todos`/`EsValido` como el resto del repo): `queued → sending → sent → delivered | failed`, `retry` (con `next_attempt_at`), `cancelled`. Mapeo a UI-SPEC: `queued|sending|retry → En cola` (+ "Reintentando (n de 2)"), `sent → Enviado`, `delivered → Entregado`, `failed → Falló`. `sent` significa "Twilio aceptó el mensaje" (SID recibido); `delivered` **solo** lo escribe el webhook firmado (`MessageStatus=delivered`) `[CITED: twilio.com/docs/messaging/api/message-resource — "delivered: confirmation of delivery from the upstream carrier"]`.

### Pattern 2: Máquina de estados ampliada y creación directa en `activa`

Estado actual `[VERIFIED: apps/api/AlertaYA.Api/Domain/AlertStateMachine.cs:21-26]`:
```csharp
[AlertEstados.Pendiente] = new[] { AlertEstados.Activa, AlertEstados.Descartada },
[AlertEstados.Activa] = new[] { AlertEstados.Verificando },
[AlertEstados.Verificando] = new[] { AlertEstados.Escalada, AlertEstados.Atendida, AlertEstados.Descartada },
[AlertEstados.Escalada] = new[] { AlertEstados.Atendida, AlertEstados.Descartada },
```
Valores `[VERIFIED: AlertValues.cs:5-10]`: `pendiente`, `activa`, `verificando`, `escalada`, `atendida`, `descartada`; canal del botón `[VERIFIED: AlertValues.cs:22]` `BotonPulsado = "boton_pulsado"`. Cambios propuestos (nombre `finalizada` es propuesta, no valor existente):
- Agregar `AlertEstados.Finalizada = "finalizada"` (terminal, "a salvo") con transiciones desde `pendiente`, `activa`, `verificando`, `escalada`. La BD tiene `estado` text + CHECK `[CITED: INTEGRATIONS.md]` → la migración debe reemplazar el CHECK (nombre a leer del baseline).
- **Crear la alerta directamente en `activa`** (la cuenta regresiva del cliente ya la confirmó): hoy `pendiente → activa` depende del `VerificationWorker` en memoria; tras un reinicio queda `pendiente` y `AddLocation` responde 409 (`EstadosReceptoresDeUbicacion` solo admite activa/verificando/escalada `[VERIFIED: AlertsController.cs:20-23]`).
- Restringir `PATCH /api/alerts/{id}`: hoy cualquier estado válido de la tabla puede fijarse por el dueño. Reemplazar por `POST /{id}/finish` (única transición de usuario en la fase).
- Tests de matriz completa (estados × estados) en `AlertaYA.Domain.Tests` (criterio de éxito de la fase).

### Pattern 3: Idempotencia end-to-end y alerta local primero

1. El cliente genera `clientGeneratedId` (UUID v4) **al llegar la cuenta a 0** y persiste `PendingAlert { clientGeneratedId, createdAtLocal, channel, location|null, state }` en SecureStore **antes** de cualquier red (SOS-03); navega a `/alert` (D-04).
2. Sync loop: `POST /api/alerts` con el mismo id; backoff 2 s → 30 s; se dispara al volver `NetInfo.isConnected` y en `AppState=active`. 201 repetido devuelve la existente (ya implementado, con la carrera cubierta por `IsViolacionUnico` `[VERIFIED: AlertsController.cs:107-118]`).
3. Servidor: único `(user_id, client_generated_id)` en `alerts` y único `(alert_id, contact_id, channel, kind)` en entregas → "una alerta, un SMS por contacto".
4. UI honesta offline: banner "Sin conexión", contactos "En cola", cronómetro desde `createdAtLocal` hasta que el servidor devuelva `createdAt`.
5. Riesgo residual at-least-once: un crash entre "Twilio aceptó" y "guardé el SID" puede duplicar. Mitigación mínima: persistir el SID en un único UPDATE inmediatamente después del `CreateAsync`; opcional `[ASSUMED]`: antes de reenviar una fila `sending` reclamada con `attempts>1` y sin SID, consultar `MessageResource.ReadAsync(to, dateSentAfter)` de Twilio. Twilio no documenta idempotencia para crear mensajes `[CITED: twilio.com/docs/messaging/api/message-resource — sin mención de token de idempotencia]`.

### Pattern 4: Token de seguimiento derivado y revocable

Token = `Base64Url(HMAC-SHA256(secret, alertId)[..16])` (128 bits, 22 caracteres): el API puede **volver a mostrarlo** (compartir enlace al reabrir la app, D-10/D-12) sin guardarlo en claro; en BD solo `token_hash = SHA-256(token)` único + `revoked_at`. Búsqueda por hash. Si Roberto prefiere simplicidad, guardar el token aleatorio en claro en `private.tracking_links` es equivalente en riesgo (la misma BD guarda la ubicación). 128 bits en vez de 256 ahorra 21 caracteres de SMS.

Respuesta pública (contrato de UI-SPEC): `personName, personPhone, status, lastLocation{lat,lon,accuracyM,recordedAt}|null, trail[], startedAt, endedAt|null, serverNow`. Pasada 1 h de `finalizada_en` → solo `status` (sin `lastLocation` ni `trail`) calculado con `TimeProvider`. Token inválido/revocado → 404 uniforme. Cabeceras: `Cache-Control: no-store`; rate limit por IP; CORS solo al origen de Vercel.

### Pattern 5: Webhook de estado monótono y firmado

`POST /webhooks/twilio/status` (form-urlencoded: `MessageSid`, `MessageStatus`, `ErrorCode`). Validar `X-Twilio-Signature` con `RequestValidator` y **la URL pública configurada** (`Public:ApiBaseUrl`), no `Request.Url` (detrás del túnel llega como `http://localhost`). Reglas: orden no garantizado `[CITED: twilio.com/docs/messaging/guides/track-outbound-message-status]` → rango `queued<sending<sent<delivered|failed`, nunca bajar; `delivered` tardío mejora un `failed`; solo se aplica si el SID coincide con el de la fila (callbacks de intentos anteriores se ignoran). `failed/undelivered` → si el código no es permanente y `attempts < 3` → `retry` con `DeliveryRetryPolicy` (+10 s, +30 s: 1 envío + 2 reintentos, D-11); códigos permanentes `21211, 21608, 21614, 21610, 21612, 21408` `[CITED: twilio.com/docs/api/errors]` → `failed` sin reintento. `30003/30005/30006/30007/30008` como transitorios/permanentes `[ASSUMED]`.

### Pattern 6: Finalizar ("Estoy a salvo")

`POST /api/alerts/{id}/finish` idempotente (si ya `finalizada` → 200): en una transacción `estado=finalizada`, `finalizada_en=now`, entregas `alert` aún `queued|retry` → `cancelled` (no enviar un aviso de emergencia caducado), y se encolan entregas `kind='safe'` solo para contactos cuyo aviso quedó `sent|delivered`. El cliente solo navega a Inicio tras el 200 (UI-SPEC).

### Pattern 7: Ubicación honesta

- Iniciar `getCurrentPositionAsync` al empezar el hold/cuenta regresiva (5 s de ventaja) con timeout propio; `hasServicesEnabledAsync()` antes. Sin permiso/GPS/timeout → `location = null`, la alerta sale igual (UBIC-02).
- **No** usar `getLastKnownPositionAsync` como actual; si se usa, `fuente='cache'` con su `timestamp` real y la UI/página muestran su antigüedad (valores de `FuenteUbicacion` `[VERIFIED: AlertValues.cs]`: `gps`, `celular`, `cache`).
- Enviar `capturedAt = location.timestamp` (hora del fix); el servidor guarda `captured_at` en `alert_locations` y devuelve `serverNow`; la antigüedad se calcula `serverNow - recordedAt`, no con el reloj del teléfono. Hoy `AddLocation` ignora `Timestamp` y usa `CreadoEn=now` (`AlertsController.cs:217-225`) → cambiar.
- Validación servidor: lat ∈ [-90,90], lon ∈ [-180,180]; rechazar (0,0) (coordenada centinela); nunca defaults en ninguna capa. CI: grep que falle si aparece `4.7110` o `-74.0721` en `apps/`.
- Envío en primer plano cada 5 s con `watchPositionAsync({ timeInterval: 5000 })`, omitiendo fixes repetidos; tope servidor 1 req/2 s por alerta.

### Pattern 8: Contrato de errores (ProblemDetails) y cliente tipado

`AddProblemDetails()` + `IExceptionHandler` global; `[ApiController]` ya produce `ValidationProblemDetails` para 400. Extensión `code` estable (`validation_error`, `duplicate_contact`, `alert_not_found`, `alert_finalized`) para que la app mapee a copy en español; nunca `ex.Message` al cliente (hoy `detalle = ex.Message` en `AlertsController.cs:350`). `openapi.json`: `dotnet swagger tofile` en CI/script; `npx openapi-typescript apps/api/openapi.json -o apps/mobile/src/lib/api-types.ts`. Pitfall: sin `required` los DTO posicionales generan campos opcionales en TS; verificar los tipos generados y usar `required`/`SupportNonNullableReferenceTypes` `[ASSUMED: soporte exacto en Swashbuckle 6.6.2]`.

### Recommended Vertical Slicing (walking skeleton, tracer-first)

| Corte | Qué demuestra | Cimientos que entran con él |
|-------|---------------|-----------------------------|
| S0 (día 1, paralelo) | Spike Twilio (números verificados, DLR por operador, segmentos/costo del texto), decisión de hostname, instalar JDK17/SDK/Docker, `supabase link` + baseline local, proyecto Vercel | Baseline `0000` (sin aplicar al remoto) |
| S1 tracer | Login real → SOS (hold+cuenta) → `POST /api/alerts` → fila `queued` → 1 SMS real → página con "ubicación pendiente" | Migración `0001` mínima (entregas, enlace), 4 proyectos .NET para el corte, ProblemDetails, `ISmsSender`, shell + tema |
| S2 | Ubicación real en primer plano + mapa público con precisión/antigüedad/trayecto | `captured_at`, validación de coordenadas |
| S3 | Webhook firmado, estados por contacto, reintentos, "Falló" + llamar | Máquina de entregas, tests |
| S4 | Offline + reinicio de API sin duplicar (SC5) | Tests de integración (Docker) |
| S5 | "Estoy a salvo", SMS "a salvo", enlace finalizado/expira 1 h | Estado `finalizada` (CHECK) |
| S6 | CRUD de contactos con validación, accesibilidad, reduced-motion, OpenAPI exportado + cliente tipado | `openapi.json` |

### Anti-Patterns to Avoid
- **"Enviado" por el 201:** el 201 solo significa "guardado/encolado"; los textos salen de `notification_deliveries`.
- **Cola en memoria como fuente de verdad** (`AlertEventQueue` actual): solo como pista de latencia.
- **Segunda ruta de creación** (`POST /api/alerts/sms-fallback`): crea alertas sin entregas y con HMAC global; enrutarla por el mismo handler o deshabilitarla.
- **Hangfire/MediatR/repositorios genéricos:** innecesarios (ver ARCHITECTURE.md).
- **Estados de UI inventados:** `DeliveryStatus` es la única ruta de pintado.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Validar webhook de Twilio | HMAC-SHA1 manual | `Twilio.Security.RequestValidator` | Ordena parámetros y firma por ti `[CITED: twilio.com/docs/usage/webhooks/webhooks-security]` |
| Validación JWT | Parseo propio | `JwtBearer` + JWKS (ya configurado) | Rotación de claves |
| Sesión/refresh | Manejo manual de tokens | supabase-js con `autoRefreshToken` | Rotación de refresh tokens |
| Cola durable | Hangfire / pgmq / broker | Outbox en Postgres (~150 líneas) + `SKIP LOCKED` | Además es el registro visible por contacto |
| Rate limiting público | Contador propio | `AddRateLimiter` de ASP.NET Core | Incluido en .NET 8 |
| Errores HTTP | Objetos `{error}` | `AddProblemDetails` + `IExceptionHandler` | RFC 9457, un solo formato |
| Bytes aleatorios/hash/base64url | Rutinas propias | `RandomNumberGenerator`, `SHA256.HashData`, `HMACSHA256.HashData`, `WebEncoders.Base64UrlEncode`, `CryptographicOperations.FixedTimeEquals` | Correctas y constantes en tiempo |
| Reloj en tests | `DateTime.UtcNow` directo | `TimeProvider` + `FakeTimeProvider` | Ventana de 1 h y backoff deterministas |
| Progreso de hold / pulso | `setTimeout`/`setInterval` en JS | Reanimated `withTiming` + `scheduleOnRN` | Corre en UI thread |
| Polling con reintento | `setInterval` + estado | react-query `refetchInterval` | Pausa en background, backoff |
| Cliente HTTP del móvil | `fetch` manual por endpoint | `openapi-fetch` + tipos generados | Cambia el contrato → falla `tsc` |
| Mapas | Teselas/WebGL propios | MapLibre + OpenFreeMap | Gratis, sin key |
| Teléfonos | libphonenumber | Regex E.164 colombiano `^\+573\d{9}$` + normalizador | Solo +57 móvil en esta fase |

Excepciones deliberadas (hand-roll mínimo): `SmsTextBuilder` (normalización GSM-7 + conteo de segmentos) y `DeliveryRetryPolicy`: puros, con tests.

## Common Pitfalls

### Pitfall 1: URL del API inestable (D-15)
**What goes wrong:** Quick Tunnel cambia de hostname en cada arranque, sin uptime garantizado y 429 sobre 200 peticiones en vuelo `[CITED: developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare]`; un túnel con nombre exige un dominio agregado a Cloudflare `[CITED: .../create-remote-tunnel]`. La URL va en el APK, en Vercel y en el `StatusCallback`.
**How to avoid:** Decidir el día 1 (Open Question 1). Hostname único en `EXPO_PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL`, `Public:ApiBaseUrl`. Poner `cloudflared` como servicio, desactivar suspensión (`powercfg /change standby-timeout-ac 0`), publicar con `dotnet run -c Release`, endpoint `/health`.
**Warning signs:** SMS con link que no abre; app "sin conexión" tras reiniciar el túnel.

### Pitfall 2: Firma de Twilio y IP del cliente detrás del túnel
**What goes wrong:** La validación usa la URL completa que Twilio llamó; el API ve `http://localhost`. El rate limiter por `RemoteIpAddress` ve siempre 127.0.0.1 (un solo cubo para todos).
**How to avoid:** Validar con `Public:ApiBaseUrl + path`; particionar el limiter por `CF-Connecting-IP`/`X-Forwarded-For` con `ForwardedHeaders` solo de loopback `[ASSUMED: cloudflared reenvía estas cabeceras]`.

### Pitfall 3: Alertas atascadas en `pendiente`
Ver Pattern 2: crear en `activa`; el `VerificationWorker` en memoria deja de ser requisito de ciclo de vida.

### Pitfall 4: Aviso de emergencia caducado tras "a salvo"
Filas `queued/retry` de una alerta finalizada deben pasar a `cancelled` (Pattern 6); el worker revisa el estado de la alerta antes de enviar `kind='alert'`.

### Pitfall 5: Duplicados de SMS
Twilio no tiene idempotencia al crear mensajes; ventana `sending` con lease de 30 s (llamada ≈1 s, timeout 10 s). Test: matar el worker entre claim y envío → exactamente un SMS tras el reinicio.

### Pitfall 6: "Entregado" que nunca llega
No todos los operadores devuelven DLR; el estado queda `sent` `[CITED: twilio.com/docs/messaging/guides/track-outbound-message-status]`. Hubo incidentes de recibos retrasados en Tigo/Movistar y de entrega en Claro `[CITED: status.twilio.com incidents, vía búsqueda]`. La UI debe vivir con "Enviado — Esperando confirmación" indefinido; no inventar `delivered` por timeout. Spike: 3 números de 3 operadores.

### Pitfall 7: SMS de 2 segmentos y trial
Con link de 52 caracteres el texto fijo de D-05 mide 146; solo caben nombres de ≤ 14 caracteres en 160 (GSM-7). En trial Twilio antepone "Sent from your Twilio trial account" `[CITED: help.twilio.com trial limitations]` (38 caracteres con " - " `[ASSUMED]`). Normalizar el nombre: NFD sin marcas (ñ→n), solo `[A-Za-z0-9 .,'-]`, máx. 30. Medir segmentos con el nombre más largo (UI-SPEC). Cuenta trial: solo números verificados; error 21608 → "Falló" honesto, sin reintento. Habilitar Colombia en Geo Permissions y usar un número del trial con Global SMS `[CITED: búsqueda support.twilio.com]`. Colombia: sin alphanumeric sender; long code internacional con remitente sustituible `[CITED: twilio.com/en-us/guidelines/co/sms]`; no se puede enviar a fijos (400).

### Pitfall 8: El trigger de registro ignora metadata
`handle_new_user` crea el perfil con `nombre=''`, `telefono=''` `[CITED: INTEGRATIONS.md:65]`. Migración: reescribir la función para leer `raw_user_meta_data->>'nombre'/'telefono'` y enviar `options.data` en `signUp`. `db pull` puede no capturar el trigger sobre `auth.users` `[ASSUMED]`: verificar el baseline. Si `nombre` vacío al armar el SMS, usar un texto neutro ("Un contacto tuyo") y registrar warning; nunca bloquear el SOS.

### Pitfall 9: Confirmación de correo y límites de Auth
SMTP incluido: 2 correos por hora `[CITED: supabase.com/docs/guides/auth/passwords]`. Desactivar "Confirm email" para la demo (cambio remoto con confirmación de Roberto, UI-SPEC). Contraseña mínima 6 (UI-SPEC) vs 8 del spec legacy y "leaked password protection" desactivada (CONCERNS): decisión de Roberto.

### Pitfall 10: Conexión a Supabase desde la PC
Conexión directa = IPv6 (o add-on IPv4); el pooler en modo sesión (5432, usuario `postgres.[REF]`) es IPv4 `[CITED: supabase.com/docs/guides/database/connecting-to-postgres]`. Si la red de Roberto no tiene IPv6, usar el pooler de sesión. El modo transacción (6543) no admite prepared statements. Limitar `Maximum Pool Size` (plan gratuito). `SKIP LOCKED` funciona igual en ambos.

### Pitfall 11: `supabase db pull` y la tabla de historial
`db pull` requiere Docker (shadow DB) y pregunta "Update remote migration history table?" → eso **escribe** en el remoto. Responder que no y consultar a Roberto; alternativa `supabase migration repair <ts> --status applied` solo con su confirmación. `supabase db push --dry-run` antes de cualquier push. Tests con Testcontainers: el baseline referencia `auth.users`, `auth.uid()` y roles `anon/authenticated/service_role` → preparar un SQL de stub o usar imagen de Supabase `[ASSUMED]`.

### Pitfall 12: Función de claim expuesta
Funciones en `public` quedan como RPC de PostgREST. Crear en `private` y `revoke ... from public, anon, authenticated`; tablas nuevas con RLS habilitado; comprobar en el remoto si la Data API está realmente desactivada (README lo afirma, no verificado).

### Pitfall 13: Hold y cuenta regresiva
Usar `withTiming(..., cb)` y `scheduleOnRN` en el callback `finished`; cancelar con `cancelAnimation`. Cuenta regresiva con **deadline absoluto** (`Date.now()`), no contador de ticks; al volver a `AppState=active` con deadline vencido, disparar. `BackHandler` deshabilitado en `/countdown`; `predictiveBackGestureEnabled: false` ya está en `app.json`. Con "reducir animaciones" se mantienen vibración y progreso. `accessibilityActions` para TalkBack.

### Pitfall 14: Build local Android en Windows
JDK 17 (hay 21), `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`, platform 36 + build-tools 36.0.0, `LongPathsEnabled=0` (nueva arquitectura/CMake) → habilitar o compilar desde ruta corta `[ASSUMED]`. Primer build largo. Para la **demo** compilar `npx expo run:android --variant release` (JS embebido): un build de desarrollo exige Metro encendido en la misma red `[ASSUMED]`. Verificar `npx expo-doctor` tras instalar MapLibre; plan B WebView `/t/[token]?embed=1` (UI-SPEC).

### Pitfall 15: Página pública en Vercel
Protección de despliegues: usar el alias de producción `<proyecto>.vercel.app`, no la URL por-despliegue; probar en incógnito que no pide login de Vercel `[ASSUMED]`. CORS del API solo para ese origen. `Cache-Control: no-store`, `noindex`, `Referrer-Policy: no-referrer`. Hobby = uso no comercial `[CITED: vercel.com/docs/plans/hobby]`.

### Pitfall 16: Datos y logs
`NotificationService` actual loguea coordenadas y teléfonos `[VERIFIED: NotificationService.cs]` → retirarlo con el reemplazo. Sin PII en logs. `ProfileDto` devuelve `PalabraClave` en claro (deuda para fases 3/7, no usar en móvil).

### Pitfall 17: Reloj del PC
El JWT se valida con `ClockSkew` de 30 s (`Program.cs:44`); un reloj del PC desfasado produce 401. Sincronizar hora de Windows antes de la demo.

### Pitfall 18: Abuso del canal SMS
Un usuario autenticado puede agregar números ajenos y disparar alertas. Mitigar: máx. contactos por usuario (10), límite de alertas por usuario/hora (rate limit), trial solo a verificados (acotado). CONT-02 (consentimiento del contacto) es fase 6.

## Code Examples

### Función de claim (migración `0001`)
```sql
-- Fuente: patrón de .planning/research/ARCHITECTURE.md Pattern 1; función para ser composable con EF (ver Pattern 1)
create schema if not exists private;
create or replace function private.claim_deliveries(p_limit int, p_lease interval)
returns setof public.notification_deliveries language sql as $$
  with next as (
    select id from public.notification_deliveries
    where (status in ('queued','retry') and next_attempt_at <= now())
       or (status = 'sending' and lease_until < now())
    order by next_attempt_at limit p_limit
    for update skip locked)
  update public.notification_deliveries d
     set status='sending', lease_until = now() + p_lease, attempts = d.attempts + 1, updated_at = now()
    from next where d.id = next.id
  returning d.*;
$$;
revoke all on function private.claim_deliveries(int, interval) from public, anon, authenticated;
```
```csharp
var lote = await _db.Deliveries
    .FromSql($"select * from private.claim_deliveries({10}, {TimeSpan.FromSeconds(30)})")
    .AsNoTracking().ToListAsync(ct);   // [ASSUMED] mapeo de interval/Npgsql: cubrir con test
```

### Envío y webhook (Twilio .NET)
```csharp
// Fuente: twilio.com/docs/messaging/quickstart/csharp-dotnet-core ; docs de webhooks-security (RequestValidator)
TwilioClient.Init(opts.AccountSid, opts.AuthToken);
var msg = await MessageResource.CreateAsync(
    to: new PhoneNumber(d.ContactTelefono), from: new PhoneNumber(opts.From),
    body: body, statusCallback: new Uri($"{pub.ApiBaseUrl}/webhooks/twilio/status"));
// guardar msg.Sid de inmediato; status=sent

// Webhook
var form = Request.Form.ToDictionary(k => k.Key, v => v.Value.ToString());
var ok = new RequestValidator(opts.AuthToken)
    .Validate($"{pub.ApiBaseUrl}/webhooks/twilio/status", form, Request.Headers["X-Twilio-Signature"]);
if (!ok) return Forbid();
```

### Token de seguimiento y texto SMS
```csharp
public static string Derivar(byte[] secreto, Guid alertaId) =>
    WebEncoders.Base64UrlEncode(HMACSHA256.HashData(secreto, alertaId.ToByteArray())[..16]);
public static byte[] Hash(string token) => SHA256.HashData(Encoding.UTF8.GetBytes(token));

public static string Gsm7(string s)
{
    var sb = new StringBuilder();
    foreach (var c in s.Normalize(NormalizationForm.FormD))
    {
        if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
        if (char.IsAsciiLetterOrDigit(c) || " .,'-".Contains(c)) sb.Append(c);
    }
    var t = Regex.Replace(sb.ToString().Trim(), @"\s+", " ");
    return t.Length > 30 ? t[..30] : t;
}
public static string Alerta(string nombre, string link) =>
    $"AlertaYA: {Gsm7(nombre)} activo una alerta de emergencia. Ubicacion en vivo: {link}. Si no responde, llama al 123.";
```

### Cliente Supabase (móvil)
```ts
// Fuente: supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native (opciones); adaptador SecureStore y AppState [ASSUMED]
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const storage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};
export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_KEY!, {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
AppState.addEventListener('change', (s) =>
  s === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh());
```

### Cliente tipado
```ts
// Fuente: openapi-ts.dev/openapi-fetch/middleware-auth
export const api = createClient<paths>({ baseUrl: process.env.EXPO_PUBLIC_API_URL });
api.use({ async onRequest({ request }) {
  const { data } = await supabase.auth.getSession();
  if (data.session) request.headers.set('Authorization', `Bearer ${data.session.access_token}`);
  return request;
} });
```

### HoldButton (Reanimated 4.5.1 + worklets 0.10.1)
```tsx
// scheduleOnRN exportado en worklets 0.10.1 [VERIFIED d.ts]; semántica del callback `finished` [ASSUMED]
import { scheduleOnRN } from 'react-native-worklets';
const progress = useSharedValue(0);
const start = () => {
  progress.value = withTiming(1, { duration: ms, easing: Easing.linear }, (finished) => {
    if (finished) scheduleOnRN(onComplete);
  });
};
const stop = () => { cancelAnimation(progress); progress.value = withTiming(0, { duration: 200 }); };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `runOnJS` | `scheduleOnRN` (worklets) | Reanimated 4 / worklets ≥ 0.5 (ambos presentes en 0.10.1) | Usar `scheduleOnRN` en código nuevo |
| `react-test-renderer` | `test-renderer` (RNTL 14) | 2026 | Solo si se hacen tests de componentes |
| `next lint` | ESLint CLI directo `[ASSUMED]` | Next 16 | Gate web: `tsc` + `vitest` + `next build` |
| MapLibre RN v10 (arquitectura vieja) | v11 solo nueva arquitectura, componente `Map` | 2026 | RN 0.86 ya es nueva arquitectura |
| Swashbuckle en .NET 8 | OpenAPI nativo de controllers desde .NET 9 | .NET 9 | Mantener Swashbuckle 6.6.2 (migración .NET = PLAT-V2-01) |

**Deprecated/outdated:** `expo-av`, Hangfire para esta cola, AsyncStorage para la sesión (aquí SecureStore), Reanimated 4.7.1 de npm (fuera del pin SDK 57).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Docker Desktop es gratuito para Everest (licencia empresa pequeña) | Environment | Habría que usar alternativa sin Docker |
| A2 | `supabase db pull` no captura el trigger `on_auth_user_created` sobre `auth.users` | Pitfall 8 | Baseline incompleto; revisar al generarlo |
| A3 | `FromSql` sobre función `setof` con parámetro `interval` funciona con EF Core 8 + Npgsql | Pattern 1 | Cambiar a ADO.NET/`SqlQuery`; test de integración lo detecta |
| A4 | `statusCallback` es `Uri` en Twilio 8.0.2 y `RequestValidator.Validate` acepta `Dictionary<string,string>` | Code Examples | Ajuste de firma en compilación |
| A5 | cloudflared reenvía `CF-Connecting-IP`/`X-Forwarded-*` | Pitfall 2 | Rate limit global compartido |
| A6 | SecureStore guarda sesiones > 2 KB en Android y el adaptador funciona con supabase-js; snippet AppState | Code Examples | Usar `LargeSecureStore` de Supabase |
| A7 | Callback de `withTiming` recibe `finished=false` al cancelar | Code Examples | Hold se completaría al soltar; probar en dispositivo |
| A8 | Clasificación de códigos Twilio 30003/30005/30006/30007/30008 | Pattern 5 | Reintentos innecesarios o ausentes |
| A9 | El alias de producción de Vercel no queda tras Vercel Authentication | Pitfall 15 | Contactos verían login; desactivar protección |
| A10 | Prefijo trial = 38 caracteres; costo por segmento a Colombia no verificado | Pitfall 7 | Costo/segmentos distintos |
| A11 | GSM-7: é/ñ/ü en tabla base; á/í/ó/ú fuera | Pitfall 7 | Mitigado: el builder solo emite ASCII seguro |
| A12 | Swashbuckle 6.6.2 soporta `NonNullableReferenceTypes` como `required` | Pattern 8 | Tipos TS con campos opcionales |
| A13 | Release con keystore de debug por defecto en plantilla Expo; Metro necesario en dev build | Pitfall 14 | Firmar release manualmente |
| A14 | `test-renderer` + RNTL 14 compatibles con jest-expo 57 | Standard Stack | Quedarse con tests de lógica pura |
| A15 | `applicationId` tipo `com.everestintelligent.alertaya` | Open Questions | Reinstalación si cambia |
| A16 | Next 16 sin `next lint` | State of the Art | Ajustar gate web |
| A17 | La Data API de Supabase está desactivada (afirmado en README) | Pitfall 12 | Policies cobran más importancia |
| A18 | Reconciliar `sending` huérfanos con `MessageResource.ReadAsync` es viable | Pattern 3 | Quedaría duplicado raro documentado |
| A19 | Testcontainers 4.15 funciona con net8 y requiere stub de `auth` | Pitfall 11 | Tests de integración manuales |
| A20 | Compatibilidad de `Testcontainers.PostgreSql`, `TimeProvider.Testing`, `Mvc.Testing` (descubiertos fuera de fuente oficial) | Package Audit | Checkpoint consolidado |

## Open Questions

1. **Hostname estable del API (D-15).**
   - Sabemos: Quick Tunnel = URL aleatoria; túnel con nombre = dominio en Cloudflare.
   - Falta: ¿Roberto/Everest controla un dominio en Cloudflare?
   - Recomendación: si no, Tailscale Funnel o ngrok con dominio estático gratis; decisión de Roberto el día 1 (cambia D-15).
2. **Texto del SMS (D-05) de 1 segmento.** Con 22 caracteres de token cabe solo con nombres ≤ 14 caracteres y sin prefijo trial. Recomendación: aceptar 2 segmentos en la demo o recortar "Si no responde, llama al 123." (requiere OK de Roberto).
3. **Vercel Hobby no comercial.** ¿Basta para el demo? Si luego es piloto con policía, migrar (Cloudflare Pages/Pro).
4. **Registro:** ¿migración que reescribe `handle_new_user` (recomendada) o PATCH tras signUp? ¿Mínimo de contraseña 6 u 8? ¿Activar leaked-password protection? Cambios remotos solo con confirmación.
5. **Inspección read-only del remoto (la hace la sesión principal con MCP Supabase):** nombre del CHECK de `alerts.estado`, definición de `handle_new_user`, `pg_policies` de `alerts/profiles/emergency_contacts`, FKs sin índice, existencia de unique de teléfono por usuario, si la Data API está habilitada.
6. **`applicationId` de Android** (ver A15) y teléfono de pruebas con depuración USB.
7. **Aprobar instalación** de Docker Desktop, JDK 17, Android SDK, cloudflared (requiere admin para LongPaths y Docker).
8. **Números verificados en Twilio** (Roberto + 1–2 de otros operadores) y resultado del DLR por operador (decide si el demo muestra "Entregado").
9. **Build de la demo:** ¿variante release (recomendada) además del development build?
10. **`sms-fallback`:** ¿se enruta por el handler nuevo o se deshabilita en esta fase?

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework API | xUnit 2.9.3 (+ `Microsoft.NET.Test.Sdk`, `FakeTimeProvider`); integración con Testcontainers + Mvc.Testing (requieren Docker) |
| Framework móvil | jest-expo ~57.0.5 + Jest 29 (lógica pura en TS); tests de componentes opcionales |
| Framework web | vitest 5.0.3 (lógica pura de `trackingState`) |
| Config | API: `tests/*` (nuevos); móvil: `jest.config.js` (preset `jest-expo`) — Wave 0; web: `vitest.config.ts` — Wave 0 |
| Quick run | `dotnet test apps/api/AlertaYA.sln --filter "Category!=Integration"`; `cd apps/mobile && npx jest --silent && npx tsc --noEmit`; `cd apps/web && npx vitest run` |
| Full suite | `dotnet test apps/api/AlertaYA.sln` (con Docker); `cd apps/mobile && npx jest && npx tsc --noEmit && npx expo lint && npx expo-doctor`; `cd apps/web && npx vitest run && npx tsc --noEmit && npx next build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Validación de registro (nombre, correo, teléfono +57, contraseña) | unit TS | `npx jest features/auth` | ❌ Wave 0 |
| AUTH-01/02 | Registro real, cierre y reapertura mantiene sesión | manual UAT (dispositivo + Supabase real) | — | n/a |
| AUTH-02 | Decisión de ruta (sin sesión → login; alerta activa → `/alert`) | unit TS (`routeGuard`) | `npx jest features/auth/routeGuard` | ❌ Wave 0 |
| CONT-01 | CRUD, ownership 404, duplicado 409, normalización E.164 | integración API + unit `phone` | `dotnet test --filter Category=Integration` / `npx jest lib/phone` | ❌ Wave 0 |
| SOS-01 | Hold 2 s completa solo al cumplirse; <2 s no navega | manual UAT + unit del cálculo | `npx jest components/holdProgress` | ❌ Wave 0 |
| SOS-02 | Deadline absoluto, vibración por segundo, cancelar no persiste ni llama red | unit TS (`countdown`) + manual vibración | `npx jest features/alert/countdown` | ❌ Wave 0 |
| SOS-03 | Sync reintenta con el mismo `clientGeneratedId`; dos POST → 1 alerta y 1 entrega por contacto | unit TS (`pendingSync` con API falsa) + Application test + integración (carrera) | `npx jest features/alert/pendingSync`; `dotnet test` | ❌ Wave 0 |
| SOS-04 | `DeliveryStatus`: "Enviado" nunca sin `sent`; "Entregado" solo `delivered`; titular honesto; worker apagado ⇒ "En cola" | unit TS + unit .NET (estado de entrega) | `npx jest components/DeliveryStatus features/alert/headline` | ❌ Wave 0 |
| NOTI-01 | `SmsTextBuilder`: GSM-7, nombre con tildes/60 caracteres, segmentos; dispatcher con `FakeSmsSender` (éxito, 2 reintentos, permanente sin reintento) | unit .NET | `dotnet test --filter Category!=Integration` | ❌ Wave 0 |
| NOTI-01 | SMS real a celulares colombianos de 3 operadores | manual UAT (spike día 1) | — | n/a |
| NOTI-03 | Endpoint público: sin auth; null location; ventana 1 h (FakeTimeProvider); revocado → 404; página: estados | unit .NET + integración + vitest | `dotnet test`; `npx vitest run` | ❌ Wave 0 |
| NOTI-04 | Matar worker entre claim y envío → 1 SMS; webhook firma válida/inválida; callbacks fuera de orden | integración (Docker) + unit | `dotnet test --filter Category=Integration` | ❌ Wave 0 |
| UBIC-02 | Alerta sin GPS → `lastLocation=null`; rechazo (0,0); grep sin `4.7110`/`-74.0721`; UI pendiente | unit .NET + script CI + manual (GPS apagado) | `dotnet test`; `git grep -n "4\.7110\|-74\.0721" -- apps` | ❌ Wave 0 |
| Máquina de estados | Matriz estados × estados incl. `finalizada` | unit .NET | `dotnet test AlertaYA.Domain.Tests` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** comando quick del componente tocado (< 30 s).
- **Per wave merge:** suite completa por app + `npx expo lint` + `dotnet build`.
- **Phase gate:** suite completa verde + recorrido manual en el teléfono de Roberto (SOS real, GPS apagado, modo avión, API reiniciada, worker apagado) antes de `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `apps/api/tests/AlertaYA.Domain.Tests`, `.Application.Tests`, `.Api.IntegrationTests` + referencia a `.sln`.
- [ ] Instalar Docker Desktop (integración, `db pull`, pgTAP) y SQL de stub `auth`/roles para Testcontainers.
- [ ] `apps/mobile`: `jest.config.js` con preset `jest-expo`, script `test`, carpeta de tests de lógica pura.
- [ ] `apps/web`: scaffold Next + `vitest.config.ts`.
- [ ] `supabase/` (`supabase init`, `link`), baseline local sin aplicar al remoto.
- [ ] Script `scripts/check-no-substitute-coords.sh` (grep de coordenadas de Bogotá).

## Security Domain

Aplica `security_enforcement` (ASVS nivel 1, bloqueo en severidad alta).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (no hand-roll); política de contraseña a decidir (Open Question 4) |
| V3 Session Management | yes | supabase-js + SecureStore; refresh automático |
| V4 Access Control | yes | `userId` del claim `sub`, ownership en la query (404), tests por endpoint |
| V5 Input Validation | yes | `[ApiController]` + validadores `EsValido`; E.164 +57; coordenadas; normalización de nombre para SMS; zod en cliente |
| V6 Cryptography | yes | `RandomNumberGenerator`, HMAC-SHA256, SHA-256, `FixedTimeEquals`; nunca cripto propia |
| V7 Logging | yes | Sin PII (teléfonos/coordenadas) en logs; ProblemDetails sin `ex.Message` |
| V9/V13 Comms/API | yes | HTTPS por túnel; CORS exacto; rate limit en endpoint público y alertas |
| V14 Configuration | yes | Secretos en variables de entorno (`appsettings*.json` ignorado); `EXPO_PUBLIC_*` solo URL y publishable key; nunca `service_role` ni Twilio en el cliente |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Enumeración/adivinación de token público | Information Disclosure | 128 bits, hash en BD, 404 uniforme, rate limit por IP, revocable |
| IDOR en alertas/contactos | Elevation of Privilege | Ownership en la query; el API usa un rol que omite RLS |
| Webhook falsificado de Twilio | Spoofing/Tampering | `RequestValidator` con URL pública; solo SID coincidente; estados monótonos |
| Repetición/desorden de callbacks | Tampering | Idempotencia y rango de estados |
| Usuario fija estados arbitrarios (`PATCH` actual) | Tampering | Reemplazar por `finish`; máquina de estados |
| Abuso del SMS (spam a terceros) | Denial of Service/Abuse | Límite de contactos y de alertas por hora; trial limita a verificados |
| Fuga de ubicación tras finalizar | Information Disclosure | Ventana 1 h calculada en servidor; sin `lastLocation`/`trail` después |
| SQL injection en función de claim | Tampering | Parámetros (`FromSql` interpolado), función con `revoke` |
| Coordenada sustituta/centinela | Repudiation/Integrity | Validación de rango y rechazo de (0,0) |
| Exposición de `personPhone` en página pública | Information Disclosure | Solo vía token entregado a contactos; `no-store`, `noindex`, `no-referrer` |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-sos-de-punta-a-punta/01-CONTEXT.md`, `01-UI-SPEC.md`, `REQUIREMENTS.md`, `STATE.md`, `.planning/research/*`, `.planning/codebase/*` — leídos completos.
- Código leído: `apps/api/AlertaYA.Api/**` (Program.cs, AlertsController, EmergencyContactsController, ProfilesController, Domain, AppDbContext, DTOs, servicios y workers), `apps/mobile/package.json`, `app.json`, `AGENTS.md`.
- `raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/bundledNativeModules.json` — pins de versiones.
- Tarball `react-native-worklets@0.10.1` (d.ts) — `scheduleOnRN`/`runOnJS`.
- npm registry y nuget.org (versiones); `gsd-tools query package-legitimacy check`.
- docs.expo.dev v57 (location, securestore, entorno Android local); reactnative.dev set-up-your-environment (JDK 17, SDK 36).
- twilio.com: guidelines Colombia, message-resource, track-outbound-message-status, webhooks-security, errores.
- supabase.com: connecting-to-postgres, supabase-db-dump, local-development, passwords, tutorial Expo.
- developers.cloudflare.com (trycloudflare, create-remote-tunnel); vercel.com/docs/plans/hobby; openfreemap.org/quick_start; maplibre.org docs (Expo, instalación); learn.microsoft.com EF Core SQL queries; openapi-ts.dev middleware-auth.

### Secondary (MEDIUM confidence)
- tailscale.com/kb/1223/funnel; ngrok (búsqueda); status.twilio.com incidentes Colombia (búsqueda); resultado de búsqueda sobre `db pull` + Docker + historial de migraciones.

### Tertiary (LOW confidence)
- Todo lo marcado `[ASSUMED]` (ver Assumptions Log).

## Metadata

**Confidence breakdown:**
- Standard stack: ALTA — pins de Expo y registros verificados.
- Architecture: MEDIA-ALTA — patrones conocidos; `FromSql` sobre función y túnel requieren prueba.
- Pitfalls: MEDIA — Twilio/Colombia (DLR, segmentos, costo) y hosting dependen del spike y de decisiones de Roberto.

**Research date:** 2026-10-06
**Valid until:** 2026-10-15 (demo); versiones de npm cambian a diario, usar los pins de `expo install`.

