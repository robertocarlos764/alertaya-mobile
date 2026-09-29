---
last_mapped_commit: e508685e1915fdaca9091011aa6fc7a60807bc93
last_mapped_at: 2026-09-28
---
# Testing Patterns

**Analysis Date:** 2026-09-28

## Current State

- `apps/mobile/`: no test framework, no test files, no `test` script in `package.json`.
- `apps/api/`: no test project (solution `apps/api/AlertaYA.sln` has only `AlertaYA.Api`).
- Only existing tests: legacy reference in `docs/legacy/api-dominio/tests/AlertaYA.Domain.Tests/` (~51 tests, not built). Reuse its style for new API tests.
- Coverage: none enforced.

## Test Framework

**Runner (legacy reference / recommended for API):**

- xUnit 2.9.3, Microsoft.NET.Test.Sdk 17.14.1, xunit.runner.visualstudio 3.1.4, coverlet.collector 6.0.4
- Config: `docs/legacy/api-dominio/tests/AlertaYA.Domain.Tests/AlertaYA.Domain.Tests.csproj` (`<Using Include="Xunit" />`, Nullable + ImplicitUsings enabled, `IsPackable=false`).

**Assertion Library:** xUnit built-in `Assert`.

**Run Commands:**

```bash
dotnet test apps/api/AlertaYA.sln                       # all tests (once a test project exists)
dotnet test --collect:"XPlat Code Coverage"             # coverage via coverlet
```

Mobile: none configured. If adding, use `npx expo install jest-expo jest` and follow Expo docs.

## Test File Organization

- Separate project `tests/<Project>.Tests/`, one file per domain type: `AlertTests.cs`, `ContactTests.cs`, `GeoLocationTests.cs`, `UserProfileTests.cs`, `UserSettingsTests.cs`, `AlertNotificationTests.cs`.
- Class `<Type>Tests`, file-scoped namespace `AlertaYA.Domain.Tests`.

## Test Structure

```csharp
public class AlertTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTimeOffset Start = DateTimeOffset.UtcNow;

    private static Alert Active(GeoLocation? location = null) =>
        Alert.Activate(Guid.NewGuid(), UserId, Start, location);

    // Escenario "Cancelación de una alerta activa" de alertas-sos
    [Fact]
    public void Cancel_MarcaCancelledYRegistraElCierre()
    {
        var alert = Active();
        alert.Cancel(Start.AddMinutes(2));
        Assert.Equal(AlertStatus.Cancelled, alert.Status);
    }
}
```

**Patterns:**

- Method names: `Metodo_ComportamientoEnEspañol` (`Activate_ExigeCuentaPropietaria`).
- Arrange/Act/Assert without comments; `[Fact]` (no Theory seen).
- Private static factory helpers at class top replace fixtures/setup.
- Comments link tests to openspec scenarios (`docs/legacy/openspec/`).
- Invariants: `Assert.Throws<ArgumentException>(() => ...)`.

## Mocking

- None used; legacy tests are pure domain tests with no I/O. For the current API (EF Core + Npgsql/PostGIS), prefer testing pure logic directly (`Domain/AlertStateMachine.cs`, `Domain/AlertValues.cs`) and use a real Postgres/PostGIS instance (not InMemory, which lacks geography) for controller tests. Mock only `IAlertEventQueue` / `INotificationService` (`Services/Abstractions/`).

## Fixtures and Factories

- Static readonly ids/timestamps and small factory methods per test class. Use fixed `DateTimeOffset` values for time-dependent assertions.

## Test Types

- Unit: domain rules and state machine (best first target: `AlertStateMachine.PuedeTransicionar`).
- Integration: not present; would use `WebApplicationFactory<Program>` with a test JWT.
- E2E: not used.

## Common Patterns

**Error testing:**

```csharp
Assert.Throws<ArgumentException>(() => Alert.Activate(Guid.NewGuid(), Guid.Empty, Start, null));
```

---

*Testing analysis: 2026-09-28*
