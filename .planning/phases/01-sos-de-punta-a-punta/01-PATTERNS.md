# Fase 1: SOS de punta a punta - Mapa de patrones

**Mapeado:** 2026-10-06
**Archivos analizados:** 52 (nuevos/modificados)
**Analogos encontrados:** 21 / 52 (todo el back tiene analogo; el front movil y web no tienen codigo previo)

> Nota de rastreo: el repo no es git (`Is a git repository: false`), asi que no aplica `git ls-files`. Todos los analogos citados viven en `apps/api/`, `apps/mobile/` (scaffold) o `docs/legacy/` (solo referencia visual). Ninguno es espejo gitignored.
> `apps/mobile` es scaffold vacio (`App.tsx`, `index.ts`, `package.json` con 4 deps, `app.json` con `userInterfaceStyle: light`). No hay patrones de front que copiar; el contrato es `01-UI-SPEC.md` + tokens de `docs/legacy/flutter/lib/theme/app_theme.dart`.

## Clasificacion de archivos

### API .NET (`apps/api`)

| Archivo nuevo/modificado | Rol | Flujo | Analogo mas cercano | Calidad |
|---|---|---|---|---|
| `src/AlertaYA.Domain/AlertValues.cs` (+`Finalizada`, `DeliveryEstados`) | model/constantes | transform | `apps/api/AlertaYA.Api/Domain/AlertValues.cs` | exacto (mover + ampliar) |
| `src/AlertaYA.Domain/AlertStateMachine.cs` | utility | transform | `apps/api/AlertaYA.Api/Domain/AlertStateMachine.cs` | exacto (mover + ampliar) |
| `src/AlertaYA.Domain/DeliveryRetryPolicy.cs`, `SmsTextBuilder.cs`, `TrackingToken.cs` | utility | transform | `AlertStateMachine.cs` (static class pura) | rol similar |
| `src/AlertaYA.Application/Alerts/CreateAlertHandler.cs` | service | CRUD transaccional | `AlertsController.Create` (lineas 44-124) | exacto (extraer) |
| `.../AddLocationHandler.cs` | service | CRUD | `AlertsController.AddLocation` (178-236) | exacto |
| `.../FinishAlertHandler.cs` | service | CRUD | `AlertsController.UpdateState` (130-171) | rol similar |
| `.../GetAlertStatusHandler.cs` | service | request-response | `AlertsController.GetStatus` (239-262) | exacto |
| `.../GetTrackingViewHandler.cs` | service | request-response (anonimo) | `GetStatus` + `GeoPointDto.From` | parcial |
| `Notifications/ApplyProviderStatus.cs` | service | event-driven | `NotificationWorker.ProcesarAsync` (51-73) | parcial |
| `Abstractions/ISmsSender.cs`, `IApplicationDbContext.cs` | port | - | `Services/Abstractions/INotificationService.cs` | exacto (estilo) |
| `Infrastructure/Persistence/AppDbContext.cs` (+DbSets `NotificationDeliveries`, `TrackingLinks`) | model/config | CRUD | `apps/api/AlertaYA.Api/Data/AppDbContext.cs` | exacto |
| `Infrastructure/Sms/TwilioSmsSender.cs` | service | request-response | `Services/SmsFallbackAuthService.cs` + `Options/SmsFallbackOptions.cs` | parcial (opciones+DI) |
| `Infrastructure/Workers/DeliveryDispatcher.cs` | worker | batch/event-driven | `Services/Background/NotificationWorker.cs` | exacto |
| `Api/Controllers/AlertsController.cs` (adelgazar, `POST /{id}/finish`, quitar PATCH y sms-fallback) | controller | request-response | si mismo | exacto |
| `Api/Controllers/EmergencyContactsController.cs` (E.164, 409, ProblemDetails) | controller | CRUD | si mismo | exacto |
| `Api/Controllers/PublicTrackingController.cs` | controller | request-response anonimo | `AlertsController.SmsFallback` (`[AllowAnonymous]`, 293-297) | parcial |
| `Api/Controllers/WebhooksController.cs` (`/webhooks/twilio/status`) | controller | event-driven | `AlertsController.SmsFallback` + `SmsFallbackAuthService` (firma) | parcial |
| `Api/Program.cs` (ProblemDetails, rate limiter, CORS, DI) | config | - | `apps/api/AlertaYA.Api/Program.cs` | exacto |
| `Options/TwilioOptions.cs`, `PublicOptions.cs` | config | - | `Options/SmsFallbackOptions.cs`, `Options/JwtOptions.cs` | exacto |
| `Models/DTOs/*` (nuevos DTOs de entregas/tracking) | model | - | `Models/DTOs/AlertDtos.cs`, `EmergencyContactDtos.cs` | exacto |
| `tests/AlertaYA.Domain.Tests/*` | test | - | ninguno en `apps/api` (si en `docs/legacy/api-dominio` 87 tests) | sin analogo en api |
| `openapi.json` | config | - | ninguno | sin analogo |

