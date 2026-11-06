---
last_mapped_commit: e508685e1915fdaca9091011aa6fc7a60807bc93
last_mapped_at: 2026-09-28
---
# External Integrations

**Analysis Date:** 2026-09-28

## APIs & External Services

**Authentication:**

- Supabase Auth - User identity and JWT token generation
  - SDK/Client: Not yet integrated in mobile (scaffold stage)
  - Integration method: Mobile will use Supabase Auth SDK (`@supabase/auth-js`); API validates tokens
  - Auth vars: `Jwt.Authority` points to `https://<project-ref>.supabase.co/auth/v1`

**Internal Services:**

- Notification Service - Async notification processing
  - Implementation: `AlertaYA.Api/Services/NotificationService.cs`
  - Queue: In-memory event queue (`AlertEventQueue`)
  - Worker: Background service (`NotificationWorker`, hosted service)

- Verification Service - User verification workflows
  - Implementation: `AlertaYA.Api/Services/VerificationService.cs`
  - Worker: Background service (`VerificationWorker`, hosted service)

## Data Storage

**Databases:**

- PostgreSQL 17.6 (Supabase managed instance)
  - Connection string: `ConnectionStrings.Default` (or env var `ConnectionStrings__Default`)
  - Client: Entity Framework Core 8.x with Npgsql provider
  - ORM: EF Core (`DbContext` at `AlertaYA.Api/Data/AppDbContext.cs`)

**Schema (Supabase public schema):**

- `profiles` - User profile data (linked to Supabase Auth via user ID)
- `emergency_contacts` - Emergency contact records
- `alerts` - Alert events; `estado` text+CHECK: pendiente | activa | verificando | escalada | atendida | descartada; `canal_activacion`: boton_pulsado | voz | boton_fisico; `nivel_prioridad_ia`: critico | medio | posible_falso_positivo; `client_generated_id` + unique(user_id, client_generated_id) for idempotency
- `alert_locations` - Geographic locations tied to alerts (PostGIS geography(point, 4326))
- `verification_logs` - Verification attempt audit trail
- `cais` - Police stations (CAI = Centro de Atención Inmediata, Policía Nacional de Colombia)
- `officers` - Police officers (FK auth.users; rol: oficial | supervisor | control_interno)
- `officer_duty_log` - Officer duty/availability log
- `officer_decisions` - Officer action/decision log

**Spatial Data:**

- PostGIS 3.3.7 - Geographic queries on alert locations
- NetTopologySuite integration: `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite`
- Data type: `geography(point, 4326)` for alert coordinates (WGS84 longitude/latitude)

**Extensions Enabled:**

- `pgcrypto` - Cryptographic functions
- `uuid-ossp` - UUID generation
- `pg_stat_statements` - Query statistics
- `vault` - Secret management (Supabase Vault)

**Triggers:**

- `on_auth_user_created` → `handle_new_user` - Creates profile row on Supabase Auth user signup, but with nombre='' and telefono='' (ignores raw_user_meta_data)

**Indexes:** only PKs + unique (user_id, client_generated_id) on alerts. No spatial (GiST) indexes, 8 FKs unindexed.

**Migrations:** none tracked (schema created by hand). The API has one EF migration (`apps/api/AlertaYA.Api/Migrations/20260924000000_AddClientGeneratedIdToAlerts.cs`) but the DB has no `__EFMigrationsHistory` table: the column was applied manually, so `dotnet ef database update` would try to re-apply it.

**File Storage:**

- Not detected (no storage buckets configured on Supabase project)

**Caching:**

- Not detected (no Redis or cache service integrated)

## Authentication & Identity

**Auth Provider:**

- Supabase Auth (managed, OpenID Connect)
  - Token format: JWT (RS256 for new projects with asymmetric signing, HS256 for legacy)
  - Token issuer: `https://<project-ref>.supabase.co/auth/v1`
  - Token audience: `authenticated`
  - Claims: Standard OIDC claims from Supabase JWT

**Implementation in API:**

- Location: `AlertaYA.Api/Program.cs` lines 32-67
- Validation method: JwtBearer middleware
- Key discovery: OIDC metadata endpoint (`/.well-known/openid-configuration`) and JWKS endpoint
  - Symmetric fallback: Supports legacy `Jwt.SigningKey` (HS256) if configured
