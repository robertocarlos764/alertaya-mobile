# AlertaYA — Backend App del Ciudadano (SOS Barranquilla)

Backend de la **app móvil del ciudadano** para el sistema de alertas SOS. Solo cubre el flujo de la persona que solicita ayuda: registro/perfil, contactos de emergencia, creación y seguimiento de alertas, y envío de ubicación en vivo. El panel del CAI y de oficiales es una fase posterior.

Sigue la especificación [`Spec_Backend_App_Usuario.md`](./Spec_Backend_App_Usuario.md).

---

## Stack

- **.NET 8 (LTS)** — ASP.NET Core Web API con **Controllers** (no Minimal APIs)
- **Entity Framework Core** + **Npgsql.EntityFrameworkCore.PostgreSQL**
- **PostGIS** vía `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite` (columnas `geography(point, 4326)`)
- **PostgreSQL** alojada en **Supabase** (el backend usa la connection string directamente; la Data API está desactivada)
- **Supabase Auth** emite los JWT (HS256); el backend solo los **valida** en cada request (`Microsoft.AspNetCore.Authentication.JwtBearer`)

```
AlertaYA.sln                 Api -> Infrastructure -> Application -> Domain
AlertaYA.Domain/             AlertValues, AlertStateMachine, GeoPointExtensions, Entities/ (sin I/O)
AlertaYA.Application/        Abstractions/IApplicationDbContext, Alerts/ (CreateAlertHandler, GetAlertStatusHandler), Options/PublicOptions
AlertaYA.Infrastructure/     Persistence/AppDbContext (EF Core + Npgsql, mapeo Fluent API)
AlertaYA.Api/
  Controllers/        ProfilesController, EmergencyContactsController, AlertsController
  Extensions/         Extracción del user_id del JWT
  Models/DTOs/        Requests/Responses
  Errors/             Problemas (ProblemDetails con code) y ManejadorExcepciones (IExceptionHandler)
  OpenApi/            Filtro que marca como required las propiedades no anulables
  Options/            Opciones fuertemente tipadas (Jwt)
  Program.cs          JWT, DI, EF Core, ProblemDetails, GET /health
tests/
  AlertaYA.Domain.Tests/          Reglas puras (máquina de estados)
  AlertaYA.Api.IntegrationTests/  WebApplicationFactory: humo (Category=Smoke) e integración contra la BD remota (Category=Integration)
```

---

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Una base **PostgreSQL + PostGIS** (proyecto Supabase) con el esquema existente (ver sección Base de datos)

---

## Configuración

Los secretos se leen de variables de entorno o de `appsettings.{Environment}.json` (excluido de control de versiones). **Nunca** se hardcodean credenciales.

Copia `AlertaYA.Api/appsettings.Example.json` → `AlertaYA.Api/appsettings.json` y completa los valores, o usa variables de entorno:

| Variable | Descripción |
|---|---|
| `ConnectionStrings__Default` | Connection string de PostgreSQL (Supabase, con SSL) |
| `Jwt__Authority` | `https://<project-ref>.supabase.co/auth/v1` — el backend descarga las claves públicas (JWKS) desde acá y valida la firma asimétrica sin guardar secretos |
| `Jwt__SigningKey` | Solo si el proyecto usa el JWT Secret legacy (HS256) |
| `Jwt__Issuer` | `https://<project-ref>.supabase.co/auth/v1` (igual que Authority) |
| `Jwt__Audience` | `authenticated` (default) |
| `Public__ApiBaseUrl` | URL pública del API (`https://<servicio>.onrender.com`) |
| `Public__WebBaseUrl` | URL de la página pública de seguimiento; el enlace es `{WebBaseUrl}/t/{token}` |
| `Public__SecretoSeguimiento` | Secreto HMAC del token de seguimiento: base64 de al menos 32 bytes |

#### Dónde encontrarlas en el panel de Supabase (UI 2025+)