### Supabase (`supabase/`)

| Archivo | Rol | Flujo | Analogo | Calidad |
|---|---|---|---|---|
| `supabase/migrations/0000_baseline.sql` | migration | batch | ninguno (esquema vive solo en remoto; ver `Migrations/20260924000000_AddClientGeneratedIdToAlerts.cs` como unico delta) | sin analogo |
| `supabase/migrations/0001_*.sql` (entregas, tracking_links, `claim_deliveries`, CHECK `finalizada`, `handle_new_user`, default 5) | migration | CRUD | codigo SQL de RESEARCH "Funcion de claim" | sin analogo en repo |

### Movil (`apps/mobile`) y web (`apps/web`)

| Archivo | Rol | Flujo | Analogo | Calidad |
|---|---|---|---|---|
| `package.json`, `app.json`, `tsconfig.json`, `index.ts` -> `expo-router/entry` | config | - | los mismos archivos actuales | exacto (modificar) |
| `src/theme/tokens.ts` | config | - | `docs/legacy/flutter/lib/theme/app_theme.dart` lineas 7-16, 46-110 | referencia visual |
| `src/i18n/es.ts` | config | - | UI-SPEC "Copywriting Contract" | spec |
| `src/components/ui/{Screen,Header,AppText,Button,TextField,Snackbar,Dialog,Skeleton}.tsx` | component | - | `docs/legacy/flutter/lib/screens/` (visual) | referencia visual |
| `src/components/{HoldButton,DeliveryStatus,LocationMiniMap,ContactRow,Avatar}.tsx` | component | event-driven / transform | UI-SPEC "Contrato de componentes" | spec |
| `src/lib/{supabase,api,storage,phone}.ts` | utility | request-response | RESEARCH "Standard Stack" (supabase-js + openapi-fetch) | spec |
| `src/features/{auth,contacts,alert}/*` | hook/service | CRUD / request-response | `EmergencyContactDtos.cs` y `AlertDtos.cs` (contrato) | contrato |
| `src/app/**` (rutas segun UI-SPEC "Mapa de pantallas") | route/screen | - | UI-SPEC | spec |
| `apps/web/src/app/t/[token]/{page,TrackingView}.tsx`, `lib/trackingState.ts` | component | polling | UI-SPEC "Pagina publica" | spec |

## Asignacion de patrones

### Dominio: `AlertValues.cs` y `AlertStateMachine.cs` (utility, transform)

**Analogo:** `apps/api/AlertaYA.Api/Domain/AlertValues.cs` (1-60) y `AlertStateMachine.cs` (16-54).

Copiar tal cual el patron de constantes (NO enums), agregando `Finalizada` y una clase `DeliveryEstados` con el mismo molde (`AlertValues.cs` lineas 3-18):

