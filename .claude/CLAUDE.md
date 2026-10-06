<!-- GSD:project-start source:PROJECT.md -->

## Project

**AlertaYA**

AlertaYA es una app Android de seguridad personal para cualquier ciudadano. Con un botón SOS —o sin siquiera desbloquear el teléfono: agitándolo, presionando varias veces el botón de encendido o de volumen, o diciendo una palabra clave— dispara una alerta que avisa a sus contactos de confianza (SMS, push y link de seguimiento en vivo) y a la policía (panel web para CAI/oficiales), con ubicación en tiempo real, un clip de audio y priorización por IA. Monorepo: app móvil Expo/React Native (`apps/mobile`), API .NET (`apps/api`), panel web policial y base de datos PostgreSQL en Supabase.

**Core Value:** Cuando una persona activa una alerta, alguien que puede ayudar se entera de verdad, con su ubicación real, en segundos. Nunca se informa un envío que no ocurrió ni una ubicación inventada.

### Constraints

- **Plataforma**: solo Android — los activadores en segundo plano dependen de un servicio en primer plano Android.
- **Tech stack**: Expo + TypeScript con development build y módulos nativos (Kotlin) para los activadores — Expo Go no alcanza; back .NET/C#; PostgreSQL en Supabase.
- **Arquitectura**: Clean Architecture + SOLID — decisión del usuario.
- **Timeline**: demo de avance el 2026-10-15 con SOS de punta a punta, diseño completo, al menos un activador, tracking en vivo; IA y panel en versión mínima funcional.
- **Seguridad/privacidad**: Ley 1581 (habeas data) — consentimiento explícito para audio y ubicación; audio cifrado; datos sensibles nunca en texto plano.
- **Veracidad**: la app nunca afirma un envío que no ocurrió ni usa una ubicación sustituta.
- **BD**: cambios de esquema solo como migraciones versionadas y con confirmación de Roberto antes de aplicarlas al proyecto remoto.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript ~6.0.3 - Mobile frontend (Expo/React Native)
- C# - Backend API (.NET 8.0)
- JavaScript - Runtime (Node.js)

## Runtime

- Node.js + npm (mobile app development and deployment)
- .NET 8.0 (ASP.NET Core API runtime)
- npm v9+ (mobile: `package-lock.json` lockfileVersion 3)
- NuGet (API dependencies managed via `.csproj`)

## Frameworks

- Expo ~57.0.24 - Build and deployment platform for React Native
- React 19.2.3 - UI library
- React Native 0.86.3 - Cross-platform mobile framework
- expo-status-bar ~57.0.1 - Status bar component
- ASP.NET Core 8.0 - Web API framework
- Entity Framework Core 8.x - ORM
- Npgsql.EntityFrameworkCore.PostgreSQL 8.x - PostgreSQL provider
- Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite 8.x - Spatial/GIS support
- Swashbuckle.AspNetCore 6.6.2 - Swagger/OpenAPI documentation

## Key Dependencies

- `expo` ~57.0.24 - Expo SDK, includes core native modules
- `react` 19.2.3 - Core UI framework
- `react-native` 0.86.3 - Native module bridge
- `Microsoft.AspNetCore.Authentication.JwtBearer` 8.x - JWT authentication
- `Npgsql.EntityFrameworkCore.PostgreSQL` 8.x - Database access layer
- `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite` 8.x - PostGIS integration for geographic queries
- `Microsoft.EntityFrameworkCore.Design` 8.x - Migrations and tooling (design-time only)

## Configuration

- Mobile: `app.json` - Expo configuration (icon, orientation, Android/iOS settings)
- API: `appsettings.json` / `appsettings.{Environment}.json` (not committed to git)
- API: Environment variables prefixed with `ConnectionStrings__`, `Jwt__`, `SmsFallback__` can override config
- Both: `.env` and `.env*.local` files excluded from git
- Mobile: `tsconfig.json` extends `expo/tsconfig.base`, enables strict mode
- API: `.csproj` targets net8.0, enables nullable reference types, implicit usings
- `Jwt.Authority` - Supabase Auth OIDC endpoint (e.g., `https://<project-ref>.supabase.co/auth/v1`)
- `Jwt.Issuer` - Token issuer (Supabase Auth)
- `Jwt.Audience` - Token audience (default: `authenticated`)
- `Jwt.SigningKey` - Legacy HS256 key (only if project uses legacy JWT signing, not needed for new asymmetric signing)
- `ConnectionStrings.Default` - PostgreSQL connection string (Supabase instance)
- `SmsFallback.Secret` - Shared secret for SMS fallback auth hashing
- `SmsFallback.MaxAgeSeconds` - Token expiration for SMS fallback (default: 300s)

