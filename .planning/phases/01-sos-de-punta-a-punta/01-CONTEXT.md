# Phase 1: SOS de punta a punta - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Una persona con sesión iniciada (registro/login correo+contraseña) gestiona sus contactos de emergencia y pulsa SOS en la app; tras la cuenta regresiva, sus contactos reciben un SMS real con un link donde ven su ubicación real en un mapa; la app muestra solo estados de entrega confirmados por el proveedor. Incluye los cimientos que ese corte necesita (migraciones Supabase versionadas, outbox durable, refactor incremental de la API, ProblemDetails, OpenAPI + cliente tipado, development build Android con tema y navegación).

Requisitos: AUTH-01, AUTH-02, CONT-01, SOS-01, SOS-02, SOS-03, SOS-04, NOTI-01, NOTI-03, NOTI-04, UBIC-02.

Fuera de esta fase: activadores manos libres y tracking en segundo plano real (fase 2), permisos completos/onboarding (fase 2), historial/ajustes/modo silencioso (fase 3), panel e IA (fase 4), cancelar con PIN (fase 5), OTP/recuperar contraseña/push (fase 6).

</domain>

<decisions>
## Implementation Decisions

### Botón y cuenta regresiva
- **D-01:** El botón SOS de la pantalla de inicio se activa **manteniéndolo presionado 2 s**, con un anillo que se llena (evita toques accidentales).
- **D-02:** Cuenta regresiva por defecto de **5 s** (estándar Google/Samsung). Debe ser un valor configurable por perfil (la fase 3 expone el ajuste); la columna existente `profiles.ventana_confirmacion_segundos` tiene default 4 → la migración la alinea a 5.
- **D-03:** La cuenta regresiva es **pantalla completa roja**: número gigante, glow rojo pulsante, vibración en cada segundo y un botón grande **CANCELAR**. Sin sonido.
- **D-04:** Al llegar a 0 navega **directo a la pantalla de alerta activa** (sin pantalla de confirmación "enviada": la veracidad la dan los estados por contacto).

### SMS y link de seguimiento
- **D-05:** Texto del SMS directo y urgente, auto-identificado (el remitente llega como número desconocido), sin tildes (GSM-7): `AlertaYA: <Nombre> activo una alerta de emergencia. Ubicacion en vivo: <link>. Si no responde, llama al 123.` En Twilio trial el proveedor antepone "Sent from your Twilio trial account" — aceptado para la demo. *(Ajustado 2026-10-06, ver D-19: se aceptan 2 segmentos.)*
- **D-06:** La página pública del link muestra: **mapa en vivo** (pin con última ubicación, círculo de precisión, "hace X s"), **nombre de la persona y estado** de la alerta (activa / finalizada), **botones** llamar a la persona, llamar al 123 y abrir en Google Maps, y el **trayecto** desde el inicio de la alerta. Sin GPS muestra "ubicación pendiente", nunca una coordenada sustituta.
- **D-07:** El link deja de mostrar ubicación **1 h después de finalizada la alerta**; luego muestra "alerta finalizada" sin datos de ubicación. Token opaco no adivinable, revocable.
- **D-08:** El link se sirve desde un **subdominio gratuito** (p. ej. Vercel) para la demo.

### Alerta activa y su fin
- **D-09:** En esta fase la alerta termina con un botón **"Estoy a salvo"** (mantener presionado 3 s): la alerta pasa a finalizada, los contactos reciben un SMS de que la persona está a salvo y el link pasa a "finalizada". El PIN se agregará encima en la fase 5 (SOS-05).
- **D-10:** La pantalla de alerta activa muestra: **estado por contacto** (en cola / enviado / entregado / fallido; "entregado" solo con DLR del proveedor), **mini mapa** con lo que ven los contactos (precisión y antigüedad o "ubicación pendiente"), **cronómetro** de tiempo activo y botón **compartir link** (share nativo de Android).
- **D-11:** Si el SMS a un contacto falla: **reintento automático 2 veces**; si sigue fallando se muestra "Falló" en rojo con la opción de **llamar a ese contacto** directamente.
- **D-12:** Si la persona sale de la app, la alerta **sigue activa**; al reabrir la app se abre directamente la pantalla de alerta activa. (El tracking con pantalla apagada real es de la fase 2; en esta fase se envía ubicación mientras la app está en primer plano.)

