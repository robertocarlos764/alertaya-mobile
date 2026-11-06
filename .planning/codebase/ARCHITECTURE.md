---
last_mapped_commit: e508685e1915fdaca9091011aa6fc7a60807bc93
last_mapped_at: 2026-09-28
---
<!-- refreshed: 2026-09-28 -->

# Architecture

**Analysis Date:** 2026-09-28

## System Overview

This is a **monorepo** with two active applications (mobile and API) plus legacy reference materials:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       Client Applications                               │
├─────────────────────────────────────┬─────────────────────────────────┤
│  Expo/React Native Mobile          │  Reserved for Web                 │
│  `apps/mobile`                      │  (not yet implemented)            │
│  Entry: App.tsx                     │                                   │
│  Status: Scaffold, nearly empty     │                                   │
└─────────────────────────────────────┴─────────────────────────────────┘
                     ▼
        ┌──────────────────────────────┐
        │   REST API (JSON-RPC)        │
        │   `apps/api/AlertaYA.Api`    │
        │   .NET 8.0 / ASP.NET Core    │
        │   Entry: Program.cs          │
        └──────────────────────────────┘
                     │
        ┌────────────┼─────────────┐
        │            │             │
        ▼            ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │ Postgres │  │ Supabase │  │ SMS Gateway  │
    │ (Supabase)  │  Auth    │  │  (Twilio)    │
    │ 5432     │  │ JWT      │  │ (TBD)        │
    └──────────┘  └──────────┘  └──────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **AlertsController** | REST endpoints for alert lifecycle (create, update state, add location, list history) | `apps/api/AlertaYA.Api/Controllers/AlertsController.cs` |
| **ProfilesController** | GET/PATCH user profile (name, phone, keyword); read-only for admin fields | `apps/api/AlertaYA.Api/Controllers/ProfilesController.cs` |
| **EmergencyContactsController** | CRUD emergency contacts (name, phone, relation) | `apps/api/AlertaYA.Api/Controllers/EmergencyContactsController.cs` |
| **AppDbContext** | EF Core DbContext mapping to Supabase Postgres tables; coordinates entity relationships | `apps/api/AlertaYA.Api/Data/AppDbContext.cs` |
| **AlertStateMachine** | Domain logic: validates alert state transitions (pendiente → activa/descartada → ...) | `apps/api/AlertaYA.Api/Domain/AlertStateMachine.cs` |
| **AlertEventQueue** | In-memory System.Threading.Channels queue; enqueues alert events to notification and verification workers | `apps/api/AlertaYA.Api/Services/AlertEventQueue.cs` |
| **NotificationWorker** | Background service consuming queued alerts; calls INotificationService to notify emergency contacts | `apps/api/AlertaYA.Api/Services/Background/NotificationWorker.cs` |
| **VerificationWorker** | Background service consuming queued alerts; calls IVerificationService for AI-driven alert scoring (stub) | `apps/api/AlertaYA.Api/Services/Background/VerificationWorker.cs` |

## Pattern Overview

**Overall:** Layered architecture with command-response REST API, EF Core ORM, state machine validation, and async background processing.

**Key Characteristics:**

- **Stateful REST**: Alerts have explicit finite-state machine lifecycle (6 states, validated transitions)
- **Idempotent creates**: Clients send `clientGeneratedId`; duplicates return existing alert instead of creating new
- **Async-first background**: Alert creation immediately enqueues verification and notification; response never waits
- **Supabase-native**: JWT auth delegated to Supabase; database schema pre-exists; PostGIS geography for location
- **Single-project monolith**: One C# project (AlertaYA.Api) with no library separation

## Layers

**Controllers (HTTP Entry):**

- Purpose: Accept HTTP requests, parse DTOs, validate input, return responses
- Location: `apps/api/AlertaYA.Api/Controllers/`
- Contains: AlertsController, ProfilesController, EmergencyContactsController
- Depends on: AppDbContext (for queries/writes), IAlertEventQueue, INotificationService, IVerificationService
- Used by: HTTP clients (Expo mobile app, SMS gateway webhooks)
- Key pattern: Extract `userId` from JWT claim "sub" (never from request body/URL); validate all state transitions via AlertStateMachine

**Domain (Business Logic):**

