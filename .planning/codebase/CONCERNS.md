---
last_mapped_commit: e508685e1915fdaca9091011aa6fc7a60807bc93
last_mapped_at: 2026-09-28
---
# Codebase Concerns

**Analysis Date:** 2026-09-28

## Tech Debt

**Notification delivery stub:**

- Issue: `NotificationService` only logs notifications to console; does not send actual push, SMS, or other alerts to emergency contacts
- Files: `apps/api/AlertaYA.Api/Services/NotificationService.cs` (lines 15-36)
- Impact: SOS alerts activate workflow but never reach recipients; users believe contacts are notified when they aren't
- Fix approach: Implement actual notification provider (Firebase Cloud Messaging, Twilio, OneSignal, etc.); inject provider interface; update `NotifySosAsync` to dispatch to provider instead of logging

**No unit/integration tests:**

- Issue: API has no test projects or test files; critical paths like idempotent alert creation, state machine transitions, and SMS fallback auth are untested
- Files: None (test directory absent from `apps/api/`)
- Impact: Regressions go undetected; refactoring alert logic or state machine is high-risk; edge cases in location tracking untested
- Fix approach: Create `AlertaYA.Api.Tests` project; add NUnit or xUnit; cover alert lifecycle (creation → state transitions → location updates), SMS fallback validation, verification service heuristics, emergency contact queries

**No CI/CD pipeline:**

- Issue: No GitHub Actions, GitLab CI, or other automated pipeline to lint, test, or build on commits/PRs
- Files: No `.github/workflows/` or equivalent
- Impact: Code quality regressions merge to `main` unchecked; deployment process is manual (high toil, high error risk)
- Fix approach: Add `.github/workflows/build.yml` with: dotnet lint (`dotnet format --verify-no-changes`), test (`dotnet test`), build (`dotnet build -c Release`)

**Error responses inconsistent:**

- Issue: Controllers return ad-hoc error objects `new { error = "...", field = value }` instead of standardized `ProblemDetails`
- Files: `apps/api/AlertaYA.Api/Controllers/AlertsController.cs` (lines 60-62, 67, 72, 148, 153, 158-163, 196, 201-205, 211, 258, 300, 309, 350), `ProfilesController.cs` (38, 60-63, 69)
- Impact: Clients must parse multiple error shapes; error codes/titles not normalized; API is not RFC 9457 compliant; harder to build robust error handling on mobile client
- Fix approach: Implement global exception handler middleware that maps exceptions to `ProblemDetails`; use consistent HTTP status codes; update controllers to throw exceptions instead of returning error objects; add `Content-Type: application/problem+json` responses

**Settings endpoints missing (admin-only):**

- Issue: Fields `ventana_confirmacion_segundos` and `modo_silencioso` in profiles cannot be edited via API; admin configuration requires direct database access
- Files: `apps/api/AlertaYA.Api/Controllers/ProfilesController.cs` (lines 46-47, 58-64) intentionally blocks these fields
- Impact: Admins can't configure per-user alert confirmation windows or silent mode via API; requires SQL access to production; no audit trail for setting changes
- Fix approach: Create admin role (via Supabase auth claims); add `PATCH /api/profiles/{id}/settings` endpoint (admin-only) to update `ventana_confirmacion_segundos`, `modo_silencioso`, and `palabra_clave`; add audit logging

**Palabra clave (voice SOS keyword, not a login password) stored plaintext:**