```csharp
public static class AlertEstados
{
    public const string Pendiente = "pendiente";
    public const string Activa = "activa";
    // ...
    public static readonly string[] Todos = { Pendiente, Activa, /* ... */ };
    public static bool EsValido(string? valor) => valor is not null && Todos.Contains(valor);
}
```

Tabla de transiciones a ampliar (`AlertStateMachine.cs` 18-27): agregar `Finalizada` como destino desde `pendiente|activa|verificando|escalada` y entrada terminal `[AlertEstados.Finalizada] = Array.Empty<string>()`. Mantener `PuedeTransicionar` / `TransicionesPermitidas` (29-53) sin cambios. Cambiar namespace a `AlertaYA.Domain`. Los tests de matriz completa (estados x estados) van en `tests/AlertaYA.Domain.Tests` con xunit.

---

### `CreateAlertHandler` (service, CRUD transaccional)

**Analogo:** `AlertsController.Create` (lineas 44-124).

**Imports/estilo:** vocabulario espanol de dominio, `AsNoTracking` en lecturas, `CancellationToken` siempre.

**Idempotencia + carrera (copiar entero)** (75-118):

```csharp
var existente = await _db.Alerts.AsNoTracking()
    .FirstOrDefaultAsync(a => a.UserId == userId && a.ClientGeneratedId == request.ClientGeneratedId, cancellationToken);
if (existente is not null) return CreatedAtAction(nameof(GetStatus), new { id = existente.Id }, AlertResponse.From(existente));
// ...
try { await _db.SaveChangesAsync(cancellationToken); }
catch (DbUpdateException ex) when (IsViolacionUnico(ex))
{
    var duplicada = await _db.Alerts.AsNoTracking().FirstAsync(
        a => a.UserId == userId && a.ClientGeneratedId == request.ClientGeneratedId, cancellationToken);
    return CreatedAtAction(nameof(GetStatus), new { id = duplicada.Id }, AlertResponse.From(duplicada));
}
private static bool IsViolacionUnico(DbUpdateException ex)
    => ex.InnerException is PostgresException pg && pg.SqlState == "23505";   // 358-359
```

**Cambios sobre el analogo (decisiones de RESEARCH):**
- `Estado = AlertEstados.Activa` en lugar de `Pendiente` (linea 92) para no depender del `VerificationWorker`.
- En el mismo `SaveChanges` (una transaccion): `Alert` + `TrackingLink` + una `NotificationDelivery` por contacto (`status='queued'`, snapshot nombre/telefono). Contactos con la misma consulta de `NotificationWorker.cs` 66-69 (`db.EmergencyContacts.AsNoTracking().Where(c => c.UserId == alerta.UserId)`).
- Eliminar `_queue.Enqueue(new AlertCreatedEvent(...))` (linea 121); como mucho una pista de latencia para el dispatcher.
- Rechazar coordenada (0,0) y rangos invalidos (Pattern 7); `GeoPointExtensions.ToPoint4326(lat, lon)` (X=lon, Y=lat) se mantiene.
- Reutilizar la validacion `X.EsValido(...)` (57-73), pero devolver ProblemDetails con `code` estable en vez de `new { error = ... }`.

---

### `AddLocationHandler` (service, CRUD)

**Analogo:** `AlertsController.AddLocation` (178-236). Copiar: ownership en la query (191-192), 404 uniforme, validacion de `fuente` (208-212), insercion en `alert_locations` + actualizacion de `alerts.ubicacion` en un solo `SaveChanges` (217-233).

**Cambios:** usar `request.Timestamp` como `captured_at` (hoy se ignora y se guarda `CreadoEn = now`, linea 224); `EstadosReceptoresDeUbicacion` (20-23) debe incluir `Activa` y seguir excluyendo `Finalizada`; devolver `serverNow`.

---

### `FinishAlertHandler` / `POST /{id}/finish` (service, CRUD)

**Analogo:** `AlertsController.UpdateState` (130-171).

