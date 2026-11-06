---
phase: 01-sos-de-punta-a-punta
plan: 06
subsystem: api
status: complete
tags: [dotnet, outbox, idempotencia, problemdetails, openapi, rate-limit, contactos, integracion-remota]

requires:
  - phase: 01-sos-de-punta-a-punta
    provides: "01-02: sms-fallback deshabilitar y paquetes aprobados; 01-03/01-05: fase1_sos aplicada al remoto (notification_deliveries, tracking_links, finalizada_en, capturada_en); 01-04: cuatro proyectos .NET"
provides:
  - "POST /api/alerts: alerta activa + tracking_link (hash) + una entrega en_cola por contacto en una transaccion, idempotente"
  - "GET /api/alerts/{id}/status (estado real por contacto, serverNow, trackingUrl) y GET /api/alerts/active (200/204)"
  - "ProblemDetails con code estable en todo el API e IExceptionHandler global"
  - "Contactos E.164 +57, 409 duplicate_contact/contact_limit, 404 contact_not_found; 10 alertas por hora por usuario (429)"
  - "apps/api/openapi.json versionado y Swashbuckle.AspNetCore.Cli 6.6.2 en apps/api/.config/dotnet-tools.json"
  - "BdRemotaFixture: coleccion 'BD remota' contra el remoto (D-22) con prefijo it-alertaya-, guardas y limpieza"
affects: [01-07, 01-08, 01-09, 01-12, 01-13, 01-14, 01-15]

tech-stack:
  added: ["Swashbuckle.AspNetCore.Cli 6.6.2 (herramienta local, aprobada en 01-02)"]
  patterns:
    - "Handlers en Application (CreateAlertHandler, GetAlertStatusHandler); controllers solo traducen a HTTP"
    - "Problemas.* para cada error; CustomizeProblemDetails pone code a los 400/500 del framework"
    - "NpgsqlDataSource singleton con UseNetTopologySuite (necesario para escribir Point en geography)"
    - "Pruebas de integracion en serie con [Collection(\"BD remota\")] y BdRemotaFixture"

key-files:
  created:
    - apps/api/AlertaYA.Domain/DeliveryValues.cs
    - apps/api/AlertaYA.Domain/TrackingToken.cs
    - apps/api/AlertaYA.Domain/Coordenadas.cs
    - apps/api/AlertaYA.Domain/Telefono.cs
    - apps/api/AlertaYA.Domain/Entities/NotificationDelivery.cs
    - apps/api/AlertaYA.Domain/Entities/TrackingLink.cs
    - apps/api/AlertaYA.Application/Options/PublicOptions.cs
    - apps/api/AlertaYA.Application/Alerts/AlertRequests.cs
    - apps/api/AlertaYA.Application/Alerts/CreateAlertHandler.cs
    - apps/api/AlertaYA.Application/Alerts/GetAlertStatusHandler.cs
    - apps/api/AlertaYA.Api/Errors/Problemas.cs
    - apps/api/AlertaYA.Api/Errors/ManejadorExcepciones.cs
    - apps/api/AlertaYA.Api/OpenApi/RequeridosNoAnulables.cs
    - apps/api/.config/dotnet-tools.json
    - apps/api/openapi.json
    - apps/api/tests/AlertaYA.Api.IntegrationTests/BdRemotaFixture.cs
    - apps/api/tests/AlertaYA.Api.IntegrationTests/CreateAlertTests.cs
    - apps/api/tests/AlertaYA.Api.IntegrationTests/StatusTests.cs
    - apps/api/tests/AlertaYA.Api.IntegrationTests/ContactsTests.cs
    - apps/api/tests/AlertaYA.Domain.Tests/TelefonoTests.cs
  modified:
    - apps/api/AlertaYA.Domain/AlertValues.cs
    - apps/api/AlertaYA.Domain/Entities/Alert.cs
    - apps/api/AlertaYA.Domain/Entities/AlertLocation.cs
    - apps/api/AlertaYA.Application/Abstractions/IApplicationDbContext.cs
    - apps/api/AlertaYA.Infrastructure/Persistence/AppDbContext.cs
    - apps/api/AlertaYA.Api/Program.cs
    - apps/api/AlertaYA.Api/Controllers/AlertsController.cs
    - apps/api/AlertaYA.Api/Controllers/EmergencyContactsController.cs
    - apps/api/AlertaYA.Api/Models/DTOs/AlertDtos.cs
    - apps/api/AlertaYA.Api/appsettings.Example.json
    - apps/api/README.md
    - apps/api/tests/AlertaYA.Api.IntegrationTests/ApiFactory.cs
  deleted:
    - "Services/AlertEventQueue, IAlertEventQueue, NotificationWorker, VerificationWorker, NotificationService, INotificationService, VerificationService, IVerificationService"
    - "Services/SmsFallbackAuthService, ISmsFallbackAuthService, Options/SmsFallbackOptions (decision 01-02: deshabilitar)"

