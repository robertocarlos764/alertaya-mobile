---
last_mapped_commit: e508685e1915fdaca9091011aa6fc7a60807bc93
last_mapped_at: 2026-09-28
---
# Codebase Structure

**Analysis Date:** 2026-09-28

## Directory Layout

```
alertaya-mobile/                          # Monorepo root
├── .claude/                              # Claude Code workspace config
├── .git/                                 # Git repository
├── .planning/                            # GSD planning directory (codebase docs, phase plans)
├── apps/
│   ├── mobile/                           # Expo/React Native client (SDK 57)
│   │   ├── assets/                       # Icons, images
│   │   ├── App.tsx                       # Root component (currently a scaffold)
│   │   ├── index.ts                      # Expo entry point
│   │   ├── app.json                      # Expo configuration
│   │   ├── package.json                  # Dependencies (expo, react, react-native, typescript)
│   │   ├── tsconfig.json                 # TypeScript config (extends expo/tsconfig.base, strict mode)
│   │   ├── package-lock.json             # Lock file
│   │   └── AGENTS.md                     # Expo/RN development rules
│   │
│   └── api/                              # .NET 8.0 ASP.NET Core API
│       └── AlertaYA.Api/                 # Single C# project (monolithic)
│           ├── Controllers/              # REST endpoints
│           │   ├── AlertsController.cs           # POST/PATCH/GET /api/alerts, SMS fallback
│           │   ├── ProfilesController.cs         # GET/PATCH /api/profiles/me
│           │   └── EmergencyContactsController.cs # CRUD /api/emergency-contacts
│           │
│           ├── Data/                     # EF Core Data Access Layer
│           │   └── AppDbContext.cs               # DbContext mapping Supabase tables to entities
│           │
│           ├── Domain/                   # Business Rules (no I/O)
│           │   ├── AlertStateMachine.cs          # Valid state transitions
│           │   └── AlertValues.cs                # Enums: AlertEstados, AlertCanalActivacion, NivelPrioridadIa, FuenteUbicacion
│           │
│           ├── Extensions/               # Helper methods
│           │   ├── ClaimsPrincipalExtensions.cs  # GetUserId() from JWT "sub"
│           │   └── GeoPointExtensions.cs         # ToPoint4326(lat, lon), convert NetTopologySuite.Geometries.Point
│           │
│           ├── Models/                   # Domain entities and DTOs
│           │   ├── Entities/
│           │   │   ├── Alert.cs                  # Alert aggregate: id, userId, estado, ubicacion, etc.
│           │   │   ├── AlertLocation.cs          # Location history: one row per location update
│           │   │   ├── Profile.cs                # User profile: name, phone, keyword, settings
│           │   │   ├── EmergencyContact.cs       # Contact: id, name, phone, relation
│           │   │   └── VerificationLog.cs        # AI verification scores (movement, audio, location consistency)
│           │   │
│           │   └── DTOs/                 # Request/response contracts (JSON serialization)
│           │       ├── AlertDtos.cs              # AlertResponse, AlertStatusResponse, CreateAlertRequest, UpdateAlertStateRequest, UpdateAlertLocationRequest, SmsFallbackRequest, GeoPointDto, UbicacionDto
│           │       ├── ProfileDtos.cs            # ProfileDto, UpdateProfileRequest
│           │       └── EmergencyContactDtos.cs   # (TBD, likely similar pattern)
│           │
│           ├── Options/                  # Strongly-typed configuration classes
│           │   ├── JwtOptions.cs                 # Issuer, Audience, Authority, SigningKey (legacy)
│           │   └── SmsFallbackOptions.cs         # SharedSecret, RequestWindow
│           │
│           ├── Services/                 # Business operations, async work
│           │   ├── Abstractions/
│           │   │   ├── IAlertEventQueue.cs       # Enqueue(AlertCreatedEvent), DequeueForVerificationAsync(), DequeueForNotificationAsync()
│           │   │   ├── INotificationService.cs   # NotifySosAsync(alert, contacts) — send SMS/push to emergency contacts
│           │   │   ├── IVerificationService.cs   # VerifyAlertAsync(alert) — AI scoring (stub)
│           │   │   └── ISmsFallbackAuthService.cs # Validate(userId, lat, lon, timestamp, hash) — HMAC validation
│           │   │
│           │   ├── AlertEventQueue.cs            # In-memory System.Threading.Channels queue (singleton)
│           │   ├── NotificationService.cs        # Stub implementation of INotificationService
│           │   ├── VerificationService.cs        # Stub implementation of IVerificationService
│           │   ├── SmsFallbackAuthService.cs     # HMAC-SHA256 validation
│           │   │
│           │   └── Background/           # Hosted background services
│           │       ├── NotificationWorker.cs     # Consumes alerts, calls INotificationService
│           │       └── VerificationWorker.cs     # Consumes alerts, calls IVerificationService
│           │
│           ├── Migrations/               # EF Core database migrations
│           │   └── 20260924000000_AddClientGeneratedIdToAlerts.cs  # Adds client_generated_id column
│           │
│           ├── Properties/               # .NET project metadata
│           │   └── launchSettings.json   # Dev server config (ASPNETCORE_ENVIRONMENT, ports)
│           │
│           ├── Program.cs                # ASP.NET Core startup: DI, DbContext, Auth, background services
│           ├── AlertaYA.Api.csproj       # Project file: dependencies (EF Core, JWT Bearer, Npgsql, Swashbuckle)
│           ├── AlertaYA.Api.http         # REST Client file (for .http request testing in Visual Studio)
│           └── appsettings.Example.json  # Configuration template (Jwt, SmsFallback, ConnectionStrings)
│
└── docs/                                 # Legacy reference only (NOT built)
    └── legacy/
        ├── flutter/                      # Old Flutter mobile app (reference UI flows)
        │   ├── lib/                      # Dart source
        │   │   ├── core/domain/          # Domain entities, repositories, use cases
        │   │   ├── core/data/            # Data layer (local, remote)
        │   │   └── ui/                   # UI screens, widgets
        │   ├── test/                     # Unit/widget tests
        │   └── pubspec.yaml              # Flutter dependencies
        │
        ├── api-dominio/                  # Old C# domain (richer than current, reference)
        │   ├── src/AlertaYA.Api/         # API entry point
        │   ├── src/AlertaYA.Application/ # Use cases, DTOs
        │   ├── src/AlertaYA.Domain/      # Rich domain model (events, value objects)
        │   ├── src/AlertaYA.Infrastructure/  # DB, external services
        │   └── tests/                    # Domain, application tests
        │
        └── openspec/                     # Migration spec: intended architecture (REFERENCE ONLY)
            ├── specs/                    # API spec, domain model spec
            └── changes/                  # Design documents (Supabase schema, JWT flow, etc.)
```