## Platform Requirements

- Node.js (npm v9+)
- Expo CLI: `npx expo` commands
- Development build or Expo Go for testing
- iOS: Xcode (for native builds via EAS), or develop via Expo Go
- Android: Android SDK (for native builds via EAS), or develop via Expo Go
- .NET 8.0 SDK
- PostgreSQL client (psql or similar for schema inspection)
- EAS (Expo Application Services) for builds and over-the-air updates
- Apple Developer account (iOS App Store submission)
- Google Play Developer account (Android)
- .NET 8.0 runtime
- PostgreSQL 14+ (Supabase managed)
- Network access to Supabase Auth endpoints for JWT validation

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Infrastructure/framework words are English (`Controller`, `Service`, `Options`, `Queue`, `Worker`, `Create`, `UpdateState`).
- Domain vocabulary, DB columns, states and property names are Spanish: `Estado`, `CanalActivacion`, `CreadoEn`, `Ubicacion`, `Nombre`, `Telefono`; state values are lowercase snake Spanish strings (`pendiente`, `activa`, `verificando`, `escalada`, `atendida`, `descartada`, `boton_pulsado`). See `apps/api/AlertaYA.Api/Domain/AlertValues.cs`.
- Comments, XML docs, and user-facing error messages are Spanish. Keep this.
- One PascalCase file per type: `Controllers/AlertsController.cs`, `Services/NotificationService.cs`.
- DTOs grouped per feature in plural files: `Models/DTOs/AlertDtos.cs`.
- Entities in `Models/Entities/`, one per file.
- PascalCase types/methods; interfaces `I` prefix (`Services/Abstractions/`); private fields `_camelCase` (`_db`, `_queue`, `_logger`).
- Async methods suffixed `Async` in services (`NotifySosAsync`); controller actions are bare verbs (`Create`, `UpdateState`, `AddLocation`).
- Constant sets are static classes with `const string` members plus `Todos` array and `EsValido(...)` (`AlertEstados`, `AlertCanalActivacion`, `FuenteUbicacion`). Use this instead of enums.
- Routes are lowercase: `[Route("api/alerts")]`.
- Scaffold only: `App.tsx`, `index.ts`. Components PascalCase; styles via `StyleSheet.create` at file bottom. Routes go in `src/app/` (Expo Router, per `AGENTS.md`), non-route code outside it.

## Code Style

- No Prettier/EditorConfig/ESLint config detected in the active apps. Match existing style: C# Allman braces, 4-space indent, trailing commas in multi-line initializers; TS 2-space indent, single quotes, semicolons.
- Mobile: `npx expo lint` and `npx tsc --noEmit` (required before finishing a task per `AGENTS.md`). `apps/mobile/tsconfig.json` extends `expo/tsconfig.base` with `strict: true`.
- API: `<Nullable>enable</Nullable>` in `AlertaYA.Api.csproj`, target `net8.0` (legacy domain project uses net10.0).

## Import Organization

## Error Handling

- Controllers return `ActionResult<T>` and use inline guards with early returns: `Unauthorized()`, `NotFound(new { error = "..." })`, `BadRequest(new { error = "..." })`. Error body is an anonymous object `{ error = "..." }`, optionally with extra hints (`estadoActual`, `transicionesPermitidas`).
- User identity: `User.GetUserId()` (`Extensions/ClaimsPrincipalExtensions.cs`); each action wraps `GetUserIdOrFail()` in try/catch `UnauthorizedAccessException` -> `Unauthorized()`.
- Ownership is enforced in the query (`a.Id == id && a.UserId == userId`); missing and foreign both give 404.
- Idempotency/race: catch `DbUpdateException when (IsViolacionUnico(ex))` and return the existing row.
- State transitions validated via `AlertStateMachine.PuedeTransicionar` (`Domain/AlertStateMachine.cs`).
- Validate input with `X.EsValido(...)` helpers, not attributes.