key-decisions:
  - "CreateAlertRequest y GeoPointDto se movieron a Application (AlertRequests.cs): el handler recibe el DTO del body"
  - "AlertEstados.EnCurso (activa, verificando, escalada) define la alerta activa y los estados que aceptan ubicacion"
  - "El data source de Npgsql se arma como singleton con UseNetTopologySuite: con UseNpgsql(cadena) escribir un Point en geography fallaba"
  - "Swagger: SupportNonNullableReferenceTypes + UseAllOfToExtendReferenceSchemas + filtro RequeridosNoAnulables (Swashbuckle 6.6.2 no marca required en records posicionales)"
  - "Comentarios minimos por instruccion de Roberto: solo los que explican un porque no obvio; prevalece sobre la convencion de XML docs"

requirements-completed: [SOS-01, SOS-03, SOS-04, CONT-01, UBIC-02]

duration: 28min
completed: 2026-11-05
plan_head_before: a83f667d674f826ed26bd56e4476ea2c3650fb48

actuals:
  tokens: 21675
  tasks: 3
  commits: 6
---

# Phase 01 Plan 06: Servidor del SOS Summary

POST /api/alerts crea en una transaccion la alerta activa, su enlace (solo SHA-256 del token HMAC de 128 bits) y una entrega en_cola por contacto, de forma idempotente; el dueño ve el estado real de cada contacto, los errores son ProblemDetails con `code`, los contactos quedan en E.164 +57 con duplicado, tope y ownership, y el contrato sale en `openapi.json`. Todo probado contra el remoto (D-22).

## Verificaciones

| Verify / criterio | Resultado |
|---|---|
| T1 `dotnet test --filter FullyQualifiedName~CreateAlertTests` | 7/7 |
| T1 `dotnet test --filter Category!=Integration` (sin ALERTAYA_TEST_DB) | 58/58 dominio + 1 humo |
| T1 `--filter Category=Smoke` sin ALERTAYA_TEST_DB | 1/1 |
| T1 greps: sin `AlertEventQueue`, sin `HttpPatch`, `AlertEstados.Activa`, `HMACSHA256`, sin `127.0.0.1`, `ALERTAYA_TEST_DB`, `it-alertaya-` y `DisableTestParallelization` una linea cada uno | ok |
| T1 tracer gate (re-run del verify tras el commit) | 7/7 |
| T2 `--filter FullyQualifiedName~StatusTests` | 4/4 (RED antes: 3 fallos) |
| T2 node: `id`, `estado`, `contactos`, `serverNow` en `required` de AlertStatusResponse | exit 0 |
| T2 greps: `IExceptionHandler`, sin `ex.Message`, `"/api/alerts/active"`, manifiesto con `swashbuckle.aspnetcore.cli` 6.6.2 | ok |
| T3 `--filter TelefonoTests\|ContactsTests` | 12/12 dominio + 6/6 integracion (RED antes) |
| T3 greps: `NormalizarCelularColombia` 2 lineas, `duplicate_contact` 1 linea en Problemas, `EnableRateLimiting("crear-alerta")` | ok |
| T3 `git diff --exit-code apps/api/openapi.json` tras reexportar | sin cambios |
| `dotnet test apps/api/AlertaYA.sln` completo | 70 dominio + 20 integracion, exit 0 |
| Remoto tras la corrida (solo SELECT): usuarios `it-alertaya-%`, entregas, enlaces | 0, 0, 0 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Escribir un Point en geography fallaba**
- **Found during:** Tarea 1 (primera corrida de CreateAlertTests)
- **Issue:** `InvalidCastException: Writing values of 'NetTopologySuite.Geometries.Point' is not supported for parameters having NpgsqlDbType 'Geography'`. Bug previo: ninguna prueba habia creado una alerta con ubicacion.
- **Fix:** `NpgsqlDataSource` singleton armado con `UseNetTopologySuite()` y pasado a `UseNpgsql(dataSource, ...)`; perezoso para que el host arranque sin cadena (pruebas de humo).
- **Files modified:** apps/api/AlertaYA.Api/Program.cs
- **Commit:** 5059169