```csharp
var alerta = await _db.Alerts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, cancellationToken);
if (alerta is null) return NotFound(new { error = "Alerta no encontrada." });
if (!AlertStateMachine.PuedeTransicionar(alerta.Estado, request.Estado)) { /* 400 con transicionesPermitidas */ }
alerta.Estado = request.Estado; alerta.ActualizadoEn = DateTimeOffset.UtcNow;
await _db.SaveChangesAsync(cancellationToken);
```

**Cambios:** estado fijo `Finalizada`, idempotente (si ya `finalizada` -> 200), setear `finalizada_en`, pasar entregas `alert` en `queued|retry` a `cancelled`, encolar `kind='safe'` solo para contactos con `sent|delivered`. Eliminar el `PATCH` generico (permite fijar estados arbitrarios).

---

### `DeliveryDispatcher` (worker, batch/event-driven)

**Analogo:** `apps/api/AlertaYA.Api/Services/Background/NotificationWorker.cs` (12-74).

**Patron de worker + scope por iteracion (copiar)** (14-26, 38-48, 53-54):

```csharp
public class NotificationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationWorker> _logger;
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await ProcesarAsync(/* ... */, stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "Notificación falló para la alerta {AlertId}", /* ... */); }
        }
    }
    // dentro: using var scope = _scopeFactory.CreateScope();
    //         var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
}
```

**Cambios:** en lugar de `DequeueForNotificationAsync`, poll cada 2 s + `claim_deliveries` (RESEARCH Pattern 1) con `Task.Delay(…, stoppingToken)`; antes de enviar `kind='alert'` revisar que la alerta no este `finalizada`; guardar el SID en un unico UPDATE inmediatamente despues de `ISmsSender`. Registro: `builder.Services.AddHostedService<DeliveryDispatcher>()` como `Program.cs` linea 75-76; borrar `NotificationWorker`, `NotificationService` (loguea PII), `AlertEventQueue` o reducirlos a pista.

---

### `ISmsSender` / `TwilioSmsSender` (port + adapter)

**Analogo de interfaz:** `apps/api/AlertaYA.Api/Services/Abstractions/INotificationService.cs` (prefijo `I`, `Task`-async, `CancellationToken`); **analogo de opciones/DI:** `Options/SmsFallbackOptions.cs` (1-11) y `Program.cs` linea 29, 73-74.

```csharp
// Options tipadas (SmsFallbackOptions.cs)
public class SmsFallbackOptions { public string Secret { get; set; } = string.Empty; public int MaxAgeSeconds { get; set; } = 300; }
// Program.cs
builder.Services.Configure<SmsFallbackOptions>(builder.Configuration.GetSection("SmsFallback"));
builder.Services.AddScoped<INotificationService, NotificationService>();
```

Crear `TwilioOptions` (AccountSid, AuthToken, From, StatusCallbackUrl) y `PublicOptions` (`ApiBaseUrl`, `WebBaseUrl`) con el mismo molde; documentar claves en `appsettings.Example.json` (nunca secretos en el repo). `TwilioSmsSender` usa `MessageResource.CreateAsync`.

---

### `WebhooksController` y `PublicTrackingController` (controller, anonimo)

**Analogo:** `AlertsController.SmsFallback` (293-324): `[HttpPost("...")] [AllowAnonymous]` + validacion propia de autenticidad antes de tocar la BD.

```csharp
[HttpPost("sms-fallback")]
[AllowAnonymous]
public async Task<ActionResult<AlertResponse>> SmsFallback([FromBody] SmsFallbackRequest request, CancellationToken cancellationToken)
{
    var auth = HttpContext.RequestServices.GetRequiredService<ISmsFallbackAuthService>();
    if (!auth.Validate(...)) return Unauthorized(new { error = "Hash de autenticación inválido o expirado." });
```