- **Connection string**: en la página de tu proyecto, botón **Connect** (arriba a la derecha) → pestaña de framework/URI. La contraseña de postgres está bajo **Project Settings → Database** (botón para revelarla).
- **Credenciales de Auth (JWT)**: ahora viven en **Authentication → JWT Keys** (ruta directa: `/project/<ref>/auth/jwt`), ya NO en Project Settings → API. Los proyectos creados desde mayo 2025 usan claves **asimétricas (RS256)** por defecto; el JWT Secret legacy HS256 está en la sección "Legacy JWT secret" de esa misma página. Con `Jwt__Authority` configurado, el backend valida las claves asimétricas automáticamente.

---

## Base de datos

Las tablas (`profiles`, `emergency_contacts`, `alerts`, `alert_locations`, `verification_logs`, y las de fases futuras `officers`, `cais`, etc.) **ya existen** en Supabase. El backend las mapea con Fluent API y **no genera migraciones** que intenten recrearlas.

### Esquema: `supabase/migrations`

El esquema lo manda `supabase/migrations` (SQL versionado), incluida la columna `client_generated_id` con su índice único `(user_id, client_generated_id)` para la idempotencia de `POST /api/alerts`. EF Core **no** genera ni aplica migraciones (la BD no tiene `__EFMigrationsHistory`): no uses `dotnet ef database update`.

---

## Correr el proyecto

```bash
dotnet build AlertaYA.sln
dotnet run --project AlertaYA.Api        # escucha en http://localhost:5000
dotnet test AlertaYA.sln --filter "Category!=Integration"   # humo + dominio, sin BD
dotnet test AlertaYA.sln                                     # todo, con ALERTAYA_TEST_DB
```

Las pruebas `Category=Integration` corren contra la BD remota de Supabase (D-22) con la cadena de `ALERTAYA_TEST_DB` (variable de usuario, nunca en el repo). Corren en serie y solo con usuarios `it-alertaya-<guid>@example.com`, que se borran al empezar y al terminar. Fallan con un mensaje claro si falta la variable, si el API real está corriendo en `localhost:5016`, si el reloj del PC difiere más de 2 s del de la BD o si hay entregas pendientes de usuarios reales.

En `Development` se habilita Swagger en `/swagger`.

### Despliegue en Render (D-23)

El API corre en Render (plan gratuito, Docker) con la URL fija `https://<servicio>.onrender.com`, que va en el APK, en Vercel y en el StatusCallback de Twilio.

1. render.com → **New → Web Service** → conectar el repo de GitHub, rama `dev`.
2. **Root Directory:** `apps/api` · **Runtime:** Docker · **Instance type:** Free · **Health Check Path:** `/health`.
3. Variables de entorno:

   | Variable | Valor |
   |---|---|
   | `ASPNETCORE_ENVIRONMENT` | `Production` |
   | `ConnectionStrings__Default` | cadena Npgsql del Session pooler (la misma de `ALERTAYA_TEST_DB`) |
   | `Jwt__Authority` / `Jwt__Issuer` | `https://<project-ref>.supabase.co/auth/v1` |
   | `Jwt__Audience` | `authenticated` |
   | `Public__ApiBaseUrl` | `https://<servicio>.onrender.com` |
   | `Public__WebBaseUrl` | `https://<proyecto>.vercel.app` |
   | `Public__SecretoSeguimiento` | base64 de 32 bytes aleatorios |

4. El plan gratuito duerme el servicio tras 15 min sin tráfico (despertar tarda 30–60 s). Un cron gratuito externo (cron-job.org) hace `GET /health` cada 10 min para mantenerlo despierto; el outbox vive en Postgres, así que un reinicio no pierde SMS.

Comprobación: `curl -fsS https://<servicio>.onrender.com/health` → `Healthy`.

---

## Endpoints

Todos requieren `Authorization: Bearer {jwt}` salvo el marcado como público.

### Perfil — `/api/profiles`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/profiles/me` | Perfil del usuario autenticado (id del JWT, nunca de la URL) |
| PATCH | `/api/profiles/me` | Actualiza `nombre`, `telefono`, `palabraClave`. Rechaza `ventanaConfirmacionSegundos` y `modoSilencioso` (solo administrador) |