**2. [Rule 3 - Blocking] Manifiesto de herramientas en la raiz de apps/api**
- **Found during:** Tarea 2
- **Issue:** con el SDK 10, `dotnet new tool-manifest` crea `apps/api/dotnet-tools.json`, no `.config/dotnet-tools.json`.
- **Fix:** se movio a `apps/api/.config/dotnet-tools.json` (ruta del plan; `dotnet tool` busca en ambas).
- **Commit:** fa4a514

**3. [Rule 2 - Missing] `ultimaUbicacion` sin `nullable` en el OpenAPI**
- **Found during:** Tarea 2
- **Issue:** Swashbuckle emite un `$ref` sin `nullable`, asi el cliente TS no admitiria el `null` real.
- **Fix:** `UseAllOfToExtendReferenceSchemas()`; y un `ISchemaFilter` propio (`OpenApi/RequeridosNoAnulables.cs`, archivo fuera de la lista del plan) porque 6.6.2 no marca `required` en records posicionales (A12).
- **Commit:** fa4a514

**4. Instruccion de Roberto a mitad de la ejecucion: pocos comentarios**
- Se quitaron los XML docs y comentarios que repetian el codigo en todo lo escrito en 01-06 (incluido el `AlertsController` reescrito); quedan solo los que explican un porque no obvio. Prevalece sobre la convencion del CLAUDE.md del repo.
- **Commits:** 5059169 (aplicado antes del commit), 2af7878

### Otras notas

- `AlertStatusResponse.CreadoEn` es anulable porque `alerts.creado_en` lo es en la BD (tiene default, pero no `not null`); no se inventa un valor.
- `AddLocation` ahora devuelve el mismo `AlertStatusResponse` que `/status` y su 409 usa `alert_finalized`; 01-09 la rehace con `capturadaEn`.
- La ubicacion inicial solo se guarda en `alerts.ubicacion`: `ultimaUbicacion` de `/status` sale de `alert_locations`, asi que es null hasta que 01-09 agregue la fila de `alert_locations` en la creacion (como dice su plan).
- El 400 automatico del model binding (por ejemplo, nombre en blanco) tambien lleva `code=validation_error` via `CustomizeProblemDetails`; su mensaje es el generico del framework, no el de UI-SPEC.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-01-19 a T-01-26 y T-01-77 quedan mitigados como dice el registro; T-01-21 se cerro eliminando sms-fallback.

## Para que decida Roberto

1. **Limite de 10 alertas por hora en un SOS.** El 429 dice "Si es una emergencia, llama al 123", pero un usuario real que dispara mas de 10 en una hora (pruebas, falsas alarmas) queda sin SOS. ¿Se mantiene 10, se sube, o se limita solo el envio de SMS y no la creacion?
2. **Duplicado de contacto sin restriccion en BD.** El 409 `duplicate_contact` se valida en codigo; dos POST concurrentes con el mismo numero podrian duplicar. Cerrarlo del todo exige un unique `(user_id, telefono)` en una migracion nueva (no aplicada: cambio de esquema).
3. **Contactos viejos con telefono sin normalizar** no se migran; la comparacion de duplicado es contra el valor guardado.

## Self-Check: PASSED

- Archivos creados verificados en disco (lista de key-files).
- Commits presentes: 5059169, fe3e3c8, fa4a514, 5cb7c46, dd0005a, 2af7878.
