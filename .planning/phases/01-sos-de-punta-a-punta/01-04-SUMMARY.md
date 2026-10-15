---
phase: 01-sos-de-punta-a-punta
plan: 04
subsystem: api
tags: [dotnet, clean-architecture, ef-core, xunit, webapplicationfactory, state-machine]

requires:
  - phase: 01-sos-de-punta-a-punta
    provides: "01-02: aprobacion de paquetes NuGet de pruebas (xunit 2.9.3, xunit.runner.visualstudio 3.1.4, Microsoft.NET.Test.Sdk 18.10.1, coverlet.collector 6.0.4, Microsoft.AspNetCore.Mvc.Testing 8.0.31)"
provides:
  - "apps/api en cuatro proyectos: AlertaYA.Domain, AlertaYA.Application, AlertaYA.Infrastructure, AlertaYA.Api (Api -> Infrastructure -> Application -> Domain)"
  - "Puerto IApplicationDbContext (DbSets + SaveChangesAsync + EsViolacionDeUnicidad) implementado por AppDbContext"
  - "GET /health anonimo (AddHealthChecks + MapHealthChecks) y public partial class Program"
  - "ApiFactory (WebApplicationFactory<Program>) + HealthTests Category=Smoke"
  - "AlertEstados.Finalizada terminal, alcanzable desde pendiente/activa/verificando/escalada, matriz 7x7 probada"
affects: [01-01, 01-05, 01-06, 01-07, 01-08, 01-09]

actuals:
  tokens: 11369
  tasks: 2
  commits: 3
plan_head_before: e841df2c732e064006c9c872d6f63e0e0088b970

tech-stack:
  added: [xunit 2.9.3, xunit.runner.visualstudio 3.1.4, Microsoft.NET.Test.Sdk 18.10.1, coverlet.collector 6.0.4, Microsoft.AspNetCore.Mvc.Testing 8.0.31, NetTopologySuite 2.5.0 (directo en Domain)]
  patterns:
    - "Clean Architecture en apps/api junto al proyecto existente (sin carpeta src/)"
    - "Configuracion de pruebas via builder.UseSetting en WebApplicationFactory (llega antes de leer Jwt en Program.cs)"
    - "Matriz de transiciones con Theory + MemberData sobre literales (no sobre AlertEstados.Todos)"