**Cambios:** webhook valida `X-Twilio-Signature` con `RequestValidator` y `PublicOptions.ApiBaseUrl + path` (no `Request.Url`); form-urlencoded (`[FromForm]`), no JSON. Endpoint publico: ruta `api/public/tracking/{token}`, 404 uniforme, `Cache-Control: no-store`, `[EnableRateLimiting]`. **No** copiar el `detalle = ex.Message` de la linea 350. Deshabilitar `POST /api/alerts/sms-fallback` o enrutarlo por el mismo handler (crea alertas sin entregas).

---

### `EmergencyContactsController` (controller, CRUD) - modificar

**Analogo:** si mismo (11-135). Mantener: `[Authorize]`, `User.GetUserId()` nunca del body (27-31, 42), ownership en query (83-84), 404 tambien para ajeno (86-90), `EmergencyContactDto.From`.

```csharp
var contacto = await _db.EmergencyContacts.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);
// 404 también si existe pero no es del usuario: no se filtra la existencia del recurso.
if (contacto is null) return NotFound(new { error = "Contacto no encontrado." });
```

**Agregar:** validacion regex `^\+573\d{9}$` (hoy solo `IsNullOrWhiteSpace`, linea 52), 409 `duplicate_contact` por `(user_id, telefono)`, tope de 10 contactos, ProblemDetails, tests de ownership. Los controllers de contactos pueden quedarse en `AlertaYA.Api` (Anti-Pattern 8).

---

### `Program.cs` (config)

**Analogo:** `apps/api/AlertaYA.Api/Program.cs`. Mantener el bloque JwtBearer/Supabase (32-68) intacto. Agregar junto a las lineas 16-18: `AddProblemDetails()` + `IExceptionHandler`, `AddRateLimiter` (politica por IP via `ForwardedHeaders`), `AddCors` solo al origen de Vercel, `AddSingleton(TimeProvider.System)`, `Configure<TwilioOptions>` / `Configure<PublicOptions>` (patron linea 28-29), `AddScoped<ISmsSender, TwilioSmsSender>()`, `AddHostedService<DeliveryDispatcher>()` (patron 75-76). `app.UseExceptionHandler()` antes de `UseAuthentication()` (86).

---

### `AppDbContext` (model/config)

**Analogo:** `apps/api/AlertaYA.Api/Data/AppDbContext.cs`. Mapeo explicito snake_case por propiedad, `HasColumnType("geography (point, 4326)")`, indice unico con `HasDatabaseName`, FK con `HasOne<T>().WithMany().HasForeignKey(...)`:

```csharp
modelBuilder.Entity<Alert>(e =>
{
    e.ToTable("alerts");
    e.Property(a => a.ClientGeneratedId).HasColumnName("client_generated_id");
    e.HasIndex(a => new { a.UserId, a.ClientGeneratedId }).IsUnique().HasDatabaseName("IX_alerts_user_id_client_generated_id");
});
```

Agregar `NotificationDelivery` (unico `(alert_id, contact_id, channel, kind)`), `TrackingLink` (`token_hash` unico, `revoked_at`), `AlertLocation.CapturedAt`, `Alert.FinalizadaEn`. No hay EF migrations: el esquema lo manda `supabase/migrations`; borrar `apps/api/AlertaYA.Api/Migrations/` al mover (la BD no tiene `__EFMigrationsHistory`). Aplicar al remoto solo con confirmacion de Roberto.

---

### DTOs

**Analogo:** `Models/DTOs/AlertDtos.cs` y `EmergencyContactDtos.cs`: `record` posicional + `static From(entity)`:

```csharp
public record EmergencyContactDto(Guid Id, string Nombre, string Telefono, string? Relacion, DateTimeOffset? CreadoEn)
{
    public static EmergencyContactDto From(EmergencyContact c) => new(c.Id, c.Nombre, c.Telefono, c.Relacion, c.CreadoEn);
}
```