## Directory Purposes

**`apps/mobile/`:**

- Purpose: Expo/React Native client application (iOS, Android, Web)
- Contains: Scaffold with App.tsx, assets, configuration, no src/ or routing yet
- Key files: `app.json` (Expo config), `package.json` (dependencies), `App.tsx` (root)
- Status: Nearly empty; ready for feature implementation with Expo Router

**`apps/api/AlertaYA.Api/`:**

- Purpose: Production REST API backend
- Contains: Complete layered application (Controllers → Domain + Services → Data)
- Key files: `Program.cs` (bootstrap), Controllers (endpoints), Domain (logic), Services (async work)
- Status: Functional; handles alert lifecycle, profiles, emergency contacts; background verification/notification stubs

**`docs/legacy/`:**

- Purpose: Reference materials only; NOT imported into main build
- Contains: Flutter UI flows, old C# domain model, migration spec
- Usage: Understand what was built, extract UI patterns, check domain evolution
- Note: Directory is in `.gitignore` build artifacts; safe to read for context

## Key File Locations

**Entry Points:**

- `apps/mobile/App.tsx`: React Native root component
- `apps/api/AlertaYA.Api/Program.cs`: ASP.NET Core startup, DI registration
- `apps/api/AlertaYA.Api/appsettings.Example.json`: Configuration template (copy to appsettings.json for local dev)