- Issue: `Profile.PalabraClave` (user's keyword for verbal SOS) is stored unencrypted in the database
- Files: `apps/api/AlertaYA.Api/Models/Entities/Profile.cs` (line 9), `Controllers/ProfilesController.cs` (line 82 comment: "no se hashea por diseño")
- Impact: If database is compromised, user passphrases leak; anyone with DB read access can see the verbal SOS keywords
- Fix approach: hashing is NOT viable — on-device keyword spotting needs the cleartext word. Options: keep it only on the device (expo-secure-store) and never send it to the server, or encrypt at rest (Supabase Vault / pgsodium column encryption) and never return it in list endpoints. Decide in the voice-activation phase.

**Database schema not version-controlled:**

- Issue: Core tables (`profiles`, `emergency_contacts`, `alerts`, `alert_locations`, `verification_logs`, and police tables) created manually in Supabase UI, not via migrations; schema is irreproducible
- Files: `apps/api/AlertaYA.Api/Data/AppDbContext.cs` (line 7 comment: "Mapea las tablas EXISTENTES"), only one migration for `client_generated_id` column
- Impact: Cannot spin up clean environments (dev, staging); no changelog of schema evolution; schema drift between environments undetected; new devs must manually replicate table structure
- Fix approach: Export current Supabase schema to SQL file; commit to `apps/api/Migrations/01_InitialSchema.sql`; add new changes as numbered migrations (02_, 03_, etc.); use EF Core migrations or Supabase migration workflow

**Application logger too verbose in errors:**

- Issue: DbUpdateException details are returned to clients in error responses (line 350 of AlertsController: `detalle = ex.Message`)
- Files: `apps/api/AlertaYA.Api/Controllers/AlertsController.cs` (line 350)
- Impact: Exception stack traces leak internal schema/logic to clients; aids attackers in reconnaissance
- Fix approach: Log full exception server-side; return sanitized user-facing message ("Unable to process request"); only log detail to application logs

## Known Bugs

**Mobile app scaffold empty:**

- Symptoms: `apps/mobile/` contains only Expo boilerplate (App.tsx, app.json, package.json); no screens, no components, no navigation
- Files: `apps/mobile/*`
- Trigger: Project initialized but screen/logic not yet written
- Workaround: Use legacy Flutter app in `docs/legacy/flutter/` as reference for UI layout, state flow, and patterns

**Settings persistence never tested in legacy:**

- Symptoms: From legacy Flutter app, settings updates (confirmation window, silent mode) are sent to backend but never verified to persist to database
- Files: Legacy code in `docs/legacy/flutter/`; new app has no implementation yet
- Trigger: Feature incomplete in legacy; test coverage gap
- Workaround: Add integration test in new API: create profile, PATCH settings, GET profile, assert changes persisted

**Location silently falls back in legacy:**

- Symptoms: Legacy Flutter app requests location permission; if denied, silently uses hardcoded Bogotá coordinates (4.7110, -74.0721) without informing user
- Files: Legacy code in `docs/legacy/flutter/`
- Trigger: Location permission denied or service unavailable
- Workaround: New app must explicitly prompt user for permission and show alert if location unavailable before creating alert; do not silently fall back to fixed coordinates

## Security Considerations

**SMS fallback auth with global shared secret:**

- Risk: SmsFallback endpoint `/api/alerts/sms-fallback` validates requests with a single HMAC-SHA256 secret shared with SMS parser (Twilio webhook or other); if secret compromised, attacker can forge alerts from any user
- Files: `apps/api/AlertaYA.Api/Services/SmsFallbackAuthService.cs` (lines 41-54), `Options/SmsFallbackOptions.cs`
- Current mitigation: Secret is read from environment config (not hardcoded); fixed-time comparison prevents timing attacks; replay protection via timestamp + MaxAgeSeconds
- Recommendations: 
  - Rotate secret regularly (add key versioning if HMAC scheme allows)
  - Add per-user SMS tokens (store in database) instead of global secret
  - Log all SMS-fallback invocations; alert on repeated hash failures
  - Document SMS parsing layer requirements (Twilio callback must also validate incoming webhook signature)

**RLS policies incomplete or missing on sensitive tables:**

- Risk: Database tables `cais`, `officers`, `officer_duty_log`, `officer_decisions`, `verification_logs` have Row-Level Security defined but zero row policies; effectively only service_role can read/write; if JWT hijacked, user can still only access public tables
- Files: Supabase schema (not in codebase, verified via MCP)
- Current mitigation: Tables with zero policies are isolated to service_role (backend-only); profiles/emergency_contacts/alerts have RLS policies
- Recommendations:
  - Add UPDATE policy to `alerts` table (currently missing); users should not directly modify alert state
  - Add SELECT policy to `verification_logs` for user's own logs
  - Add READ policy to police tables (officers can see their own duty assignments)
  - Test RLS: attempt to read/write table as user JWT; confirm rejection if policy absent

**Leaked password protection disabled:**

- Risk: Supabase advisory flag indicates "leaked password protection" is disabled on auth.users table; if real user passwords from other breaches match, Supabase won't flag/block
- Files: Supabase project setting (not in codebase)
- Current mitigation: None
- Recommendations: Re-enable leaked password protection in Supabase project settings → Auth → Security

**No push token storage:**

- Risk: No table to store user's device push notification tokens (iOS APNS, Android FCM); when notification provider is implemented, system has no way to route notifications to devices
- Files: Supabase schema (no `push_tokens` table)
- Current mitigation: None (feature gap)
- Recommendations: Create `push_tokens` table (`id UUID PK, user_id UUID FK → profiles, device_token TEXT, platform ENUM (ios|android), created_at TIMESTAMPTZ, last_seen TIMESTAMPTZ`); add endpoint `POST /api/push-tokens` for mobile app to register; delete token on unregister or if delivery fails repeatedly

**Audit trail missing for critical operations:**

- Risk: No audit log table; cannot trace who changed settings, when alerts were created via SMS fallback, or who escalated/attenuated alerts
- Files: None (table missing)
- Current mitigation: None
- Recommendations: Create `audit_logs` table (`id UUID PK, user_id UUID, action TEXT, resource TEXT, old_value JSONB, new_value JSONB, ip_address INET, created_at TIMESTAMPTZ`); log on profile updates, SMS fallback activations, alert state changes

## Performance Bottlenecks

**Alert location history unbounded:**

- Problem: `alert_locations` table accumulates a row for every location update during an active alert; if user's phone sends GPS every 5 seconds for 30 minutes, that's 360 rows; no limit or archival
- Files: `apps/api/AlertaYA.Api/Models/Entities/AlertLocation.cs`, `AlertsController.cs` line 217-225 (inserts without limit)
- Cause: No partitioning, no retention policy, no batch deletion
- Improvement path: Add `PARTITION BY RANGE (created_at)` on `alert_locations` table (monthly partitions); set PostgreSQL cron job to drop partitions >6 months old; or add application-level archival (move old locations to cold storage, keep recent 500 rows in hot table)

**Missing indexes on foreign keys:**

- Problem: 8 foreign key columns lack indexes (per Supabase advisor); `alerts.user_id`, `alert_locations.alert_id`, `verification_logs.alert_id`, etc.; queries filtering by these columns trigger full table scans
- Files: `apps/api/AlertaYA.Api/Data/AppDbContext.cs` (FK definitions); Supabase schema
- Cause: EF Core defines HasIndex for some (e.g., line 84, 108, 132) but not all FKs; manual schema creation omitted indexes
- Improvement path: Add indexes in next migration: `CREATE INDEX idx_alerts_user_id ON alerts(user_id)`, `idx_alert_locations_alert_id`, `idx_emergency_contacts_user_id`, etc.; verify with `EXPLAIN ANALYZE` before/after

**RLS policies using auth.uid() without column predicates:**

- Problem: 14 RLS policies use `auth.uid() = user_id` directly instead of `SELECT ... WHERE auth.uid() = user_id`; row filtering occurs at engine level but lacks optimizer hints
- Files: Supabase policies (not in codebase)
- Cause: Policies written without `(select)` predicate syntax
- Improvement path: Refactor policies to use `USING (auth.uid() = user_id) WITH (check_option = 'local')`; test query performance before/after; add appropriate indexes

## Fragile Areas

**Alert state machine transitions (domain logic):**

- Files: `apps/api/AlertaYA.Api/Domain/AlertStateMachine.cs`
- Why fragile: Single static dictionary defines all valid transitions (lines 18-27); adding a new state or transition requires code change + redeploy; no database-driven state registry; if state enum values diverge from dictionary keys, transitions silently fail
- Safe modification: 
  - Add unit test for every transition (use `[TestCase]` matrix)
  - Before adding state, add test case first, watch it fail, then add state to dictionary
  - Consider extracting state machine to database table (states/transitions registered in DB) for runtime flexibility
- Test coverage: State machine has no tests; transitions are validated implicitly in AlertsController tests (which don't exist)

**Verification heuristic rules (VerificationService):**

- Files: `apps/api/AlertaYA.Api/Services/VerificationService.cs`
- Why fragile: 5 hardcoded rules (R1-R5) determine priority level; thresholds are magic numbers (UmbralContradiccionMetros = 500m, VentanaRecienteMinutos = 5); rules assume GPS precision and timing patterns; if location sensor behavior changes or new activation channels added, heuristic breaks silently
- Safe modification: 
  - Document each rule's threshold with rationale (already done in comments)
  - Add configuration table `verification_rules` (rule_name, threshold_value, enabled) instead of constants
  - Add test cases for edge cases (exactly 500m distance, exactly 5-minute-old GPS, contradictory location sources)
  - When ML model replaces rules, thresholds become model parameters; plan migration path
- Test coverage: No tests

**Idempotency via client-generated ID:**

- Files: `apps/api/AlertaYA.Api/Controllers/AlertsController.cs` lines 39-84 (Create endpoint), line 313-324 (SmsFallback endpoint)
- Why fragile: Idempotence depends entirely on unique index `IX_alerts_user_id_client_generated_id` (line 87-89); if client fails to generate GUID or sends null, alerts are created without idempotence; race condition between SELECT and INSERT handled by catching `PostgresException` (line 107-118) but error message is generic
- Safe modification:
  - Add test: client calls Create twice with same clientGeneratedId, assert second returns 201 with first alert's data
  - Add test: concurrent requests with same clientGeneratedId from two clients, assert only one succeeds and both see same alert
  - Add validation in CreateAlertRequest DTO: `clientGeneratedId` must be non-zero GUID
  - Document expectation: client MUST generate clientGeneratedId; if omitted, alerta is non-idempotent
- Test coverage: No tests

**EmergencyContacts FK constraint:**

- Files: `apps/api/AlertaYA.Api/Data/AppDbContext.cs` lines 44-61
- Why fragile: FK `emergency_contacts.user_id → profiles.id` is soft-deleted from perspective of profiles; if user deletes account in Supabase Auth, `profiles` row is deleted, but `emergency_contacts` and `alerts` rows linger orphaned (no CASCADE DELETE configured)
- Safe modification:
  - Decide on account deletion policy: hard delete (CASCADE), soft delete (add deleted_at column), or migrate to archive
  - If hard delete: test deletes user, verify cascades to emergency_contacts and alerts
  - If soft delete: update RLS policies to exclude deleted users; add periodic cleanup job
  - Update EF Core FK definition to include `.OnDelete(DeleteBehavior.Cascade)` if hard delete chosen
- Test coverage: No tests; no documented account deletion flow

## Scaling Limits

**In-memory alert event queue:**

- Current capacity: Single-instance `AlertEventQueue` (ConcurrentQueue in memory); holds pending alert notifications and verification jobs
- Limit: If API crashes or restarts, queue is lost; at scale (1000 alerts/hour), queue backlog can grow faster than NotificationWorker processes
- Scaling path: Replace `IAlertEventQueue` with durable queue (RabbitMQ, Azure Service Bus, or AWS SQS); use poison-letter handling for failed jobs; add metrics (queue depth, consumer lag); configure autoscaling workers

**Single JWT secret for SMS fallback:**

- Current capacity: One secret shared across all SMS sources; secret rotation requires updating all SMS senders (Twilio config, etc.)
- Limit: If secret leaks, attacker can forge all SMS-based alerts until rotation completes
- Scaling path: Move to per-SMS-source authentication (API keys, HMAC secrets versioned in database); or use Supabase Functions to parse/validate SMS ingress before backend sees it

**Notification service will bottleneck on third-party provider:**

- Current capacity: Not deployed (stub); once real provider integrated, throughput depends on provider's rate limits (Firebase Cloud Messaging, Twilio, etc.)
- Limit: SOS alerts must deliver in <5 seconds; if provider rate-limit is 100 msgs/second, system handles 360,000 alerts/hour maximum
- Scaling path: Add queue with priority (escalated alerts jump queue); batch notifications by provider; implement exponential backoff + retry for transient failures; monitor provider latency in dashboards

## Dependencies at Risk

**Supabase Auth JWT legacy support:**

- Risk: Code supports both RS256/ES256 (asymmetric, new) and HS256 (symmetric, legacy) signing; legacy projects use `Jwt:SigningKey`; if migrating projects, both auth mechanisms temporarily conflict
- Impact: Confusing error messages if JWT validation fails; hard to debug which path is validating
- Migration plan: Deprecate HS256 support after all projects upgraded to RS256; add warning log when legacy key is present; set sunset date in docs (e.g., "HS256 support removed in v2.0")

**NetTopologySuite for geography:**

- Risk: PostGIS (NetTopologySuite) adds C# binding complexity; if library stops supporting .NET version, geospatial queries break
- Impact: Cannot easily query alerts by radius or calculate distances without NTS
- Migration plan: Monitor NTS releases; if support drops, switch to PostGIS functions called via raw SQL (`ST_Distance`, `ST_DWithin`)

## Missing Critical Features

**Notification delivery provider not selected:**

- Problem: NotificationService is a stub; no decision on whether to use Firebase Cloud Messaging (Android), APNs (iOS), Twilio SMS, or hybrid; without this, emergency contacts are never actually notified
- Blocks: Live testing of SOS alerts; release to production
- Priority: **CRITICAL**

**Push token registration missing:**

- Problem: Mobile app has no mechanism to send device token to API; API has no table to store tokens; notification provider has no way to route to devices
- Blocks: Implement notification delivery
- Priority: **CRITICAL** (depends on notification provider decision)

**Admin settings API missing:**

- Problem: `ventana_confirmacion_segundos` and `modo_silencioso` are hardcoded in schema but cannot be edited by admins via API; requires database access
- Blocks: Admins cannot configure system behavior post-deployment
- Priority: **HIGH**

**No OpenAPI/Swagger spec committed:**

- Problem: API has Swagger generation in Program.cs (line 18), but no versioned openapi.json or contract published
- Blocks: Mobile team cannot generate typed client; API changes break clients silently
- Priority: **HIGH**

**No audit logging for sensitive operations:**

- Problem: Cannot trace who changed settings, when SMS fallbacks were used, or why alerts were escalated; forensic investigations are impossible
- Blocks: Compliance/security investigation
- Priority: **MEDIUM**

## Test Coverage Gaps

**Alert lifecycle untested:**

- What's not tested: Creating alert → location updates → state transitions → verification → notification → resolution
- Files: `apps/api/AlertaYA.Api/Controllers/AlertsController.cs`, `Services/VerificationService.cs`, background workers
- Risk: Regressions in idempotence, state machine, or location tracking go undetected
- Priority: **CRITICAL** — add integration tests covering full alert flow

**SMS fallback untested:**

- What's not tested: HMAC validation, timestamp anti-replay, creating alert from SMS without JWT, concurrent SMS requests
- Files: `apps/api/AlertaYA.Api/Controllers/AlertsController.cs` lines 293-356, `Services/SmsFallbackAuthService.cs`
- Risk: Auth bypass, replay attacks, idempotence violations in SMS channel undetected
- Priority: **CRITICAL** — add unit tests for SmsFallbackAuthService, integration tests for SmsFallback endpoint

**Verification heuristic untested:**

- What's not tested: All 5 rules (R1-R5) with edge cases (exactly 500m distance, future timestamps, conflicting location sources)
- Files: `apps/api/AlertaYA.Api/Services/VerificationService.cs`
- Risk: If heuristic behavior changes (e.g., location precision sensor improves), priority levels silently change
- Priority: **HIGH** — add parameterized unit tests covering each rule and threshold boundary

**State machine untested:**

- What's not tested: All valid/invalid transitions, error messages when transition blocked
- Files: `apps/api/AlertaYA.Api/Domain/AlertStateMachine.cs`
- Risk: New state added but transition rules incomplete; invalid transitions silently allowed or blocked incorrectly
- Priority: **HIGH** — add matrix test covering all 6 states × all possible transitions

**Emergency contact operations untested:**

- What's not tested: Create, update, delete emergency contacts; list by user; FK constraint on user_id
- Files: `apps/api/AlertaYA.Api/Controllers/EmergencyContactsController.cs`
- Risk: Orphaned contacts after user deletion; concurrent updates corrupt data
- Priority: **MEDIUM** — add integration tests for CRUD + user deletion cascade

**Mobile app navigation/state untested:**

- What's not tested: Screen transitions, deep linking, permission requests, alert creation flow
- Files: `apps/mobile/`
- Risk: Navigation breaks silently on iOS vs Android; feature shipping untested
- Priority: **MEDIUM** (app is scaffold; test as features added)

---

*Concerns audit: 2026-09-28*