Nuevos: `AlertStatusResponse` ampliado con `Contactos[]` (estado de entrega, intentos), `serverNow`, `TrackingUrl`; `TrackingViewResponse` con `personName, personPhone, status, lastLocation, trail, startedAt, endedAt, serverNow`. Verificar en el `openapi.json` generado que los campos no sean opcionales por accidente (usar `required`).

---

### Movil: tema, componentes y pantallas (sin analogo de codigo)

**Tokens** (`src/theme/tokens.ts`): trasladar de `docs/legacy/flutter/lib/theme/app_theme.dart`:

```dart
static const Color background = Color(0xFF0D0D0D);
static const Color surface    = Color(0xFF1A1A1A);
static const Color primary    = Color(0xFFE8212B);
static const Color border     = Color(0xFF2A2A2A);
static const Color hint       = Color(0xFF5A5A5A);   // UI-SPEC: solo decorativo, NO texto
```
Mas los tokens nuevos de UI-SPEC (texto secundario `#9A9A9A`, exito `#4ADE80`, advertencia `#F5A524`, rojo profundo `#B3121B`). Botones 56 de alto, radio 10, 16/600 letterSpacing 0.5 (lineas 78-95); input radio 10, borde 1, foco 1.5 (46-77); dialogo radio 16 (132-138). No copiar el texto "ALERTA ENVIADA" ni los checks verdes del legacy.

**Config a modificar (`apps/mobile`):**
- `package.json`: `"main": "index.ts"` -> `"expo-router/entry"`; agregar deps solo con `npx expo install` (lista en RESEARCH "Installation").
- `app.json`: hoy `"userInterfaceStyle": "light"` (linea 8) -> `"dark"`; mantener `predictiveBackGestureEnabled: false` (19); agregar plugins (`expo-router`, `expo-secure-store`, `@maplibre/maplibre-react-native`, `expo-font`), `scheme`, permisos de ubicacion en primer plano; fondo del adaptive icon (`#E6F4FE`) y `splash` oscuros. No editar `android/` a mano (CNG).
- `tsconfig.json`: ya extiende `expo/tsconfig.base` con `strict`; agregar alias `@/*` -> `src/*` si el plan lo usa.
- Eliminar `App.tsx` e `index.ts` al pasar a Expo Router (`src/app/_layout.tsx`).

**Convenciones de codigo movil (CLAUDE.md):** TS 2 espacios, comillas simples, punto y coma, `StyleSheet.create` al final del archivo, componentes PascalCase, rutas solo en `src/app/`, codigo no-ruta fuera. Antes de cerrar cada tarea: `npx expo lint` y `npx tsc --noEmit`.

**Estructura objetivo:** ver RESEARCH "Recommended Project Structure" (`src/{app,theme,i18n,components,features,lib}`) y UI-SPEC "Mapa de pantallas". `DeliveryStatus` es la unica ruta de pintado de estados de entrega (tabla de UI-SPEC "Estados de entrega"); `HoldButton` parametrizado por duracion (2000 SOS / 3000 a salvo).

---

### Web publica (`apps/web`) (sin analogo)

Greenfield. Seguir UI-SPEC "Pagina publica": `maplibre-gl` directo con `next/dynamic` `ssr:false`, polling 5 s con pausa en `document.hidden`, logica de estado en `lib/trackingState.ts` (pura, con vitest). Contrato de datos = `TrackingViewResponse` del API.

## Patrones compartidos

### Identidad de usuario y ownership
**Fuente:** `apps/api/AlertaYA.Api/Extensions/ClaimsPrincipalExtensions.cs` (14-20) + `AlertsController.cs` (34, 143-144).
**Aplicar a:** todo controller/handler autenticado (alertas, contactos, finish, status).
```csharp
public static Guid? GetUserId(this ClaimsPrincipal user)
{
    var sub = user.FindFirst("sub")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return Guid.TryParse(sub, out var userId) ? userId : null;
}
// ownership en la query, 404 para ajeno
.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, cancellationToken);
```
La API se conecta con un rol que se salta RLS: el ownership en codigo es obligatorio y debe tener test.