**Configuration:**

- `apps/mobile/app.json`: Expo SDK version, icon, orientation, iOS/Android adaptations
- `apps/mobile/tsconfig.json`: TypeScript strict mode, extends Expo base config
- `apps/api/AlertaYA.Api/AlertaYA.Api.csproj`: .NET version (8.0), dependencies (EF, JWT, Npgsql)
- `apps/api/AlertaYA.Api/Options/JwtOptions.cs`, `SmsFallbackOptions.cs`: Configuration classes bound via appsettings

**Core Logic:**

- `apps/api/AlertaYA.Api/Domain/AlertStateMachine.cs`: All state transitions (single source of truth)
- `apps/api/AlertaYA.Api/Domain/AlertValues.cs`: Enums (AlertEstados, AlertCanalActivacion, etc.)
- `apps/api/AlertaYA.Api/Data/AppDbContext.cs`: Entity mapping, schema definition
- `apps/api/AlertaYA.Api/Controllers/AlertsController.cs`: Main REST endpoints, idempotence, SMS fallback

**Services & Async:**

- `apps/api/AlertaYA.Api/Services/AlertEventQueue.cs`: In-memory pub-sub
- `apps/api/AlertaYA.Api/Services/Background/NotificationWorker.cs`: Consume alerts, notify contacts
- `apps/api/AlertaYA.Api/Services/Background/VerificationWorker.cs`: Consume alerts, AI scoring (stub)

**Testing:**

- No test projects present (docs/legacy/api-dominio/tests/ is reference only)

## Naming Conventions

**Files:**

- **Controllers:** `{Domain}Controller.cs` (e.g., AlertsController.cs, ProfilesController.cs)
- **Entities:** PascalCase, singular (e.g., Alert.cs, EmergencyContact.cs)
- **DTOs:** PascalCase, suffix {Request/Response/Dto} (e.g., CreateAlertRequest, AlertResponse, ProfileDto)
- **Services:** I{Name}Service (interface), {Name}Service (implementation)
- **Workers:** {Domain}Worker.cs
- **Extensions:** {Type}Extensions.cs (e.g., ClaimsPrincipalExtensions.cs)
- **Domain logic:** PascalCase, static class (e.g., AlertStateMachine.cs, AlertValues.cs)
- **Migrations:** Timestamp + description (e.g., 20260924000000_AddClientGeneratedIdToAlerts.cs)

**Directories:**

- **PascalCase** for single feature (Controllers, Services, Models, Data, Domain, Extensions, Options, Migrations, Properties)
- **lowercase** for directories with many similar files (dto vs DTOs; no strong convention yet, current code uses DTOs/Entities subdirectories)

**C# Code:**

- Classes, interfaces, properties: PascalCase
- Private fields: `_camelCase` prefix with underscore
- Constants in static classes: PascalCase (e.g., `AlertEstados.Pendiente`)
- Method parameters: camelCase

**TypeScript/React:**

- Functions, components: PascalCase
- Variables, parameters: camelCase
- Constants: UPPER_SNAKE_CASE (Expo convention)

## Where to Add New Code

**New REST Endpoint:**

1. Create controller method in `apps/api/AlertaYA.Api/Controllers/{Domain}Controller.cs` (or new controller if domain not covered)
2. Add request DTO in `apps/api/AlertaYA.Api/Models/DTOs/{Domain}Dtos.cs`
3. Add response DTO in same file
4. Call domain logic (AlertStateMachine, validation) before persistence
5. Inject AppDbContext and any needed services (IAlertEventQueue, etc.) via constructor
6. Return appropriate HTTP status (200, 201, 400, 401, 404, 409, 500)

**New Domain Rule:**

1. Add validation method to `apps/api/AlertaYA.Api/Domain/{RuleName}.cs` (new file if rule is complex)
2. Examples: AlertStateMachine.PuedeTransicionar(), AlertValues.EsValido()
3. Call from controller before any data mutation