### Entorno de la demo — presupuesto cero
- **D-13:** **No hay presupuesto**: todo debe ser gratuito. Restricción que aplica a todo el proyecto.
- **D-14:** SMS con **Twilio trial** (crédito gratis, DLR por webhook de estado, solo a números verificados). Se verifican el número de Roberto y 1–2 más (idealmente de operadores distintos: Claro/Movistar/Tigo). El acceso al proveedor va detrás de un puerto (`ISmsSender`) para poder cambiarlo sin tocar el dominio. — **Reversibility:** reversible — detrás de interfaz.
- **D-15:** API .NET corre en la **PC de Roberto expuesta con un túnel HTTPS de hostname fijo** — *reemplazado por D-18* (HTTPS público gratis; la PC debe estar prendida en la demo). Azure F1 descartado porque se duerme y mata los workers.
- **D-16:** Página del link (y luego el panel) en **Vercel plan gratuito**; BD y Auth en el **Supabase gratuito** existente (`vzyasmeeyvbkpoiosses`).
- **D-17:** Android **development build compilado localmente** (Gradle/Android Studio), no EAS de pago. *(Ampliado por D-21: además un APK release para la demo.)* Pruebas y demo en el **teléfono Android personal de Roberto**.

### Decisiones tras la investigación (2026-10-06)
- **D-18:** El API se expone con **ngrok y dominio estático gratuito** (un dominio fijo por cuenta). Reemplaza a Cloudflare Tunnel en D-15 porque el Quick Tunnel cambia de URL al reiniciar y el túnel con nombre exige dominio propio. La URL pública fija va en el APK, en Vercel y en el `StatusCallback` de Twilio, y es la que valida la firma del webhook.
- **D-19:** El SMS de alerta **acepta 2 segmentos**: texto completo con el nombre sin truncar y link de 128 bits; el costo por SMS se duplica. El texto sigue en GSM-7, sin tildes.
- **D-20:** El nombre y el teléfono del perfil se llenan con una **migración versionada del trigger `handle_new_user`** que copia la metadata del `signUp`; no se hace PATCH desde la app. Se aplica al remoto solo con confirmación de Roberto.
- **D-21:** Builds: **development build** para desarrollar y **APK release** firmado localmente para la demo del 2026-10-15, sin depender de Metro ni del PC para el bundle JS.

### Claude's Discretion
- Redacción exacta del SMS de "a salvo" y textos de UI dentro del tono definido.
- Intervalo de envío de ubicación en primer plano y de polling de la página del link.
- Política de backoff de los 2 reintentos de SMS.
- Estructura de navegación (Expo Router), librería de mapas gratuita (MapLibre/OSM) y layout de login/registro/contactos siguiendo el diseño del legacy.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Proyecto y alcance
- `.planning/PROJECT.md` — visión, core value (veracidad), constraints, decisiones clave
- `.planning/REQUIREMENTS.md` — requisitos AUTH/CONT/SOS/NOTI/UBIC de esta fase
- `.planning/ROADMAP.md` §Phase 1 — meta, criterios de éxito, spike de proveedor SMS día 1, cimientos incluidos

### Investigación
- `.planning/research/SUMMARY.md` — síntesis
- `.planning/research/ARCHITECTURE.md` — outbox transaccional, `notification_deliveries`, token de seguimiento, estructura 4 proyectos .NET, Supabase CLI como fuente de verdad del esquema
- `.planning/research/STACK.md` — versiones Expo SDK 57 / libs (usar `npx expo install`)
- `.planning/research/PITFALLS.md` — "enviado" falso, ubicación sustituta, RLS, Twilio en Colombia