key-files:
  created:
    - apps/api/AlertaYA.Domain/AlertaYA.Domain.csproj
    - apps/api/AlertaYA.Application/AlertaYA.Application.csproj
    - apps/api/AlertaYA.Application/Abstractions/IApplicationDbContext.cs
    - apps/api/AlertaYA.Infrastructure/AlertaYA.Infrastructure.csproj
    - apps/api/tests/AlertaYA.Domain.Tests/AlertaYA.Domain.Tests.csproj
    - apps/api/tests/AlertaYA.Domain.Tests/AlertStateMachineTests.cs
    - apps/api/tests/AlertaYA.Api.IntegrationTests/AlertaYA.Api.IntegrationTests.csproj
    - apps/api/tests/AlertaYA.Api.IntegrationTests/ApiFactory.cs
    - apps/api/tests/AlertaYA.Api.IntegrationTests/HealthTests.cs
  modified:
    - apps/api/AlertaYA.sln
    - apps/api/AlertaYA.Api/AlertaYA.Api.csproj
    - apps/api/AlertaYA.Api/Program.cs
    - apps/api/AlertaYA.Domain/AlertValues.cs (movido desde AlertaYA.Api/Domain)
    - apps/api/AlertaYA.Domain/AlertStateMachine.cs (movido desde AlertaYA.Api/Domain)
    - apps/api/AlertaYA.Domain/GeoPointExtensions.cs (movido desde AlertaYA.Api/Extensions)
    - apps/api/AlertaYA.Domain/Entities/*.cs (movidos desde AlertaYA.Api/Models/Entities)
    - apps/api/AlertaYA.Infrastructure/Persistence/AppDbContext.cs (movido desde AlertaYA.Api/Data)
    - apps/api/README.md
    - "apps/api/AlertaYA.Api/{Controllers,Models/DTOs,Services}/*.cs (solo using)"

key-decisions:
  - "GET /health se agrega en 01-04 (era la Tarea 1 de 01-01, aun sin ejecutar) porque la prueba de humo lo necesita; mismo contrato: anonimo, cuerpo Healthy, sin BD"
  - "NetTopologySuite 2.5.0 en Domain: es la version que arrastra Npgsql NTS 8.0.11, sin paquete nuevo"
  - "Los controllers siguen usando AppDbContext y su propio chequeo de PostgresException: movimiento mecanico sin cambio de logica; el paso a IApplicationDbContext llega con los handlers (01-06+)"

patterns-established:
  - "Proyectos de prueba en apps/api/tests/ dentro de la carpeta de solucion tests"
  - "Pruebas de humo marcadas [Trait(\"Category\",\"Smoke\")]; las que necesiten BD iran con Category=Integration"

# SOS-01 y SOS-04 aparecen en el plan, pero este plan solo aporta la base (estructura + maquina de estados);
# se cumplen con la app y la pantalla de alerta activa (01-06, 01-13, 01-14, 01-16). No se marcan.
requirements-completed: []
requirements-contributed: [SOS-01, SOS-04]

coverage:
  - id: D1
    description: "Solucion de cuatro proyectos Clean Architecture que compila con dependencias Api -> Infrastructure -> Application -> Domain"
    requirement: "SOS-01"
    verification:
      - kind: other
        ref: "dotnet build apps/api/AlertaYA.sln"
        status: pass
    human_judgment: false
  - id: D2
    description: "GET /health 200 Healthy a traves de host -> DI -> endpoint con la nueva estructura"
    requirement: "SOS-01"
    verification:
      - kind: integration
        ref: "apps/api/tests/AlertaYA.Api.IntegrationTests/HealthTests.cs#Health_responde_200_Healthy"
        status: pass
    human_judgment: false
  - id: D3
    description: "Estado finalizada terminal desde pendiente/activa/verificando/escalada, matriz 7x7 completa"
    requirement: "SOS-04"
    verification:
      - kind: unit
        ref: "apps/api/tests/AlertaYA.Domain.Tests/AlertStateMachineTests.cs"
        status: pass
    human_judgment: false
  - id: D4
    description: "Carpeta Migrations de EF eliminada; el esquema lo manda supabase/migrations"
    verification:
      - kind: other
        ref: "test -d apps/api/AlertaYA.Api/Migrations (falla)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-10-15
status: complete
---

# Fase 1 Plan 04: Cimientos Clean Architecture del API y estado finalizada - Summary

**`apps/api` partido en Domain/Application/Infrastructure/Api con puerto `IApplicationDbContext`, prueba de humo `GET /health` por `WebApplicationFactory`, y `finalizada` ("Estoy a salvo", D-09) como estado terminal con la matriz 7x7 de transiciones probada.**

## Performance

- **Duracion:** ~15 min
- **Inicio:** 2026-10-15T12:50Z
- **Fin:** 2026-10-15T13:05Z
- **Tareas:** 2/2
- **Archivos tocados:** 35

## Logros

- Cuatro proyectos en `AlertaYA.sln` mas dos de pruebas (`tests/AlertaYA.Domain.Tests`, `tests/AlertaYA.Api.IntegrationTests`). Domain solo depende de NetTopologySuite; Application no conoce a Npgsql.
- Movimientos con `git mv` (historial conservado), sin cambios de logica en controllers, servicios ni workers: solo `using`.
- `AppDbContext : IApplicationDbContext` con `EsViolacionDeUnicidad` (SqlState 23505) en Infrastructure; registrado como `AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>())`.
- Migracion EF borrada y cabecera de `AppDbContext` y README actualizados: el esquema lo manda `supabase/migrations`.
- `AlertEstados.Finalizada` y transiciones hacia ella; 58 pruebas de dominio (49 pares + terminales + nulos/inexistentes + 7 estados).

## Commits por tarea

1. **Tarea 1 (tracer): cuatro proyectos + humo /health** - `f16c3d8` (refactor)
2. **Tarea 2: finalizada** - `6c57c2d` (test, RED), `d697c7f` (feat, GREEN)

## Verificacion

- `dotnet build apps/api/AlertaYA.sln`: exit 0, 0 errores, 8 advertencias (todas NU1900: timeout al descargar el feed de vulnerabilidades de nuget.org; red, no codigo).
- `dotnet test apps/api/AlertaYA.sln --filter "Category=Smoke"`: exit 0, 1/1 (HealthTests).
- `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~AlertStateMachineTests"`: exit 0, 58/58.
- `dotnet test apps/api/AlertaYA.sln --filter "Category!=Integration"`: exit 0, 59/59 (58 dominio + 1 humo).
- Gate del tracer: modo no-auto, `human_verify_mode` end-of-phase con verify automatizado; re-ejecutado en verde antes de la Tarea 2.
- Runtime: SDK 10.0.302 con runtime Microsoft.NETCore.App/AspNetCore.App 8.0.29 instalados; las pruebas net8.0 corren sin cambiar el target.

## TDD (Tarea 2)

- RED `6c57c2d`: 5 fallas esperadas (4 pares `x -> finalizada` y `Finalizada_es_un_estado_valido_y_hay_siete`), 53 pasan.
- GREEN `d697c7f`: 58/58.
- REFACTOR: no hizo falta.

## Desviaciones del plan

### Auto-corregidas

**1. [Regla 3 - Bloqueante] `GET /health` no existia**
- **Encontrado en:** Tarea 1
- **Problema:** la prueba de humo pide `GET /health -> 200 Healthy`, pero el endpoint lo crea la Tarea 1 de 01-01, que sigue pendiente por los tramites externos.
- **Arreglo:** `builder.Services.AddHealthChecks()` y `app.MapHealthChecks("/health")` antes de `MapControllers()`, con el mismo contrato que pide 01-01 (anonimo, cuerpo `Healthy`, sin BD). Cuando se ejecute 01-01, sus criterios `grep` sobre `Program.cs` ya se cumplen; solo le queda el script, ngrok y el spike de Twilio.
- **Archivos:** `apps/api/AlertaYA.Api/Program.cs`
- **Commit:** `f16c3d8`

**2. [Regla 2 - Documentacion engañosa] README de `apps/api`**
- **Encontrado en:** Tarea 1 y Tarea 2
- **Problema:** el README describia `Data/`, `Domain/`, `Migrations/` e indicaba `dotnet ef database update`; tras borrar la migracion eso llevaria a correr EF contra la BD.
- **Arreglo:** arbol de proyectos nuevo, seccion de esquema apuntando a `supabase/migrations` (sin `dotnet ef`), comando de pruebas, y tabla de estados con `finalizada`.
- **Archivos:** `apps/api/README.md`
- **Commits:** `f16c3d8`, `d697c7f`

### Notas de verificacion

- El `<fails_when>` de la Tarea 1 menciona "No test matches the given testcase filter". Al correr `--filter "Category=Smoke"` sobre la solucion entera, `AlertaYA.Domain.Tests` imprime ese mensaje (en español: "Ninguna prueba coincide...") porque no tiene pruebas de humo; es por ensamblado y el exit code es 0. La prueba de humo si corre y pasa (1/1 en `AlertaYA.Api.IntegrationTests`). Para una salida limpia: `dotnet test apps/api/tests/AlertaYA.Api.IntegrationTests --filter "Category=Smoke"`.
- Supuesto `[ASSUMED]` del plan confirmado: `builder.UseSetting` llega a `builder.Configuration` antes de leer `Jwt`; no hizo falta `JwtBearerOptions` diferido.

## Problemas encontrados

- Avisos NU1900 por timeout del feed de vulnerabilidades de nuget.org durante el restore. No bloquean; el escaneo de vulnerabilidades de esos paquetes no se completo en esta corrida.

## Requisitos

- SOS-01 y SOS-04 **no** se marcan como completos en REQUIREMENTS.md: `requirements.mark-complete` los marco y se revirtio, porque el plan mismo dice que solo aporta la estructura y la maquina de estados; el boton SOS en la app y la pantalla de alerta activa con estado por contacto llegan en planes posteriores.
- `state.advance-plan` no se ejecuto: STATE sigue en "Plan 1 of 16" porque 01-01 continua pendiente (tramites externos); avanzar el contador dejaria una posicion falsa.

## Fuera de alcance (no tocado)

- `apps/mobile`, Supabase remoto, `.planning/config.json` (cambio ajeno sin commitear) y `.planning/milestone.lock`.

## Siguiente

- 01-05 en adelante pueden escribir handlers contra `IApplicationDbContext` y reglas puras en `AlertaYA.Domain`, con pruebas en `tests/`.
- El CHECK de `alerts.estado` con `finalizada` llega con la migracion de fase de 01-03 (aplicada en 01-05); hasta entonces la BD rechazaria `finalizada`.

## Self-Check: PASSED

- Archivos clave presentes (IApplicationDbContext, AppDbContext, AlertStateMachineTests, ApiFactory, HealthTests, este SUMMARY).
- Commits presentes: f16c3d8, 6c57c2d, d697c7f.