**New Service:**

1. Add interface in `apps/api/AlertaYA.Api/Services/Abstractions/I{Service}Service.cs`
2. Add implementation in `apps/api/AlertaYA.Api/Services/{Service}Service.cs`
3. Register in Program.cs with appropriate lifetime (Singleton for stateless, Scoped for DbContext-using)
4. Inject into controller or worker via constructor

**New Background Worker:**

1. Create class in `apps/api/AlertaYA.Api/Services/Background/{Domain}Worker.cs`
2. Inherit from `BackgroundService`
3. Implement `ExecuteAsync(CancellationToken stoppingToken)` with polling loop
4. Register in Program.cs: `builder.Services.AddHostedService<{Domain}Worker>()`
5. Enqueue events via IAlertEventQueue if processing user-triggered actions; consume for long-running work

**New Database Entity:**

1. Add class in `apps/api/AlertaYA.Api/Models/Entities/{Entity}Cs`
2. Add DbSet in AppDbContext.cs
3. Add migration: `dotnet ef migrations add Add{EntityName}` (in API project directory)
4. Map in AppDbContext.OnModelCreating() to Supabase table name and column names (snake_case)
5. Create EF Foreign keys, indexes in OnModelCreating

**New Mobile Feature:**

1. Create screen file in `apps/mobile/src/app/{screenName}.tsx` (once Expo Router is set up)
2. Add route entry in `apps/mobile/src/app/_layout.tsx` if using Expo Router
3. Import API client library (stub; TBD which HTTP client library)
4. Call `POST /api/alerts` or other endpoints

## Special Directories

**`.planning/`:**

- Purpose: GSD planning output (this codebase map, phase plans, implementation notes)
- Generated: Yes (by GSD tools)
- Committed: Yes (in git, not in .gitignore)

**`docs/legacy/`:**

- Purpose: Reference; not built
- Generated: No (imported from old repo)
- Committed: Yes (in git)
- Note: Safe to delete after migration complete; kept for now as design reference

**`apps/mobile/assets/`:**

- Purpose: Icons, images for Expo
- Generated: No (created by design/product)
- Committed: Yes (small images, safe in git)

**`apps/api/AlertaYA.Api/bin/`, `obj/`:**

- Purpose: .NET build artifacts
- Generated: Yes (by dotnet build)
- Committed: No (in .gitignore)

**`apps/mobile/node_modules/`:**

- Purpose: npm dependencies
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)

## Configuration Files & Patterns

**Expo/React Native:**

- `app.json`: Defines app name, slug, SDK version, icon paths, iOS/Android platform settings, web config
- `tsconfig.json`: Extends `expo/tsconfig.base`, enables strict mode
- `package.json`: Dependencies (expo@57, react@19.2.3, react-native@0.86.3, typescript@6.0.3)

**.NET ASP.NET Core:**

- `AlertaYA.Api.csproj`: SDK="Microsoft.NET.Sdk.Web", TargetFramework=net8.0, Package references
- `appsettings.json` (not in repo; use appsettings.Example.json as template):
  - `ConnectionStrings:Default` → Postgres connection string (from Supabase)
  - `Jwt:Issuer` → Supabase JWT issuer URL
  - `Jwt:Audience` → "authenticated"
  - `Jwt:Authority` → Supabase Auth endpoint (new projects; downloads JWKS)
  - `Jwt:SigningKey` → Legacy HS256 secret (old Supabase projects only)
  - `SmsFallback:SharedSecret` → HMAC key for SMS validation
  - `SmsFallback:RequestWindowSeconds` → Time window for timestamp validation (e.g., 300)

**EF Core Migrations:**

- Stored in `Migrations/` folder
- Applied via `dotnet ef database update` or automatically on app startup (if configured in Program.cs)
- Current single migration adds `client_generated_id` column to `alerts` table for idempotence

---

*Structure analysis: 2026-09-28*