## Logging

- `ILogger<T>` injected; structured templates with named placeholders (`"Alerta {AlertId} no encontrada..."`). Levels: `LogWarning` for skipped work, `LogInformation` for stub/flow events. Stubs are tagged (`[SOS-STUB]`). No `console.log` patterns in mobile yet.

## Comments

- XML `/// <summary>` on public controller actions, in Spanish, citing the spec section ("sección 6/7/8"). Inline comments explain why (races, idempotency, deliberate stubs). Mark deliberate stubs explicitly.

## Function Design

- Controllers are thin but hold logic inline (no service layer for alerts yet); background work goes through `IAlertEventQueue` + workers in `Services/Background/`. Always accept and forward `CancellationToken`.
- DTOs expose `static From(entity)` mappers (`AlertResponse.From(alerta)`).

## Module Design

- DI via constructor injection, registered in `Program.cs`. Config via strongly typed `Options` classes (`Options/JwtOptions.cs`), bound from sections (`Jwt`, `SmsFallback`); never hardcode secrets (`appsettings.Example.json` is the template).
- No barrel files.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- **Stateful REST**: Alerts have explicit finite-state machine lifecycle (6 states, validated transitions)
- **Idempotent creates**: Clients send `clientGeneratedId`; duplicates return existing alert instead of creating new
- **Async-first background**: Alert creation immediately enqueues verification and notification; response never waits
- **Supabase-native**: JWT auth delegated to Supabase; database schema pre-exists; PostGIS geography for location
- **Single-project monolith**: One C# project (AlertaYA.Api) with no library separation

## Layers

- Purpose: Accept HTTP requests, parse DTOs, validate input, return responses
- Location: `apps/api/AlertaYA.Api/Controllers/`
- Contains: AlertsController, ProfilesController, EmergencyContactsController
- Depends on: AppDbContext (for queries/writes), IAlertEventQueue, INotificationService, IVerificationService
- Used by: HTTP clients (Expo mobile app, SMS gateway webhooks)
- Key pattern: Extract `userId` from JWT claim "sub" (never from request body/URL); validate all state transitions via AlertStateMachine
- Purpose: Encode immutable business rules (valid states, transitions, values)
- Location: `apps/api/AlertaYA.Api/Domain/`
- Contains: AlertStateMachine (transition validation), AlertValues (state/channel/priority/location-source enums)
- Depends on: Nothing (pure logic, no I/O)
- Used by: Controllers (to validate transitions before persistence)
- Key pattern: Static classes with const strings and validation helpers; no ORM coupling
- Purpose: Map Supabase Postgres tables to .NET entities; coordinate relationships
- Location: `apps/api/AlertaYA.Api/Data/`, `apps/api/AlertaYA.Api/Models/Entities/`
- Contains: AppDbContext, five DbSet entities (Profile, EmergencyContact, Alert, AlertLocation, VerificationLog)
- Depends on: Microsoft.EntityFrameworkCore.PostgreSQL, Npgsql, NetTopologySuite
- Used by: Controllers, Workers
- Key pattern: One migration adds `client_generated_id` column; existing schema not generated (pre-exists in Supabase)
- Purpose: Encapsulate reusable async operations (notifications, verification, SMS auth)
- Location: `apps/api/AlertaYA.Api/Services/`
- Contains: Abstractions (IAlertEventQueue, INotificationService, IVerificationService, ISmsFallbackAuthService) + implementations
- Depends on: AppDbContext, configuration (IOptions)
- Used by: Controllers, background workers
- Key pattern: Async-first (Task/ValueTask); dependency injection via DI container
- Purpose: Consume queued events and execute long-running operations off the HTTP request path
- Location: `apps/api/AlertaYA.Api/Services/Background/`
- Contains: NotificationWorker, VerificationWorker (both inherit BackgroundService)
- Depends on: IAlertEventQueue, respective service (INotificationService or IVerificationService), AppDbContext
- Used by: ASP.NET Core hosted services; started automatically on app launch
- Key pattern: Long-running while loop that dequeues and processes events; scoped DbContext per event (avoids tracking issues)
- Purpose: Define JSON request/response contracts; separate from entities
- Location: `apps/api/AlertaYA.Api/Models/DTOs/`
- Contains: AlertResponse, AlertStatusResponse, CreateAlertRequest, UpdateAlertStateRequest, UpdateAlertLocationRequest, SmsFallbackRequest, ProfileDto, etc.
- Depends on: Entity types (for mapping methods)
- Used by: Controllers (input validation, response serialization)
- Key pattern: `From(Entity)` static factory methods convert entities to DTOs; DTO records use `required` parameters