### Código existente
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/CONVENTIONS.md` — estado y convenciones de `apps/api`
- `apps/mobile/AGENTS.md` — reglas del proyecto Expo (Expo Router en `src/app/`, `npx expo lint`, `npx tsc --noEmit`)

### Legado (contrato funcional, no copiar código)
- `docs/legacy/openspec/changes/migrar-a-dotnet-expo/specs/alertas-sos/spec.md` — SOS, *Veracidad de lo informado*
- `docs/legacy/openspec/changes/migrar-a-dotnet-expo/specs/notificaciones-alerta/spec.md` — notificación por contacto
- `docs/legacy/openspec/changes/migrar-a-dotnet-expo/specs/ubicacion/spec.md` — *Ausencia de ubicación sustituta*
- `docs/legacy/openspec/changes/migrar-a-dotnet-expo/specs/autenticacion/spec.md` — registro/login
- `docs/legacy/openspec/changes/migrar-a-dotnet-expo/specs/contactos-confianza/spec.md` — contactos
- `docs/legacy/openspec/changes/migrar-a-dotnet-expo/design.md` — diseño técnico de la migración
- `docs/legacy/flutter/lib/theme/app_theme.dart` — tokens de diseño (colores, tipografía, radios)
- `docs/legacy/flutter/lib/screens/` — referencia visual de pantallas (login, inicio, contactos, alerta activa)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/AlertaYA.Api/Domain/AlertStateMachine.cs` + `AlertValues.cs`: máquina de estados y constantes de alerta — reutilizar, mover a `AlertaYA.Domain` y testear.
- `apps/api/AlertaYA.Api/Controllers/AlertsController.cs`: creación idempotente con `clientGeneratedId` (unique `user_id, client_generated_id`) y `POST /{id}/location` — base del flujo SOS.
- `apps/api/AlertaYA.Api/Controllers/EmergencyContactsController.cs`: CRUD de contactos ya existe (CONT-01 casi listo en back).
- `apps/api/AlertaYA.Api/Extensions/GeoPointExtensions.cs`: conversión lat/lon ↔ PostGIS (X=lon, Y=lat).
- `docs/legacy/api-dominio/`: dominio C# rico con 87 tests como referencia.

### Established Patterns
- Vocabulario de dominio y BD en español; infraestructura en inglés; constantes como static classes con `Todos`/`EsValido` (ver `.planning/codebase/CONVENTIONS.md`).
- userId siempre desde claim `sub` del JWT de Supabase; ownership en la query (404 para ajeno).
- La API conecta con un rol que se salta RLS → ownership en código y testeado.

### Integration Points
- `NotificationService` (stub de log) y `AlertEventQueue` (Channels en memoria) se reemplazan por outbox durable + `ISmsSender` (Twilio) + webhook de estado.
- Supabase Auth (JWT) para la app móvil; la app no llama PostgREST directo, todo vía API .NET.
- Endpoint público nuevo de seguimiento por token para la página Vercel.
- `apps/mobile` es scaffold vacío (Expo 57): todo el front se construye en esta fase.

</code_context>

<specifics>
## Specific Ideas

- Sensación de la cuenta regresiva tipo "Emergency SOS" de Samsung/Google, pero con la identidad visual oscura/roja del legacy (glow rojo `#E8212B` sobre `#0D0D0D`).
- El demo del 2026-10-15 se hace en vivo con el teléfono personal de Roberto, SMS reales a 2–3 números verificados.
- "Listo para mostrar" = recorrido en vivo de cada función con aprobación de Roberto.

</specifics>

<deferred>
## Deferred Ideas

- Costo de la API de Claude para la IA (fase 4): no hay presupuesto → evaluar reglas heurísticas sin LLM, créditos gratuitos o modelo gratuito al discutir la fase 4.
- Remitente SMS sin prefijo de trial / short code en Colombia → requiere pago (PLAT-V2-03).
- Hosting siempre encendido sin depender de la PC de Roberto → post-demo, cuando haya presupuesto o una opción gratuita confiable.

</deferred>

---

*Phase: 01-sos-de-punta-a-punta*
*Context gathered: 2026-10-06*
