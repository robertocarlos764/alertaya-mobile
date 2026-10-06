# Architecture Research

**Domain:** App Android de SOS personal + API .NET + Supabase (Postgres/PostGIS/Auth/Storage/Realtime) + panel web policial (brownfield)
**Researched:** 2026-10-06
**Confidence:** MEDIUM-HIGH (patrones de backend y Supabase verificados con docs; restricciones Android de background y proveedores externos requieren spike en su fase)

## Resumen de decisiones (leer primero)

| Tema | Decisión | Confianza |
|------|----------|-----------|
| Estructura .NET | 4 proyectos (`Domain`, `Application`, `Infrastructure`, `Api`) + tests; handlers simples, sin MediatR, sin repositorios genéricos | ALTA |
| Cola durable | **Transactional outbox en Postgres** (tabla de entregas por contacto + tabla de jobs) consumida con `FOR UPDATE SKIP LOCKED`. Ni Hangfire ni pgmq | ALTA |
| Wake-up de workers | `Channel<T>` en memoria solo como *pista* de latencia; la fuente de verdad es la tabla | ALTA |
| Realtime del panel | **Supabase Realtime (Postgres Changes) como señal de invalidación + refetch por API**. No SignalR | MEDIA |
| Link de seguimiento | Token opaco aleatorio (256 bit), guardado como hash SHA-256, revocable; la página web hace *polling* al API | ALTA |
| Roles | Custom Access Token Hook que inyecta `app_role` y `cai_id` desde `officers`; **nunca** `user_metadata` | ALTA |
| Fuente de verdad del esquema | **Supabase CLI** (`supabase/migrations/*.sql`); EF Core solo mapea, sin EF migrations | ALTA |
| Trigger manos libres | Servicio en primer plano Kotlin (módulo Expo) dueño de la cuenta regresiva; al vencer lanza un Headless JS task que ejecuta el **mismo caso de uso** que el botón | MEDIA |
| Móvil | Outbox local (SQLite) con `clientGeneratedId`; la UI nunca afirma envío sin confirmación del servidor | ALTA |
| IA | Pipeline como *job* asíncrono tras subir el audio; **nunca bloquea ni retrasa** la notificación; la IA prioriza, jamás descarta | ALTA |

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTES                                      │
├───────────────────────────┬─────────────────────────────┬──────────────────────┤
│  Android (Expo dev build) │  Web policial  /panel/*     │  Link público /t/{tk} │
│  UI RN + casos de uso TS  │  (auth Supabase, mapa)      │  (anónimo, solo lectura)│
│  Módulo Kotlin: FGS       │  supabase-js: Auth+Realtime │  fetch → API          │
│  (shake, cuenta regresiva)│  datos: API                 │                       │
│  Outbox SQLite            │                             │                       │
└──────┬───────────┬────────┴──────────────┬──────────────┴──────────┬───────────┘
       │ HTTPS+JWT │ PUT firmado           │ HTTPS+JWT   ▲ WS        │ HTTPS
       │           │ (audio)               │             │ Realtime  │
       ▼           ▼                       ▼             │           ▼
┌──────────────────────────────┐   ┌──────────────────────────────────────────────┐
│  Supabase Storage (privado)  │   │               API .NET 8 (Api)               │
│  bucket alert-audio          │◄──┤ Controllers → Application (handlers)         │
└──────────────────────────────┘   │            → Domain (reglas, state machine)  │
                                   │ Infrastructure: EF Core, Twilio, Expo Push,  │
┌──────────────────────────────┐   │   Storage, STT/LLM, Workers (BackgroundSvc)  │
│  Supabase Auth (JWT + Hook)  │──►│ Webhooks: /webhooks/twilio/status            │
└──────────────────────────────┘   └───────────────┬──────────────────────────────┘
                                                   │ EF Core / Npgsql
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ Supabase Postgres + PostGIS                                                     │
│ public:  profiles, emergency_contacts, alerts, alert_locations, alert_events,   │
│          notification_deliveries, alert_audio, push_tokens, verification_logs,  │
│          cais, officers, officer_decisions   (RLS, publicación Realtime)        │
│ private: alert_jobs, tracking_links         (sin exponer por PostgREST)         │
└───────────────────────────────────────────────┬────────────────────────────────┘
                                                │ Postgres Changes (alerts)
                                                └──────────────► panel (Realtime)
                      Externos: Twilio (SMS + status callback), Expo Push, STT, LLM
```

### Component Responsibilities

| Componente | Responsabilidad | Implementación recomendada |
|------------|-----------------|----------------------------|
| **Mobile UI (RN)** | Pantallas, permisos, estado de la alerta mostrado al usuario | Expo + TS, `presentation/` |
| **Mobile use cases** | `TriggerSos`, `CancelSos`, `SyncPendingAlert`, `StreamLocation` (independientes de React) | TS puro en `application/` |
| **Módulo nativo `alertaya-trigger`** | Servicio en primer plano, detección de shake, cuenta regresiva + vibración + notificación con "Cancelar", lanzar Headless JS | Kotlin, Expo Modules API |
| **Outbox móvil** | Persistir la alerta y los puntos GPS antes de cualquier red; reintentar con el mismo `clientGeneratedId` | `expo-sqlite` |
| **Api (HTTP)** | Auth, validación de forma, mapeo a casos de uso, ProblemDetails, rate limit, webhooks | ASP.NET Core controllers (los existentes) |
| **Application** | Casos de uso (`CreateAlert`, `AddLocations`, `CancelAlert`, `AttendAlert`, `GetTrackingView`...), puertos (`INotificationChannel`, `ITranscriber`, `IAlertClassifier`, `IAudioStorage`, `IApplicationDbContext`) | Handlers por clase, DI |
| **Domain** | Entidades, `AlertStateMachine`, valores (estados, canales, prioridades), reglas puras | Sin I/O, sin EF |
| **Infrastructure** | EF Core (`AppDbContext`), `TwilioSmsChannel`, `ExpoPushChannel`, `SupabaseAudioStorage`, proveedores IA, **OutboxWorkers** | Implementa puertos |
| **DeliveryDispatcher (worker)** | Reclama filas de `notification_deliveries`, envía, actualiza estado con reintentos/backoff | `BackgroundService` + `SKIP LOCKED` |
| **JobRunner (worker)** | Reclama `alert_jobs` (`analyze_audio`, `verify_alert`), ejecuta pipeline IA | `BackgroundService` + `SKIP LOCKED` |
| **Supabase Auth** | Identidad, OTP de celular, emisión de JWT con claims de rol | Auth + Custom Access Token Hook |
| **Supabase Realtime** | Notifica al panel cambios en `alerts` | Postgres Changes sobre `alerts` |
| **Supabase Storage** | Audio cifrado en reposo, bucket privado, URLs firmadas de corta vida | Bucket `alert-audio` sin policies de cliente |
| **Web (`apps/web`)** | Panel policial (`/panel/*`, autenticado) y página pública de seguimiento (`/t/:token`) | Vite + React + TS, un solo deploy estático, dos árboles de rutas con code-splitting |

## Recommended Project Structure

### Backend (`apps/api`) — migración incremental, no big-bang

```
apps/api/
├── AlertaYA.sln
├── src/
│   ├── AlertaYA.Domain/            # Entities, AlertStateMachine, AlertValues. Referencia: nada (NTS Point tolerado: librería pura)
│   ├── AlertaYA.Application/       # Features/<Caso>/Handler.cs + Contracts; Abstractions/ (puertos)
│   │   ├── Alerts/                 #   CreateAlert, AddLocations, CancelAlert, AttendAlert, GetTrackingView
│   │   ├── Notifications/          #   EnqueueDeliveries, ApplyProviderStatus
│   │   ├── Verification/           #   AnalyzeAudio (orquesta ITranscriber + IAlertClassifier + reglas)
│   │   └── Abstractions/           #   IApplicationDbContext, INotificationChannel, ITranscriber, ...
│   ├── AlertaYA.Infrastructure/    # Persistence/ (AppDbContext, configs), Notifications/ (Twilio, Expo),
│   │                               # Storage/, Ai/, Workers/ (DeliveryDispatcher, JobRunner)
│   └── AlertaYA.Api/               # Controllers, Program.cs (composition root), ProblemDetails, Auth policies
└── tests/
    ├── AlertaYA.Domain.Tests/      # state machine (matriz), reglas R1-R5
    ├── AlertaYA.Application.Tests/ # handlers con DbContext en Testcontainers (PostGIS)
    └── AlertaYA.Api.IntegrationTests/ # idempotencia, auth, webhooks
```

Regla de dependencias: `Api → Infrastructure → Application → Domain`; `Api` además referencia `Application`. Se verifica con un test de arquitectura (NetArchTest) o `ProjectReference` estricto: es gratis y evita que "Clean Architecture" se degrade.

### Móvil (`apps/mobile`)

```
apps/mobile/
├── modules/alertaya-trigger/       # Módulo Expo (Kotlin): FGS, ShakeDetector, countdown, HeadlessJsTaskService
├── src/
│   ├── core/                       # tema (tokens del diseño), http client, config, Result<T>
│   ├── features/
│   │   ├── alert/
│   │   │   ├── domain/             # Alert, AlertStatus, DeliverySummary (tipos puros)
│   │   │   ├── application/        # TriggerSos, SyncPendingAlert, StreamLocation (+ puertos)
│   │   │   ├── infrastructure/     # AlertApi, SqliteAlertOutbox, ExpoLocationSource, NativeTriggerBridge
│   │   │   └── presentation/       # screens, hooks, componentes
│   │   ├── contacts/ auth/ settings/ history/ onboarding/
│   └── app/                        # expo-router: solo ruteo y composición (wiring DI)
└── headless/sos-task.ts            # registerHeadlessTask → llama TriggerSos (mismo caso de uso)
```

Límite impuesto con `eslint-plugin-boundaries` o `dependency-cruiser`: `presentation → application → domain`; `infrastructure → application`; `domain` no importa nada.

### Web (`apps/web`)

```
apps/web/src/
├── panel/      # login officer, lista priorizada, mapa, detalle (resumen IA, audio, trail), atender/descartar
├── tracking/   # /t/:token (pública, sin supabase-js)
└── shared/     # cliente API tipado (generado del OpenAPI), tokens de diseño
```

### Supabase / esquema

```
supabase/
├── config.toml
├── migrations/       # 0000_baseline (db pull) + migraciones versionadas
├── tests/            # pgTAP: RLS por rol
└── seed.sql          # 1 CAI + 1 officer demo
```

### Structure Rationale

- **4 proyectos en vez de 1:** es lo que hace real la "Clean Architecture" que pidió el usuario; con un solo proyecto la regla de dependencia es solo convención y se rompe.
- **Sin repositorios genéricos ni MediatR:** `DbContext` ya es unit of work; un `IApplicationDbContext` expone `DbSet<T>` a Application. MediatR pasó a licencia comercial en 2025 (verificar versión vigente); un handler = una clase inyectada en el controller cubre lo mismo.
- **Feature-first con capas dentro (móvil):** el equipo trabaja por feature (SOS, contactos...), y el borde de capas sigue siendo verificable.
- **`private` schema para tablas internas:** `alert_jobs` y `tracking_links` no deben ser alcanzables por PostgREST aunque alguien olvide una policy.

## Architectural Patterns

### Pattern 1: Transactional outbox con entregas por contacto

**What:** Al crear la alerta, en **una sola transacción** se insertan: `alerts`, `tracking_links`, una fila `notification_deliveries` por (contacto × canal) con `status='queued'`, y un `alert_events('created')`. Un worker reclama filas con `FOR UPDATE SKIP LOCKED` y un *lease*. La fila de entrega es a la vez la cola y el registro visible al usuario ("Historial con el estado real de entrega por contacto").
**When to use:** siempre que un efecto externo (SMS, push, IA) no pueda perderse por reinicio. Es el caso central del producto.
**Trade-offs:** at-least-once (un crash entre "Twilio aceptó" y "guardé el SID" puede duplicar un SMS: aceptable, preferible a perderlo). Polling cada ~2 s + *wake-up* por Channel evita latencia perceptible. Sin dashboard de cola (se consulta con SQL/panel interno).

```sql
-- Claim (worker). Reclama también 'sending' con lease vencido => recuperación tras crash/reinicio.
with next as (
  select id from notification_deliveries
  where (status in ('queued','retry') and next_attempt_at <= now())
     or (status = 'sending' and lease_until < now())
  order by priority desc, next_attempt_at
  limit 10
  for update skip locked)
update notification_deliveries d
   set status = 'sending', lease_until = now() + interval '60 seconds', attempts = attempts + 1
  from next where d.id = next.id
returning d.*;
```

Estados de entrega: `queued → sending → sent (el proveedor aceptó) → delivered | failed | undelivered`, más `retry` con `next_attempt_at` por backoff exponencial y tope de intentos. **"Entregado" solo se escribe desde el status callback de Twilio** (`/webhooks/twilio/status`, validando `X-Twilio-Signature`); "sent" nunca se muestra como entregado.

### Pattern 2: Idempotencia end-to-end (cliente → API → proveedor)

**What:** El `clientGeneratedId` (UUID) se genera en el teléfono **antes** de cualquier red y se persiste en el outbox móvil. El API ya tiene el índice único `(user_id, client_generated_id)`; se mantiene y se añade idempotencia a los puntos GPS: `alert_locations(alert_id, client_seq)` único + `captured_at` del dispositivo.
**When to use:** alerta, lotes de ubicación, subida de audio (`audio:complete` idempotente por `audio_id` del cliente).
**Trade-offs:** requiere migración (`client_seq`, `captured_at`); a cambio, el reenvío tras reconexión es seguro y el panel puede ordenar por tiempo real de captura, no de llegada.

### Pattern 3: Disparo manos libres con dueño nativo de la cuenta regresiva

**What:** El servicio en primer plano (Kotlin) detecta el gesto, **él mismo** corre la cuenta regresiva (timer nativo + vibración + notificación ongoing con acción "CANCELAR"), y al vencer arranca un `HeadlessJsTaskService` que ejecuta `TriggerSos(channel)`: el mismo caso de uso del botón. Resultado: la lógica de negocio vive una vez (TS), el servicio sobrevive a la muerte del JS runtime y no hace falta una Activity sobre la pantalla bloqueada (evita la restricción de `USE_FULL_SCREEN_INTENT` de Android 14 para apps que no son de llamadas/alarmas).
**When to use:** todos los activadores (shake primero; luego pulsaciones de encendido vía broadcast `SCREEN_OFF/ON`; volumen y voz después).
**Trade-offs:** Headless JS al arrancar proceso frío tarda (1-3 s); mitigación: el outbox SQLite y el primer fix GPS ya están disponibles, y la cuenta regresiva (≥5 s) absorbe el arranque. Si el spike muestra que no es fiable, plan B: el módulo nativo hace el `POST /api/alerts` con OkHttp usando el token guardado (duplica lógica mínima: solo crear + estado pendiente).

### Pattern 4: Panel = escritura por API, Realtime como señal

**What:** El panel **lee y escribe por el API** (atender/descartar pasa por `AlertStateMachine` y escribe `officer_decisions`); Supabase Realtime (Postgres Changes sobre `alerts`) solo dice "algo cambió" y el cliente refetchea. Como el API ya actualiza `alerts.ubicacion` en cada punto GPS (comportamiento existente), **un solo UPDATE por punto** mueve el pin; no se suscribe `alert_locations`.
**When to use:** decenas de oficiales concurrentes (v1).
**Trade-offs:** Postgres Changes evalúa RLS por suscriptor y procesa en un solo hilo (documentado por Supabase); aceptable a esta escala. Al reconectar siempre se refetchea (el evento puede perderse). Escape a futuro: *Broadcast* privado por CAI (`cai:{id}`) publicado por el API o por trigger (`realtime.broadcast_changes`), que Supabase recomienda para escalar.

### Pattern 5: Token de seguimiento opaco y revocable

**What:** `tracking_links(alert_id, token_hash, expires_at, revoked_at)`. Token = 32 bytes aleatorios en base64url; se guarda SHA-256. URL `https://<web>/t/{token}` va en el SMS. `GET /api/public/tracking/{token}` devuelve solo: nombre de pila, estado, última posición con precisión y `capturedAt`, últimos N puntos. Válido mientras la alerta esté activa + gracia corta tras cierre; se revoca al cancelar.
**When to use:** siempre; preferido sobre JWT firmado porque permite revocar y no depende de rotación de secretos.
**Trade-offs:** una lectura a BD por request (trivial); rate limit por IP+token con el `RateLimiter` incorporado en ASP.NET. La página hace polling cada 5 s y **muestra "última ubicación hace X"** cuando el dato está viejo (Veracidad; nunca una ubicación sustituta).

### Pattern 6: Pipeline IA como job posterior, con la IA subordinada a un humano

**What:** `audio:complete` inserta en la misma transacción `alert_audio` + `alert_jobs('analyze_audio')`. El `JobRunner` ejecuta: descarga → `ITranscriber` → `IAlertClassifier` (LLM con salida JSON estructurada: `peligro_detectado`, `categoria`, `prioridad`, `resumen`, `confianza`) → combina con las reglas heurísticas existentes R1-R5 (`VerificationService`) → escribe `verification_logs`, actualiza prioridad/resumen de la alerta y `alert_events`. Regla de producto: **la IA solo sube o baja prioridad y adjunta resumen; nunca descarta ni cancela una alerta**. Si falla o tarda, la alerta sigue visible con prioridad por reglas.
**Trade-offs:** latencia de resumen (decenas de segundos) vs. notificación inmediata; es el orden correcto. Los proveedores van detrás de puertos (STT y LLM intercambiables; el STT no puede ser Anthropic, no ofrece transcripción).

### Pattern 7: Roles por claim del JWT, acceso a datos solo por API

**What:** `app_role` (`citizen` por defecto, `officer`, `cai_admin`) y `cai_id` se inyectan con un Custom Access Token Hook leyendo `officers`. Policies RLS usan `(select auth.jwt() ->> 'app_role')`; .NET usa el mismo claim en `AuthorizationPolicy`. La app móvil **no habla con PostgREST** (solo Auth y PUT firmado a Storage); el panel solo usa supabase-js para Auth + Realtime. RLS es defensa en profundidad y habilita Realtime.
**Trade-offs:** el API se conecta con un rol que **omite RLS**, así que RLS no protege contra bugs del API: las comprobaciones de propiedad (`userId` del claim `sub`) siguen siendo obligatorias y se prueban. Un claim vive hasta el refresh del token (~1 h): el API valida además `officers.activo` en cada request del panel para revocar al instante.

## Data Flow

### Flujo 1: SOS de punta a punta (camino crítico)

```
[Botón SOS | Shake→FGS nativo]
   │  cuenta regresiva (vibra, cancelable)
   ▼
TriggerSos (TS)
   1. genera clientGeneratedId, lee GPS real (si no hay fix: lo dice, NO inventa)
   2. escribe PendingAlert en SQLite  ◄── nada depende de la red desde aquí
   3. UI: "Alerta guardada" (todavía NO "contactos notificados")
   ▼
SyncPendingAlert → POST /api/alerts (JWT)  ──(sin red: reintenta con el mismo id)──┐
   ▼                                                                                │
CreateAlertHandler  [1 transacción]                                                │
   alerts(estado) + tracking_link + deliveries(queued, por contacto×canal) + event │
   ▼  201 {alertId, trackingUrl, deliveries[]}                                      │
Móvil: muestra estado REAL por contacto (poll GET /alerts/{id} cada 3-5 s) ◄───────┘
   ▼ (en paralelo)
DeliveryDispatcher: claim → Twilio.send(SMS con trackingUrl) → sent
Twilio status callback → /webhooks/twilio/status → delivered|failed
   ▼
Panel: Realtime(alerts INSERT) → refetch lista; INSERT dispara por trigger de BD o por la propia fila
```

### Flujo 2: Tracking en vivo

```
FGS location (expo-location, foregroundService type=location)  cada 5 s (10 s ahorro)
   → buffer SQLite (client_seq, captured_at, accuracy, source)
   → POST /api/alerts/{id}/locations:batch  (cada ~15 s o al reconectar)
   → handler: insert alert_locations (idempotente) + UPDATE alerts.ubicacion  [1 tx]
        ├─ Postgres Changes(alerts UPDATE) → panel refetch/mueve pin
        └─ link público: GET /api/public/tracking/{token} (polling 5 s)
```

### Flujo 3: Audio + IA

```
Móvil graba clip (10–30 s) tras consentimiento
 → POST /alerts/{id}/audio:init → URL firmada de subida (bucket privado)
 → PUT directo a Supabase Storage
 → POST /alerts/{id}/audio:complete  [tx: alert_audio + alert_jobs]
 → JobRunner: STT → LLM → verification_logs + prioridad/resumen → alerts UPDATE
 → Realtime → panel; oficial reproduce vía URL firmada de 60 s (+ evento de auditoría)
```

### Flujo 4: Atención policial

```
Panel (officer JWT) → GET /api/panel/alerts?cai=… (ordenado por prioridad)
 → POST /api/panel/alerts/{id}/attend | dismiss → AlertStateMachine
 → officer_decisions + alert_events + alerts.estado → Realtime → otros paneles
 → los contactos reciben aviso de cambio de estado vía el mismo outbox (nuevo delivery)
```

### State Management

- **Móvil:** el estado de la alerta es una proyección del servidor + outbox local; React Query (o equivalente) para lecturas; el outbox SQLite es la única fuente local de verdad para lo "pendiente de enviar".
- **Servidor:** la verdad está en Postgres (alerts, deliveries, jobs). Nada crítico vive en memoria; el `Channel` solo despierta workers.
- **Panel:** lista en cache de consultas; el evento Realtime invalida la query.

### Key Data Flows

1. **Crear alerta:** idempotente, transaccional, sin esperar a notificaciones ni IA.
2. **Entrega:** outbox → worker → Twilio → webhook; cada transición queda en BD.
3. **Ubicación:** buffer local → lotes idempotentes → una sola fila `alerts` actualizada para tiempo real.
4. **IA:** asíncrona, no bloqueante, subordinada al oficial.

## Modelo de datos y RLS (delta sobre el esquema actual)

| Tabla | Nueva/Cambio | Acceso cliente (RLS) |
|-------|--------------|----------------------|
| `alerts` | + `cai_id` (asignado por API con `ST_DWithin`/más cercano), `prioridad`, `resumen_ia`; policy UPDATE **no** (solo API) | dueño: SELECT; officer: SELECT donde `cai_id` = claim |
| `alert_locations` | + `client_seq`, `captured_at`; único `(alert_id, client_seq)`; índice por `alert_id` | dueño y officer del CAI: SELECT |
| `alert_events` | nueva, append-only (timeline + auditoría; cubre `audit_logs` del mapeo) | dueño y officer del CAI: SELECT |
| `notification_deliveries` | nueva (cola + registro): `alert_id, contact_id, channel, status, attempts, next_attempt_at, lease_until, provider_message_id, error_code, priority` | dueño: SELECT; sin escritura de cliente |
| `alert_audio` | nueva: ruta Storage, duración, consentimiento, `status` | dueño y officer del CAI: SELECT metadata |
| `push_tokens` | nueva | dueño: CRUD |
| `private.alert_jobs`, `private.tracking_links` | nuevas, fuera de PostgREST | ninguna |
| `officers` / `cais` / `officer_decisions` | policies de lectura propia; escritura solo API | officer: SELECT propio |
| `storage.objects` (`alert-audio`) | sin policies de cliente | solo URLs firmadas |

Reglas: policies con `(select auth.uid())`/`(select auth.jwt()...)` (hoy están sin `select`, corrección pendiente de los advisors); índice en cada columna usada por una policy; publicar en `supabase_realtime` **solo** `alerts`; `palabra_clave` fuera de texto plano (decisión en la fase de voz: guardarla solo en el dispositivo con `expo-secure-store`).

## Migraciones: fuente de verdad

**Decisión: Supabase CLI.** El esquema real incluye RLS, triggers (`handle_new_user`), hook de Auth, publicación Realtime, políticas de Storage, extensiones y, si se desea, `pg_cron`: EF Core migrations no puede expresar eso de forma natural. Pasos:

1. `supabase link` + `supabase db pull` genera `0000_baseline` desde el proyecto remoto (reproduce lo hecho a mano).
2. Verificar que la columna `client_generated_id` (migración EF `20260924000000_AddClientGeneratedIdToAlerts`) ya está en el baseline; entonces **borrar la carpeta `Migrations/` de EF** y quitar `Design` si no se usa para scaffolding. EF solo mapea (`ToTable`, `HasColumnName`), validado con un test de integración contra el esquema local.
3. Cambios nuevos = archivos SQL en `supabase/migrations/`; desarrollo con `supabase start` (requiere Docker) y pruebas pgTAP de RLS (`supabase test db`).
4. **Nada se aplica al remoto sin confirmación de Roberto** (restricción del proyecto): `supabase db push --dry-run` primero.
5. Los tests de integración .NET usan Testcontainers con imagen PostGIS aplicando esas mismas migraciones.

## Scaling Considerations

| Escala | Ajustes |
|--------|---------|
| Demo / 0-1k usuarios | Monolito .NET único con workers in-process; polling 2 s de la tabla; 1 instancia. Hosting **always-on** (los workers mueren si el host escala a cero) |
| 1k-100k usuarios | Varias instancias del API: `SKIP LOCKED` ya lo permite sin cambios; separar workers a un proceso/host propio; `alert_locations` particionada por mes; rate limits; Broadcast privado en lugar de Postgres Changes |
| 100k+ | Cola dedicada (SQS/Service Bus) detrás de los mismos puertos; read replica para el panel; retención/archivo de ubicaciones |

### Scaling Priorities

1. **Primer cuello:** escrituras de `alert_locations` y eventos Realtime por UPDATE de `alerts` (5 s × alertas activas) → batch (ya previsto), particionado, Broadcast.
2. **Segundo:** rate limits del proveedor SMS → prioridad en la cola (`priority`), reintentos con backoff, segundo proveedor detrás de `INotificationChannel`.

## Anti-Patterns

### Anti-Pattern 1: Cola en memoria como fuente de verdad

**What people do:** `Channel<T>` + `BackgroundService` y "ya está" (estado actual).
**Why it's wrong:** un reinicio o deploy pierde SMS de una emergencia; viola el Core Value.
**Do this instead:** outbox en Postgres (Pattern 1); el Channel solo despierta al worker.

### Anti-Pattern 2: Decirle al usuario "enviado" por optimismo

**What people do:** mostrar "Contactos notificados" al recibir el 201 o al tocar el botón.
**Why it's wrong:** es exactamente el defecto del legacy; el 201 solo significa "encolado".
**Do this instead:** estados en la UI derivados de `notification_deliveries` (guardada → en cola → enviada → entregada/falló), por contacto.

### Anti-Pattern 3: Hangfire / pgmq / broker externo "porque es una cola"

**What people do:** añaden Hangfire.PostgreSql o pgmq.
**Why it's wrong:** Hangfire necesita conexión en *session mode* (LISTEN/NOTIFY, advisory locks no sirven en el pooler de transaction mode puerto 6543), crea su propio esquema y dashboard que hay que proteger, y **no da el registro por contacto**, que hay que construir igual. pgmq es válido (Supabase Queues, exactly-once dentro de la visibility timeout) pero se usa por SQL crudo, sin EF, y tampoco da el estado visible por contacto.
**Do this instead:** outbox propio (~150 líneas); pgmq sería el plan B si el outbox se complica; broker externo solo en 100k+.

### Anti-Pattern 4: Roles en `user_metadata`

**What people do:** `user_metadata.role = 'officer'`.
**Why it's wrong:** el usuario puede editar su propio `user_metadata`; cualquier ciudadano se haría policía.
**Do this instead:** claims desde `officers` vía Access Token Hook (o `app_metadata`, solo escribible por servidor).

### Anti-Pattern 5: Móvil escribiendo directo a tablas con PostgREST

**What people do:** `supabase.from('alerts').insert(...)` desde la app.
**Why it's wrong:** salta máquina de estados, idempotencia, deliveries y outbox.
**Do this instead:** una sola puerta de escritura (API); RLS sin policies de INSERT/UPDATE para clientes.

### Anti-Pattern 6: Lógica de SOS duplicada entre nativo y JS

**What people do:** el servicio Kotlin y la pantalla implementan cada uno su "crear alerta".
**Why it's wrong:** divergen (el activador "falla" y el botón no, o viceversa).
**Do this instead:** una sola ruta: nativo detecta + cuenta regresiva → Headless JS → `TriggerSos`.

### Anti-Pattern 7: IA en el camino crítico o con poder de descartar

**What people do:** esperar la clasificación antes de notificar, o auto-descartar "falsas alarmas".
**Why it's wrong:** un falso negativo del LLM en una emergencia real es inaceptable; además latencia.
**Do this instead:** notificar en t=0; la IA reordena y resume; solo un oficial o el PIN del usuario cierran.

### Anti-Pattern 8: Big-bang refactor antes del demo

**What people do:** reescribir todo el API a Clean Architecture antes de entregar nada.
**Why it's wrong:** quedan 9 días hasta el 2026-10-15.
**Do this instead:** crear los 4 proyectos y mover lo existente mecánicamente (1 día), y construir **solo lo nuevo** (CreateAlert, deliveries, tracking) en el estilo objetivo; el resto migra después, controller a controller.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Twilio SMS | `INotificationChannel` + worker; status callback firmado | Cuenta de prueba solo envía a números verificados; en Colombia puede requerirse registro de sender/número: **iniciar el trámite el día 1** (MEDIA, verificar). Callback requiere URL pública HTTPS |
| Supabase Auth (OTP celular) | `updateUser({phone})` con proveedor Twilio configurado en Supabase | No implementar OTP propio |
| Expo Push | `ExpoPushChannel`; recibos para estado | Solo contactos que sean usuarios con teléfono verificado y token; SMS sigue siendo el canal base |
| Supabase Storage | URL firmada de subida/descarga generada por API (service key solo en el servidor) | Cifrado: TLS + cifrado en reposo del proveedor + bucket privado; cifrado de cliente (envelope) complicaría la IA: decisión legal pendiente (Ley 1581) |
| STT / LLM | `ITranscriber`, `IAlertClassifier` | Español colombiano, salida JSON estructurada, timeout y reintentos; costo por alerta a medir |
| Supabase Realtime | supabase-js en el panel; publicación solo de `alerts` | Los eventos respetan RLS; refetch al reconectar |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Mobile ↔ API | REST + JWT, cliente tipado generado del OpenAPI (Swashbuckle ya está) | Falta publicar `openapi.json` versionado (CONCERNS) |
| Módulo Kotlin ↔ JS | Eventos del módulo Expo + Headless JS task | Un solo contrato: `triggerSos(channel)` |
| Api ↔ Application | Llamada directa a handlers | Controllers delgados: parse, authz, mapear a ProblemDetails |
| Application ↔ Infrastructure | Puertos (interfaces) en Application | Twilio/Expo/IA/Storage intercambiables y fakeables en tests |
| Workers ↔ BD | Tabla como cola (`SKIP LOCKED`) | Sin estado en memoria; reinicio seguro |
| Panel ↔ API/Supabase | API para datos y acciones; Realtime solo señal | CORS en el API para el dominio del web |
| Página pública ↔ API | `GET /api/public/tracking/{token}` anónimo | Sin supabase-js, sin PII (nombre de pila solamente) |

## Orden de construcción sugerido

Hoy es 2026-10-06; el demo es el 2026-10-15 (9 días). Camino crítico: **dispararla → que llegue (SMS con link) → verla moverse → un activador sin abrir la app → que un oficial la vea**.

```
 Día 1 (externos, en paralelo todo el sprint): Twilio (número/sender), hosting always-on HTTPS,
        dev build Android (EAS o Gradle local), proyecto web hosting estático

 F0 Cimientos ──► F1 SOS vertical ──► F2 Manos libres + tracking en 2º plano ──► F3 Panel mínimo ──► F4 IA mínima
   (1-2 d)          (3-4 d)               (2 d)                                    (2 d, paralelo     (1-2 d)
                                                                                    a F2 si hay 2 pers.)
```

| Fase | Contenido | Por qué en este orden | Demo |
|------|-----------|----------------------|------|
| **F0 Cimientos** | `supabase db pull` baseline + migración 1 (tablas nuevas, `cai_id`, índices FK, policies de `alerts`, `(select)`); 4 proyectos .NET + ProblemDetails + export OpenAPI; test de la máquina de estados; shell móvil con tema/navegación, login, cliente HTTP | Todo lo demás depende del esquema y del contrato; el diseño completo se construye aquí en paralelo | Sí |
| **F1 SOS vertical** | Botón + cuenta regresiva → `TriggerSos` + outbox SQLite → `CreateAlert` transaccional → `DeliveryDispatcher` + Twilio SMS con link → webhook de estado → ubicación en primer plano por lotes → página pública `/t/:token` (polling) → pantalla "alerta activa" con entregas reales | Es el núcleo y valida cola durable, idempotencia y veracidad; sin esto nada más tiene sentido | Sí (núcleo) |
| **F2 Manos libres + background** | Módulo Kotlin: FGS + shake + cuenta regresiva nativa + Headless JS; permiso de ubicación "siempre"; FGS `location`; onboarding de permisos reales | Reutiliza `TriggerSos` de F1 sin tocar el backend; **shake primero** (sin micrófono, sin las restricciones de Android 14 para FGS de micrófono) | Sí (1 activador) |
| **F3 Panel mínimo** | Hook de claims, officer seed, RLS por CAI, `apps/web/panel`: login, lista por prioridad, mapa Leaflet/MapLibre, detalle (trail), atender/descartar vía API, Realtime invalidación | Requiere alertas reales de F1 y ubicación viva de F1/F2; RLS aquí se prueba con pgTAP | Sí |
| **F4 IA mínima** | Puerto `IAlertClassifier` con reglas R1-R5 existentes + resumen; luego audio → STT → LLM como job | Depende del outbox/jobs (F1) y del panel (F3) para mostrarse; el audio **en primer plano** (botón en app) basta para el demo | Mínimo |
| **Post-demo** | Push (tokens + Expo), audio desde segundo plano, pulsaciones de encendido/volumen/voz, PIN de cancelación, llamada 123, historial completo, OTP, hardening (rol de BD sin BYPASSRLS, particionado, Broadcast), migrar controllers restantes a handlers | Cada uno añade riesgo nativo o legal; ninguno bloquea el recorrido del demo | No |

**Dependencias duras:** F0(esquema) → F1(deliveries/tracking) → F3(panel) · F1(`TriggerSos`) → F2 · F1(jobs) → F4 · hook de roles → F3. F2 y F3 son independientes y pueden ir en paralelo.

## Banderas de investigación por fase

| Fase | Necesita research/spike | Motivo |
|------|--------------------------|--------|
| F2 | **Sí (spike de día 1 de la fase)** | Fiabilidad de Headless JS desde proceso frío; FGS `location` iniciada en background (permitido solo con `ACCESS_BACKGROUND_LOCATION`, doc de Android 14); ahorro de batería por fabricante (Xiaomi/Samsung matan servicios) |
| Post-demo audio/voz | **Sí** | FGS `microphone` tiene restricciones de while-in-use en Android 14: no puede iniciarse desde segundo plano sin exención; indicador de privacidad permanente para keyword spotting |
| F1 SMS | Sí (corto) | Requisitos de Twilio en Colombia, costo, plantilla del mensaje |
| F3 | No | Patrones estándar (Supabase Realtime + RLS); validar solo con pgTAP |
| F4 | Sí (corto) | Elección de STT/LLM para español colombiano, latencia/costo; evaluación con audios de prueba |
| F0 | No | Procedimiento conocido (`db pull`) |

## Sources

- Supabase Realtime: Postgres Changes procesa en un solo hilo y chequea RLS por suscriptor; Broadcast recomendado para escalar — https://supabase.com/docs/guides/realtime/benchmarks (ALTA), https://supabase.com/blog/supabase-realtime-broadcast-and-presence-authorization (ALTA)
- Supabase Queues / pgmq (visibility timeout, exactly-once dentro de la ventana) — https://supabase.com/docs/guides/queues/pgmq (ALTA)
- Supavisor: transaction mode no soporta LISTEN/NOTIFY ni advisory locks (relevante para Hangfire) — https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI (ALTA)
- Custom Access Token Hook y claims RBAC — https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook, https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac (ALTA)
- Android 14: tipos de foreground service y restricción de iniciar FGS `location` desde background salvo `ACCESS_BACKGROUND_LOCATION` — https://developer.android.com/about/versions/14/changes/fgs-types-required (ALTA para location; MEDIA para microphone, ver spike)
- `supabase db pull` para baseline de un esquema creado en el dashboard — documentación de Supabase CLI (MEDIA: resultado de búsqueda secundaria)
- Código existente: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/PROJECT.md` (ALTA)
- Licencia comercial de MediatR, requisitos de Twilio Colombia y fiabilidad de Headless JS desde proceso frío: conocimiento propio, **no verificado** (BAJA-MEDIA); confirmar antes de decidir

---
*Architecture research for: AlertaYA (SOS Android + .NET + Supabase + panel policial)*
*Researched: 2026-10-06*
