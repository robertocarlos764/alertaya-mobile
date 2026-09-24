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
AlertaYA.sln
AlertaYA.Api/
  Controllers/        ProfilesController, EmergencyContactsController, AlertsController
  Data/AppDbContext   Mapeo Fluent API a las tablas existentes
  Domain/             AlertValues (constantes) + AlertStateMachine (máquina de estados)
  Extensions/         Extracción del user_id del JWT y helpers geo
  Migrations/         Única migración: client_generated_id en alerts
  Models/Entities/    Entidades EF (Profile, EmergencyContact, Alert, AlertLocation, VerificationLog)
  Models/DTOs/        Requests/Responses
  Options/            Opciones fuertemente tipadas (Jwt, SmsFallback)
  Services/           Cola Channel<T>, verificación heurística, notificaciones, auth SMS
  Services/Background VerificationWorker + NotificationWorker (BackgroundService)
  Program.cs          JWT, DI, EF Core, workers
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
| `SmsFallback__Secret` | Secreto compartido para el hash del fallback SMS |
| `SmsFallback__MaxAgeSeconds` | Antigüedad máxima del payload SMS (anti-replay), default `300` |

#### Dónde encontrarlas en el panel de Supabase (UI 2025+)

- **Connection string**: en la página de tu proyecto, botón **Connect** (arriba a la derecha) → pestaña de framework/URI. La contraseña de postgres está bajo **Project Settings → Database** (botón para revelarla).
- **Credenciales de Auth (JWT)**: ahora viven en **Authentication → JWT Keys** (ruta directa: `/project/<ref>/auth/jwt`), ya NO en Project Settings → API. Los proyectos creados desde mayo 2025 usan claves **asimétricas (RS256)** por defecto; el JWT Secret legacy HS256 está en la sección "Legacy JWT secret" de esa misma página. Con `Jwt__Authority` configurado, el backend valida las claves asimétricas automáticamente.

---

## Base de datos

Las tablas (`profiles`, `emergency_contacts`, `alerts`, `alert_locations`, `verification_logs`, y las de fases futuras `officers`, `cais`, etc.) **ya existen** en Supabase. El backend las mapea con Fluent API y **no genera migraciones** que intenten recrearlas.

### Migración única: `client_generated_id`

La especificación exige idempotencia en `POST /api/alerts` mediante un `clientGeneratedId` que genera el cliente, con índice único `(user_id, client_generated_id)` en `alerts`. Como no había SQL de referencia para confirmar si esa columna ya existe, se entregó una migración que la agrega:

- **Opcion A (CLI):**
  ```bash
  dotnet tool install -g dotnet-ef
  dotnet ef database update --project AlertaYA.Api
  ```
- **Opcion B (editor SQL de Supabase):**
  ```sql
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS client_generated_id uuid;
  CREATE UNIQUE INDEX IF NOT EXISTS IX_alerts_user_id_client_generated_id
    ON alerts (user_id, client_generated_id);
  ```

> ⚠️ **Si la columna ya existe** en tu base, usa la opción B (con `IF NOT EXISTS`); `dotnet ef database update` fallaría con "column already exists".

---

## Correr el proyecto

```bash
dotnet build AlertaYA.sln
dotnet run --project AlertaYA.Api        # escucha en http://localhost:5000
```

En `Development` se habilita Swagger en `/swagger`.

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
| POST | `/api/emergency-contacts` | Crea contacto (`nombre`, `telefono`, opcional `relacion`); `user_id` se asigna del token |
| PUT | `/api/emergency-contacts/{id}` | Actualiza contacto (valida pertenencia) |
| DELETE | `/api/emergency-contacts/{id}` | Elimina contacto (valida pertenencia) |

### Alertas — `/api/alerts`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/alerts` | Crea alerta. **Idempotente** vía `clientGeneratedId`. Body: `canalActivacion` (`boton_pulsado` \| `voz` \| `boton_fisico`), `clientGeneratedId` (UUID obligatorio), opcionales `ubicacionInicial {lat, lon}`, `precisionMetros`, `fuente` (`gps` \| `celular` \| `cache`). Estado inicial: `pendiente`. Responde antes de que termine la verificación/notificación asíncrona |
| PATCH | `/api/alerts/{id}` | Actualiza estado (`estado`). Valida la máquina de estados |
| POST | `/api/alerts/{id}/location` | Registra ubicación en el historial (`alert_locations`) y actualiza `alerts.ubicacion` en la misma transacción. Solo en estados activos |
| GET | `/api/alerts/{id}/status` | Estado actual de la alerta (valida pertenencia) |
| GET | `/api/alerts` | Historial de alertas del usuario (más reciente primero) |
| POST | `/api/alerts/sms-fallback` | **Público (sin JWT).** Payload ya parseado: `userId`, `lat`, `lon`, `timestamp`, `hash` (HMAC), opcionales `clientGeneratedId`, `canalActivacion`. Rechaza hash inválido o expirado |

### Estados de alerta
`pendiente` → `activa` | `descartada` → `activa → verificando` → `verificando → escalada | atendida | descartada` → `escalada → atendida | descartada`. Cualquier otra transición se rechaza con error claro. La validación vive en `Domain/AlertStateMachine.cs`.

---

## Procesamiento asíncrono

Al crear una alerta, el controller escribe en `alerts` de forma **síncrona** y publica un `AlertCreatedEvent` en una cola en memoria (`Channel<T>`). Dos workers la consumen en background:

- **`VerificationWorker`**: ejecuta la verificación heurística (reglas documentadas en `Services/VerificationService.cs`), guarda en `verification_logs` y actualiza `nivel_prioridad_ia` y `estado`.
- **`NotificationWorker`**: envía (stub) notificaciones a todos los contactos del usuario con la ubicación disponible.

Ninguno bloquea la respuesta de `POST /api/alerts`. La cola es interna (sin infraestructura de mensajería) para esta fase.

> Nota de diseño: la máquina de estados no permite `pendiente → verificando`; si la heurística marca un posible falso positivo en una alerta recién creada, el worker la deja `activa` registrando `nivel_prioridad_ia = posible_falso_positivo` (ver comentario en `VerificationWorker.cs`).

---

## Seguridad

- **JWT**: el backend valida firma (HS256 con el JWT Secret), issuer y audiencia de Supabase en cada request. El `user_id` siempre se extrae del claim `sub` — nunca de un valor del body o la URL.
- **Autorización por recurso**: cada consulta cruza el recurso contra el `user_id` del token (los endpoints devuelven 404 si el recurso no pertenece al usuario).
- **RLS es segunda capa**: como el backend se conecta con credenciales de rol administrador (no pasa por RLS), toda la autorización real está implementada en código.
- **SMS fallback**: sin JWT a propósito (puede no haber datos móviles), pero con autenticación ligera por HMAC + anti-replay del timestamp.

---

## Documentos

- Especificación: [`Spec_Backend_App_Usuario.md`](./Spec_Backend_App_Usuario.md)