## Data Flow

### Primary Request Path: Create Alert

### Background: Notification Processing

### Background: Verification Processing

### Update Alert State

### Add Location to Active Alert

### SMS Fallback (No Auth Required)

- **Transient**: AlertCreatedEvent objects; queued and consumed once
- **Scoped**: DbContext per HTTP request/background job; queries/writes isolated per context
- **Singleton**: AlertEventQueue, IAlertEventQueue channels (shared across all requests/workers)
- **Configuration**: JwtOptions, SmsFallbackOptions loaded from appsettings at startup

## Key Abstractions

- Purpose: Encode all valid alert state transitions in one place; single source of truth
- Examples: `AlertEstados.Pendiente`, `AlertEstados.Activa`, `AlertEstados.Escalada`
- Pattern: Static readonly dictionary of allowed transitions; methods PuedeTransicionar(from, to) and TransicionesPermitidas(from)
- Guarantees: Any transition not in the table is rejected with a 400 error + allowed options
- Purpose: Decouple HTTP response from verification/notification latency; fan out one event to multiple consumers
- Examples: NotificationWorker and VerificationWorker both receive the same AlertCreatedEvent
- Pattern: System.Threading.Channels (SingleReader = true for each consumer channel, SingleWriter = false to allow multiple HTTP threads to enqueue)
- Guarantees: Non-blocking TryWrite; events lost on process restart (acceptable for prototype; upgrade to durable queue if needed)
- Purpose: Allow clients to retry alert creation without duplication (e.g., on network timeout)
- Pattern: Client generates UUID, includes in request; backend checks unique constraint (user_id, client_generated_id)
- Guarantees: Unique index in Postgres ensures exactly one alert per (user, clientGeneratedId) pair; duplicate requests return 201 with existing alert
- Purpose: Store alert locations and compute distances, containment, etc. at scale
- Examples: `Alert.Ubicacion` stored as geography(point, 4326) in Postgres
- Pattern: NetTopologySuite.Geometries.Point converted to/from DTO (lat, lon) via GeoPointExtensions
- Note: PostGIS uses X (longitude), Y (latitude); DTO uses Lat (Y), Lon (X) — always convert

## Entry Points

- Location: `apps/api/AlertaYA.Api/Controllers/`
- Triggers: HTTP requests to routes `/api/alerts`, `/api/profiles`, `/api/emergency-contacts`
- Responsibilities: Parse input, extract JWT, validate state, persist changes, enqueue async work
- Location: `apps/api/AlertaYA.Api/Services/Background/`
- Triggers: Started by ASP.NET Core at app launch; run indefinitely
- Responsibilities: Consume queued events, call external services (notifications, verification), log errors
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

### Fire-and-Forget Notifications Without Retry

### Trusting client-provided location without precision metadata

## Error Handling

- **400 Bad Request**: Invalid input (estado not in AlertEstados.Todos, transition not allowed, missing clientGeneratedId)
- **401 Unauthorized**: Missing/invalid JWT, failed HMAC validation for SMS
- **404 Not Found**: Alert/profile/contact not found for current user
- **409 Conflict**: Alert in state that does not accept location updates
- **500 Internal Server Error**: Database connectivity, unexpected exceptions (logged with full stack trace)

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