### Idempotencia / violacion unica
**Fuente:** `AlertsController.cs` 107-118 y 358-359. **Aplicar a:** `CreateAlertHandler`, insercion de entregas (unico `(alert_id, contact_id, channel, kind)`), contactos duplicados (409).

### Errores (cambio de convencion)
**Estado actual:** `NotFound(new { error = "..." })` (p.ej. `AlertsController.cs` 148, `EmergencyContactsController.cs` 89). **Fase 1:** reemplazar por ProblemDetails (RFC 9457) con extension `code` estable (`validation_error`, `duplicate_contact`, `alert_not_found`, `alert_finalized`); mensajes de usuario en espanol; nunca `ex.Message` al cliente.

### Constantes de dominio
**Fuente:** `AlertValues.cs` 3-60 (`static class` + `Todos` + `EsValido`). **Aplicar a:** estados de entrega, tipos de entrega (`alert|safe`), canales; no usar enums.

### Opciones tipadas y secretos
**Fuente:** `Options/SmsFallbackOptions.cs`, `Program.cs` 14, 28-29. **Aplicar a:** Twilio, URL publica; plantilla en `appsettings.Example.json`; env vars `Twilio__*`, `Public__*`.

### Logging
**Fuente:** `NotificationWorker.cs` 44-46 (`ILogger<T>` con plantillas nombradas). **Aplicar a:** dispatcher, webhook. Sin PII (telefonos, coordenadas) en logs.

### Estilo C#
Allman, 4 espacios, comas finales en inicializadores multilinea, comentarios/XML docs en espanol (citar la regla de la spec), `CancellationToken` siempre propagado, DTOs con `From`. Namespaces tras el refactor: `AlertaYA.Domain`, `AlertaYA.Application.*`, `AlertaYA.Infrastructure.*`, `AlertaYA.Api`.

## Sin analogo

| Archivo | Rol | Flujo | Motivo / de donde sacar el patron |
|---|---|---|---|
| `supabase/migrations/*.sql` | migration | batch | No hay SQL versionado; usar RESEARCH "Funcion de claim" y Pitfalls 8, 11, 12 |
| `tests/**` (xunit) | test | - | No hay proyecto de tests en `apps/api`; referencia `docs/legacy/api-dominio` (87 tests) y RESEARCH "Tests API" |
| `openapi.json` + `api-types.ts` | config | - | Nuevo; `dotnet swagger tofile` + `openapi-typescript` |
| `SmsTextBuilder` (GSM-7), `DeliveryRetryPolicy`, `TrackingToken` | utility | transform | Logica nueva pura; usar el estilo de `AlertStateMachine` (static class + tests) |
| Todo `apps/mobile/src/**` | component/route | - | Scaffold vacio; UI-SPEC + `app_theme.dart` |
| Todo `apps/web/**` | component | polling | Greenfield; UI-SPEC |
| Rate limiter, CORS, ProblemDetails, `IExceptionHandler` | config | - | No existen hoy en `Program.cs`; APIs incluidas en .NET 8 (RESEARCH Pattern 8) |

## Metadatos

**Alcance de busqueda:** `apps/api/AlertaYA.Api/**` (Controllers, Domain, Data, Models, Options, Services, Extensions, Program.cs), `apps/mobile/{package.json,app.json,AGENTS.md}`, `docs/legacy/flutter/lib/theme/app_theme.dart`.
**Archivos leidos:** 16 (+ CONTEXT, RESEARCH 1-465, UI-SPEC).
**Pendiente de lectura por el planner:** `01-RESEARCH.md` lineas 466-711 (Open Questions, Validation Architecture, Security), no necesarias para el mapeo de analogos.
**Fecha de extraccion:** 2026-10-06