- Purpose: Encode immutable business rules (valid states, transitions, values)
- Location: `apps/api/AlertaYA.Api/Domain/`
- Contains: AlertStateMachine (transition validation), AlertValues (state/channel/priority/location-source enums)
- Depends on: Nothing (pure logic, no I/O)
- Used by: Controllers (to validate transitions before persistence)
- Key pattern: Static classes with const strings and validation helpers; no ORM coupling

**Data (EF Core + Schema):**

- Purpose: Map Supabase Postgres tables to .NET entities; coordinate relationships
- Location: `apps/api/AlertaYA.Api/Data/`, `apps/api/AlertaYA.Api/Models/Entities/`
- Contains: AppDbContext, five DbSet entities (Profile, EmergencyContact, Alert, AlertLocation, VerificationLog)
- Depends on: Microsoft.EntityFrameworkCore.PostgreSQL, Npgsql, NetTopologySuite
- Used by: Controllers, Workers
- Key pattern: One migration adds `client_generated_id` column; existing schema not generated (pre-exists in Supabase)

**Services (Business Operations):**

- Purpose: Encapsulate reusable async operations (notifications, verification, SMS auth)
- Location: `apps/api/AlertaYA.Api/Services/`
- Contains: Abstractions (IAlertEventQueue, INotificationService, IVerificationService, ISmsFallbackAuthService) + implementations
- Depends on: AppDbContext, configuration (IOptions)
- Used by: Controllers, background workers
- Key pattern: Async-first (Task/ValueTask); dependency injection via DI container

**Background Workers:**

- Purpose: Consume queued events and execute long-running operations off the HTTP request path
- Location: `apps/api/AlertaYA.Api/Services/Background/`
- Contains: NotificationWorker, VerificationWorker (both inherit BackgroundService)
- Depends on: IAlertEventQueue, respective service (INotificationService or IVerificationService), AppDbContext
- Used by: ASP.NET Core hosted services; started automatically on app launch
- Key pattern: Long-running while loop that dequeues and processes events; scoped DbContext per event (avoids tracking issues)

**DTOs (Serialization):**

- Purpose: Define JSON request/response contracts; separate from entities
- Location: `apps/api/AlertaYA.Api/Models/DTOs/`
- Contains: AlertResponse, AlertStatusResponse, CreateAlertRequest, UpdateAlertStateRequest, UpdateAlertLocationRequest, SmsFallbackRequest, ProfileDto, etc.
- Depends on: Entity types (for mapping methods)
- Used by: Controllers (input validation, response serialization)
- Key pattern: `From(Entity)` static factory methods convert entities to DTOs; DTO records use `required` parameters

## Data Flow

### Primary Request Path: Create Alert

1. Client sends `POST /api/alerts` with `clientGeneratedId`, `canalActivacion`, optional `ubicacionInicial` (`apps/api/AlertaYA.Api/Controllers/AlertsController.cs:45`)
2. Controller extracts `userId` from JWT claim "sub" (`apps/api/AlertaYA.Api/Extensions/ClaimsPrincipalExtensions.cs:14`)
3. Controller checks idempotence: query Alerts for `(UserId, ClientGeneratedId)` pair (`AlertsController.cs:76`)
   - If exists: return 201 with existing alert
   - If not: proceed to create
4. Validate `canalActivacion` against AlertCanalActivacion.Todos (`AlertsController.cs:57`)
5. Create Alert entity, set `Estado = AlertEstados.Pendiente` (`AlertsController.cs:88`)
6. EF Core inserts into `alerts` table, transaction commits (`AlertsController.cs:105`)
7. **Async fire:** Enqueue AlertCreatedEvent to both verification and notification channels (non-blocking) (`AlertsController.cs:121`)
8. Return 201 with AlertResponse

### Background: Notification Processing

1. NotificationWorker polls `_notificationChannel` indefinitely (`NotificationWorker.cs:28`)
2. Dequeues AlertCreatedEvent (`NotificationWorker.cs:32`)
3. Queries Alert and all EmergencyContacts for that user (`NotificationWorker.cs:56–69`)
4. Calls `INotificationService.NotifySosAsync(alert, contacts)` (stub; sends SMS/push to contacts) (`NotificationWorker.cs:72`)
5. Logs errors but does not fail request or retry (fire-and-forget) (`NotificationWorker.cs:43–46`)