- Token lifetime validation: Enabled with 30-second clock skew
- Scope: `[Authorize]` attribute on controllers; claim extraction via `ClaimsPrincipal` extensions at `AlertaYA.Api/Extensions/ClaimsPrincipalExtensions.cs`

**SMS Fallback Authentication:**

- Service: `AlertaYA.Api/Services/SmsFallbackAuthService.cs`
- Purpose: Alternative authentication via SMS codes
- Configuration:
  - `SmsFallback.Secret` - Shared secret for HMAC hashing of codes
  - `SmsFallback.MaxAgeSeconds` - Code expiration window (default 300s)
- Storage: Verification logs tracked in `verification_logs` table
- Worker: `VerificationWorker` (background service) processes verification events

## Monitoring & Observability

**Error Tracking:**

- Not detected (no Sentry, DataDog, or similar)

**Logs:**

- Approach: ASP.NET Core default logging
- Configuration: `appsettings*.json` Logging section
- Default level: Information
- Microsoft.AspNetCore suppressed to Warning level
- Destination: Console/debug output (standard ASP.NET hosting)

**Query Performance:**

- PostgreSQL `pg_stat_statements` extension enabled for slow query tracking

## CI/CD & Deployment

**Hosting - Mobile:**

- EAS (Expo Application Services) for builds and distribution
  - Commands: `npx eas-cli@latest build`, `npx eas-cli@latest submit`
  - Over-the-air updates: `npx eas-cli@latest update`
  - Configuration: `eas.json` (not found; may be minimal or use defaults)

**Hosting - API:**

- Deployment target: Not specified in repo (likely Docker container or cloud platform)
- No CI/CD pipeline detected in codebase

**CI Pipeline:**

- Not detected (no GitHub Actions, GitLab CI, or similar workflows in repo)

## Environment Configuration

**Required env vars - Mobile:**

- None in codebase yet (app is in scaffold phase)

**Required env vars - API:**

- `ConnectionStrings__Default` - PostgreSQL connection string (format: `Host=..;Port=...;Database=...;Username=...;Password=...;SSL Mode=Require`)
- `Jwt__Authority` - Supabase Auth OIDC endpoint (e.g., `https://abc123.supabase.co/auth/v1`)
- `Jwt__Issuer` - Token issuer (same as Authority)
- `Jwt__Audience` - Token audience (default: `authenticated`)
- `Jwt__SigningKey` - (Legacy only) JWT signing key if using HS256
- `SmsFallback__Secret` - Shared secret for SMS code verification
- `SmsFallback__MaxAgeSeconds` - SMS code expiration (default: 300)

**Secrets location:**

- `.env` / `.env.local` files (excluded from git)
- Environment variables at deployment time
- Supabase Vault extension can store sensitive data server-side

## Webhooks & Callbacks

**Incoming:**

- Not detected (no webhook receivers)

**Outgoing:**

- Not detected (no webhook publishers to external services)

**Internal Events:**

- Alert event queue (`AlertEventQueue`): In-memory pub/sub for verification and notification events
- Background workers consume queue events asynchronously

## API Connectivity

**Mobile-to-API:**

- Base URL: Not yet configured in mobile app (scaffold phase)
- Authentication: Bearer token (will be obtained from Supabase Auth)
- Format: REST (API is ASP.NET Core Web API with Swagger docs)

**API Endpoints (Controllers):**

- `AlertsController` (`AlertaYA.Api/Controllers/AlertsController.cs`) - Alert CRUD and state transitions
- `EmergencyContactsController` (`AlertaYA.Api/Controllers/EmergencyContactsController.cs`) - Emergency contact management
- `ProfilesController` (`AlertaYA.Api/Controllers/ProfilesController.cs`) - User profile management
- Swagger docs: Available at `/swagger/index.html` in development

## Database Migrations

**Strategy:** Entity Framework Core migrations

- Migration files: `AlertaYA.Api/Migrations/` (e.g., `20260924000000_AddClientGeneratedIdToAlerts.cs`)
- Model definitions: `AlertaYA.Api/Models/Entities/` (Alert, AlertLocation, EmergencyContact, Profile, VerificationLog)
- Context: `AlertaYA.Api/Data/AppDbContext.cs`
- Command: `dotnet ef database update` (EF Core tooling)
- Status: Migrations tracked in code; Supabase manages actual PostgreSQL instance

---

*Integration audit: 2026-09-28*