### Contactos de emergencia — `/api/emergency-contacts`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/emergency-contacts` | Lista contactos del usuario |
| POST | `/api/emergency-contacts` | Crea contacto (`nombre`, `telefono`, opcional `relacion`); `user_id` se asigna del token. El teléfono se guarda como `+573XXXXXXXXX` (solo celular colombiano, si no 400 `validation_error`); repetido 409 `duplicate_contact`; máximo 10, 409 `contact_limit` |
| PUT | `/api/emergency-contacts/{id}` | Actualiza contacto con las mismas validaciones; ajeno o inexistente 404 `contact_not_found` |
| DELETE | `/api/emergency-contacts/{id}` | Elimina contacto (valida pertenencia) |

### Alertas — `/api/alerts`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/alerts` | Crea la alerta ya `activa`, su enlace de seguimiento y una entrega `en_cola` por contacto en una transacción. **Idempotente** vía `clientGeneratedId` (obligatorio). Body: `canalActivacion` (`boton_pulsado` \| `voz` \| `boton_fisico`), opcionales `ubicacionInicial {lat, lon}` (se rechaza fuera de rango o `(0,0)`), `precisionMetros`, `fuente` (`gps` \| `celular` \| `cache`). El 201 significa guardada y en cola, no enviada. Máximo 10 por hora por usuario (`RateLimits__CrearAlertaPorHora`): 429 `rate_limited` |
| POST | `/api/alerts/{id}/location` | Registra ubicación en el historial (`alert_locations`) y actualiza `alerts.ubicacion` en la misma transacción. Solo en estados activos |
| GET | `/api/alerts/{id}/status` | Estado de la alerta, `serverNow`, `trackingUrl`, última ubicación confirmada y el estado real de cada contacto (`en_cola`, `enviando`, `reintento`, `enviado`, `entregado`, `fallido`, `cancelado`). 404 si no es del usuario |
| GET | `/api/alerts/active` | La alerta en curso del usuario (mismo cuerpo que `/status`) o 204 |
| GET | `/api/alerts` | Historial de alertas del usuario (más reciente primero) |

### Estados de alerta
`pendiente` → `activa` | `descartada` | `finalizada`; `activa` → `verificando` | `finalizada`; `verificando` → `escalada` | `atendida` | `descartada` | `finalizada`; `escalada` → `atendida` | `descartada` | `finalizada`. `atendida`, `descartada` y `finalizada` ("Estoy a salvo", D-09) son terminales. Cualquier otra transición se rechaza con error claro. La validación vive en `AlertaYA.Domain/AlertStateMachine.cs`.

---

## Errores

Todos los errores son ProblemDetails (RFC 9457, `application/problem+json`) con la extensión `code`: `validation_error`, `alert_not_found`, `contact_not_found`, `duplicate_contact`, `contact_limit`, `alert_finalized`, `rate_limited`, `internal_error`. Un 500 nunca incluye el mensaje de la excepción.

## Contrato OpenAPI

`openapi.json` está versionado y lo consume el cliente tipado de la app. Todo plan que cambie el contrato lo reexporta desde `apps/api`:

```bash
dotnet tool restore
dotnet build AlertaYA.Api -c Release
dotnet tool run swagger tofile --output openapi.json AlertaYA.Api/bin/Release/net8.0/AlertaYA.Api.dll v1
```

---

## Seguridad

- **JWT**: el backend valida firma (HS256 con el JWT Secret), issuer y audiencia de Supabase en cada request. El `user_id` siempre se extrae del claim `sub` — nunca de un valor del body o la URL.
- **Autorización por recurso**: cada consulta cruza el recurso contra el `user_id` del token (los endpoints devuelven 404 si el recurso no pertenece al usuario).
- **RLS es segunda capa**: como el backend se conecta con credenciales de rol administrador (no pasa por RLS), toda la autorización real está implementada en código.
- **Enlace de seguimiento**: token de 128 bits derivado por HMAC con `Public__SecretoSeguimiento`; en BD solo su SHA-256.

---

## Documentos

- Especificación: [`Spec_Backend_App_Usuario.md`](./Spec_Backend_App_Usuario.md)