### Background: Verification Processing

1. VerificationWorker polls `_verificationChannel` indefinitely
2. Dequeues AlertCreatedEvent
3. Calls `IVerificationService.VerifyAlertAsync(alert)` (stub; AI scoring, movement/audio/location consistency) (stub; TBD)
4. If AI deems alert low priority, may auto-transition state or escalate (pending implementation)

### Update Alert State

1. Client sends `PATCH /api/alerts/{id}` with new `estado` (`AlertsController.cs:131`)
2. Controller queries Alert by id and userId (enforces ownership) (`AlertsController.cs:143`)
3. Validate new estado via AlertStateMachine.PuedeTransicionar (`AlertsController.cs:156`)
   - If invalid transition: return 400 with allowed transitions
4. Update `estado` and `actualizadoEn` in entity, commit to Postgres (`AlertsController.cs:166`)
5. Return 200 with AlertStatusResponse

### Add Location to Active Alert

1. Client sends `POST /api/alerts/{id}/location` with `lat`, `lon`, optional `precisionMetros`, `fuente` (`AlertsController.cs:179`)
2. Controller queries Alert by id and userId (`AlertsController.cs:191`)
3. Validate alert is in location-receiving state (Activa, Verificando, Escalada) (`AlertsController.cs:199`)
4. Create AlertLocation entity with same geo point (`AlertsController.cs:217`)
5. Update Alert's `ubicacion`, `ubicacionPrecisionMetros`, `ubicacionFuente` with same values (single transaction) (`AlertsController.cs:227`)
6. Commit both to Postgres (`AlertsController.cs:233`)
7. Return 200 with updated AlertStatusResponse

### SMS Fallback (No Auth Required)

1. SMS gateway (Twilio or other) receives incoming SMS, parses location from body
2. Gateway calls `POST /api/alerts/sms-fallback` with userId, lat, lon, hash (HMAC validation) (`AlertsController.cs:295`)
3. Controller validates hash via ISmsFallbackAuthService (timestamp window check) (`AlertsController.cs:298`)
4. Create Alert as if via normal channel, set `ubicacionFuente = FuenteUbicacion.Celular` (`AlertsController.cs:335`)
5. Enqueue to both workers, return 201 (idempotent if clientGeneratedId provided)

**State Management:**

- **Transient**: AlertCreatedEvent objects; queued and consumed once
- **Scoped**: DbContext per HTTP request/background job; queries/writes isolated per context
- **Singleton**: AlertEventQueue, IAlertEventQueue channels (shared across all requests/workers)
- **Configuration**: JwtOptions, SmsFallbackOptions loaded from appsettings at startup

## Key Abstractions

**AlertStateMachine (Value Object):**

- Purpose: Encode all valid alert state transitions in one place; single source of truth
- Examples: `AlertEstados.Pendiente`, `AlertEstados.Activa`, `AlertEstados.Escalada`
- Pattern: Static readonly dictionary of allowed transitions; methods PuedeTransicionar(from, to) and TransicionesPermitidas(from)
- Guarantees: Any transition not in the table is rejected with a 400 error + allowed options

**AlertEventQueue (In-Memory Pub-Sub):**

- Purpose: Decouple HTTP response from verification/notification latency; fan out one event to multiple consumers
- Examples: NotificationWorker and VerificationWorker both receive the same AlertCreatedEvent
- Pattern: System.Threading.Channels (SingleReader = true for each consumer channel, SingleWriter = false to allow multiple HTTP threads to enqueue)
- Guarantees: Non-blocking TryWrite; events lost on process restart (acceptable for prototype; upgrade to durable queue if needed)

**Idempotency via ClientGeneratedId:**

- Purpose: Allow clients to retry alert creation without duplication (e.g., on network timeout)
- Pattern: Client generates UUID, includes in request; backend checks unique constraint (user_id, client_generated_id)
- Guarantees: Unique index in Postgres ensures exactly one alert per (user, clientGeneratedId) pair; duplicate requests return 201 with existing alert

**Geo-Spatial with PostGIS:**

- Purpose: Store alert locations and compute distances, containment, etc. at scale
- Examples: `Alert.Ubicacion` stored as geography(point, 4326) in Postgres
- Pattern: NetTopologySuite.Geometries.Point converted to/from DTO (lat, lon) via GeoPointExtensions
- Note: PostGIS uses X (longitude), Y (latitude); DTO uses Lat (Y), Lon (X) — always convert

