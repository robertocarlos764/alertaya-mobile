---
last_mapped_commit: e508685e1915fdaca9091011aa6fc7a60807bc93
last_mapped_at: 2026-09-28
---
# Coding Conventions

**Analysis Date:** 2026-09-28

## Naming Patterns

**Language mix (important):**

- Infrastructure/framework words are English (`Controller`, `Service`, `Options`, `Queue`, `Worker`, `Create`, `UpdateState`).
- Domain vocabulary, DB columns, states and property names are Spanish: `Estado`, `CanalActivacion`, `CreadoEn`, `Ubicacion`, `Nombre`, `Telefono`; state values are lowercase snake Spanish strings (`pendiente`, `activa`, `verificando`, `escalada`, `atendida`, `descartada`, `boton_pulsado`). See `apps/api/AlertaYA.Api/Domain/AlertValues.cs`.
- Comments, XML docs, and user-facing error messages are Spanish. Keep this.

**Files (API, `apps/api/AlertaYA.Api/`):**

- One PascalCase file per type: `Controllers/AlertsController.cs`, `Services/NotificationService.cs`.
- DTOs grouped per feature in plural files: `Models/DTOs/AlertDtos.cs`.
- Entities in `Models/Entities/`, one per file.

**Types/members (C#):**

- PascalCase types/methods; interfaces `I` prefix (`Services/Abstractions/`); private fields `_camelCase` (`_db`, `_queue`, `_logger`).
- Async methods suffixed `Async` in services (`NotifySosAsync`); controller actions are bare verbs (`Create`, `UpdateState`, `AddLocation`).
- Constant sets are static classes with `const string` members plus `Todos` array and `EsValido(...)` (`AlertEstados`, `AlertCanalActivacion`, `FuenteUbicacion`). Use this instead of enums.
- Routes are lowercase: `[Route("api/alerts")]`.

**Mobile (`apps/mobile/`):**

- Scaffold only: `App.tsx`, `index.ts`. Components PascalCase; styles via `StyleSheet.create` at file bottom. Routes go in `src/app/` (Expo Router, per `AGENTS.md`), non-route code outside it.

## Code Style

**Formatting:**

- No Prettier/EditorConfig/ESLint config detected in the active apps. Match existing style: C# Allman braces, 4-space indent, trailing commas in multi-line initializers; TS 2-space indent, single quotes, semicolons.

**Linting:**

- Mobile: `npx expo lint` and `npx tsc --noEmit` (required before finishing a task per `AGENTS.md`). `apps/mobile/tsconfig.json` extends `expo/tsconfig.base` with `strict: true`.
- API: `<Nullable>enable</Nullable>` in `AlertaYA.Api.csproj`, target `net8.0` (legacy domain project uses net10.0).

## Import Organization

**C#:** `using` directives at top, alphabetical (`AlertaYA.Api.*` first, then `Microsoft.*`, `Npgsql`); file-scoped `namespace AlertaYA.Api.<Folder>;`. Implicit usings enabled.

**TS:** `expo`/`react-native` packages, no path aliases configured.

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

---

*Convention analysis: 2026-09-28*