## Entry Points

**HTTP Handlers (Controllers):**

- Location: `apps/api/AlertaYA.Api/Controllers/`
- Triggers: HTTP requests to routes `/api/alerts`, `/api/profiles`, `/api/emergency-contacts`
- Responsibilities: Parse input, extract JWT, validate state, persist changes, enqueue async work

**Background Services:**

- Location: `apps/api/AlertaYA.Api/Services/Background/`
- Triggers: Started by ASP.NET Core at app launch; run indefinitely
- Responsibilities: Consume queued events, call external services (notifications, verification), log errors

**Program.cs (DI Bootstrap):**

- Location: `apps/api/AlertaYA.Api/Program.cs`
- Triggers: App startup
- Responsibilities: Register services, configure DB, set up authentication, start background workers

## Architectural Constraints

- **Threading:** ASP.NET Core uses thread pool; background workers run on separate threads. No shared mutable state except AlertEventQueue (thread-safe via Channels).
- **Global state:** AlertEventQueue is a singleton; no other module-level singletons. DbContext is scoped per request/job.
- **Circular imports:** No known circular dependencies (clean separation: Controllers → Domain + Services → Data).
- **Database schema:** Pre-existing in Supabase; migrations only add columns (e.g., client_generated_id). Never drop tables or rename columns in migration without coordination with legacy data.
- **JWT Validation:** Always extract userId from "sub" claim in JWT; never trust user_id from request body. Authority/JWKS downloaded from Supabase on app startup (new projects) or HS256 validated with SigningKey (legacy projects).

## Anti-Patterns

### Directly Using Request Body for userId

**What happens:** Code checks `int userId = request.UserId` without validating against JWT.

**Why it's wrong:** Clients can forge userId in JSON body; unauthorized users can modify other users' alerts.

**Do this instead:** Use `User.GetUserId()` from `ClaimsPrincipalExtensions` (extracts from JWT "sub" claim). See `AlertsController.cs:34`.

### Fire-and-Forget Notifications Without Retry

**What happens:** NotificationWorker sends SMS/push once; if SMS gateway is down, no retry, no logging to retry queue.

**Why it's wrong:** Emergency contacts may not be notified if network hiccup.

**Do this instead:** Implement durable queue (e.g., persistence to notification_attempts table) and retry loop with exponential backoff. Track attempt count, log failures for ops review.

### Trusting client-provided location without precision metadata

**What happens:** Frontend sends lat/lon with no accuracy radius (precisionMetros = null).

**Why it's wrong:** Responders have no idea if location is 5m or 5km off; affects dispatch urgency.

**Do this instead:** Always send precisionMetros from device GPS accuracy. If unavailable (e.g., network fallback), use a conservative default (e.g., 1000m) and set fuente = "cache" or "celular".

## Error Handling

**Strategy:** Return standard HTTP status codes + JSON error objects; log all exceptions server-side.

**Patterns:**

- **400 Bad Request**: Invalid input (estado not in AlertEstados.Todos, transition not allowed, missing clientGeneratedId)
- **401 Unauthorized**: Missing/invalid JWT, failed HMAC validation for SMS
- **404 Not Found**: Alert/profile/contact not found for current user
- **409 Conflict**: Alert in state that does not accept location updates
- **500 Internal Server Error**: Database connectivity, unexpected exceptions (logged with full stack trace)

## Cross-Cutting Concerns

**Logging:** ILogger<T> injected into controllers and workers; errors logged at ERROR level, info at INFO level. Example: `_logger.LogWarning("Alerta {AlertId} no encontrada al notificar. Se omite.", alertaEvent.AlertId)`.

**Validation:** Centralized in Domain (AlertStateMachine, AlertValues); all validators return bool, controllers convert bool to error response. No database constraints relied upon except uniqueness (user_id, client_generated_id).

**Authentication:** Supabase JWT via ASP.NET Core's JwtBearerDefaults. All endpoints except POST /api/alerts/sms-fallback decorated with [Authorize]. No custom role-based access control yet (future: admin role for admin fields in Profile).

---

*Architecture analysis: 2026-09-28*
