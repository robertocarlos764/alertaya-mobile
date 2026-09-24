# Especificación de Backend — App SOS Barranquilla (App del ciudadano)

*Este documento contiene todo lo necesario para construir el backend desde cero. Está escrito para ser entregado directamente a una herramienta de codificación con IA (opencode). No asumas nada que no esté escrito aquí — si algo no está definido, pregunta antes de decidir por tu cuenta.*

---

## 1. Alcance de esta fase

Construir **solo el backend de la app del ciudadano** (no el panel del CAI ni el de oficiales — eso es una fase posterior). Esto significa que los endpoints y la lógica deben cubrir: registro/perfil, contactos de emergencia, creación y seguimiento de alertas, y envío de ubicación en vivo.

**Muy importante — esta es una app móvil**, con las siguientes implicaciones de diseño que aplican a TODO el backend:

- Conectividad intermitente/débil es la norma, no la excepción. Ningún endpoint crítico (sobre todo `POST /alerts`) debe depender de que todas las operaciones downstream (IA, notificaciones) terminen antes de responder al cliente.
- Todo endpoint que el cliente pueda reintentar por timeout debe ser **idempotente** (ver sección 6).
- Los tiempos de respuesta de los endpoints críticos de activación deben ser mínimos (objetivo: menos de 1-2 segundos).
- El cliente puede enviar datos parciales (ej. una alerta sin ubicación exacta aún) que se completan con llamadas posteriores.

---

## 2. Stack técnico obligatorio

- **Lenguaje**: C#, .NET (versión LTS más reciente disponible al momento de construir).
- **Framework**: ASP.NET Core Web API, usando **Controllers** (no Minimal APIs) — cada dominio de negocio en su propio controller.
- **ORM**: Entity Framework Core.
- **Driver de base de datos**: `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Soporte geoespacial**: `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite` (necesario porque varias columnas son de tipo `geography(point, 4326)`).
- **Base de datos**: PostgreSQL con extensión PostGIS, alojada en Supabase. El backend se conecta **directamente** a PostgreSQL (connection string), NO a través de la API REST de Supabase (Data API), que está desactivada intencionalmente.
- **Autenticación**: Supabase Auth emite los JWT (el login/registro ocurre desde el cliente móvil, directo contra Supabase Auth — el backend nunca recibe contraseñas). El backend debe **validar** esos JWT en cada request usando `Microsoft.AspNetCore.Authentication.JwtBearer`, extrayendo el `sub` claim como el id del usuario (`auth.uid()` equivalente).

---

## 3. Punto crítico de seguridad — leer antes de escribir cualquier código

La base de datos tiene Row Level Security (RLS) activado en todas las tablas, con políticas que restringen el acceso por `auth.uid()`. **Esas políticas de RLS protegen el acceso vía sesión de usuario (JWT de Supabase directo a la base), pero el backend se conecta con la cadena de conexión completa (rol de administrador de base de datos), que NO pasa por RLS.**

Esto significa: **toda la autorización real depende de que el código del backend la implemente explícitamente.** RLS es una segunda capa de defensa, no la única. En cada endpoint:

1. Extrae el `user_id` del JWT validado (nunca confíes en un `user_id` que venga en el body del request).
2. Filtra o valida explícitamente que el recurso solicitado pertenece a ese `user_id` antes de devolver o modificar datos.
3. Nunca construyas una consulta que dependa solo de un id recibido del cliente sin cruzarlo contra el `user_id` del token.

---

## 4. Esquema de base de datos (ya existe, no crear tablas nuevas)

Las siguientes tablas ya existen en Supabase. El backend debe mapearlas con Entity Framework Core (Code-First con `DbContext`, pero SIN generar migraciones que intenten recrear las tablas — usar `Fluent API` o `DbSet` mapeando a las tablas existentes).

### `profiles`
- `id` (uuid, PK, es el mismo id que `auth.users.id`)
- `nombre` (text, obligatorio)
- `telefono` (text, obligatorio)
- `correo` (text)
- `palabra_clave` (text, nullable — texto plano, no hash)
- `ventana_confirmacion_segundos` (integer, default 4)
- `modo_silencioso` (boolean, default false)
- `creado_en` (timestamptz)

**Regla de negocio**: `ventana_confirmacion_segundos` y `modo_silencioso` NO deben ser editables desde el endpoint normal de "editar mi perfil". Solo un rol de administrador (a definir en fase posterior) puede modificarlos. El endpoint de edición de perfil del usuario debe ignorar/rechazar estos dos campos si vienen en el body.

### `emergency_contacts`
- `id` (uuid, PK)
- `user_id` (uuid, FK a `profiles.id`)
- `nombre` (text, obligatorio)
- `telefono` (text, obligatorio)
- `relacion` (text, nullable)
- `creado_en` (timestamptz)

Todos los contactos de un usuario tienen la misma prioridad (se notifican todos a la vez, no hay orden ni escalonamiento).

### `alerts`
- `id` (uuid, PK)
- `user_id` (uuid, FK a `profiles.id`)
- `estado` (text, valores permitidos: `pendiente`, `activa`, `verificando`, `escalada`, `atendida`, `descartada`)
- `canal_activacion` (text, valores permitidos: `boton_pulsado`, `voz`, `boton_fisico`)
- `nivel_prioridad_ia` (text, nullable, valores permitidos: `critico`, `medio`, `posible_falso_positivo`)
- `ubicacion` (geography point, nullable — última ubicación conocida)
- `ubicacion_precision_metros` (numeric, nullable)
- `ubicacion_fuente` (text, nullable, valores permitidos: `gps`, `celular`, `cache`)
- `creado_en` (timestamptz)
- `actualizado_en` (timestamptz)

### `alert_locations`
- `id` (uuid, PK)
- `alert_id` (uuid, FK a `alerts.id`)
- `ubicacion` (geography point, obligatorio)
- `precision_metros` (numeric, nullable)
- `fuente` (text, valores permitidos: `gps`, `celular`, `cache`)
- `creado_en` (timestamptz)

Historial completo de ubicación durante una alerta activa. Cada actualización de ubicación crea una fila nueva aquí; además debe actualizar el campo `ubicacion` en `alerts` con el mismo valor (ver sección 6).

### `verification_logs`
- `id` (uuid, PK)
- `alert_id` (uuid, FK a `alerts.id`)
- `movimiento_score` (numeric, nullable)
- `audio_ambiente_score` (numeric, nullable)
- `consistencia_ubicacion` (boolean, nullable)
- `hora_del_dia` (time, nullable)
- `nivel_asignado` (text, nullable, valores permitidos: `critico`, `medio`, `posible_falso_positivo`)
- `creado_en` (timestamptz)

En esta fase, el motor de verificación IA puede implementarse como un servicio simple basado en reglas/heurísticas (no un modelo entrenado todavía) — ver sección 7.

---

## 5. Endpoints requeridos para esta fase

Todos los endpoints (excepto donde se indique lo contrario) requieren un JWT válido de Supabase en el header `Authorization: Bearer {token}`.

### Perfil (`ProfilesController`)
- `GET /api/profiles/me` — devuelve el perfil del usuario autenticado (a partir del `user_id` del JWT, nunca de un parámetro de ruta).
- `PATCH /api/profiles/me` — actualiza `nombre`, `telefono`, `palabra_clave`. Rechaza explícitamente cualquier intento de modificar `ventana_confirmacion_segundos` o `modo_silencioso`.

### Contactos de emergencia (`EmergencyContactsController`)
- `GET /api/emergency-contacts` — lista los contactos del usuario autenticado.
- `POST /api/emergency-contacts` — crea un contacto nuevo, asociado automáticamente al `user_id` del token.
- `PUT /api/emergency-contacts/{id}` — actualiza un contacto, validando que pertenezca al usuario autenticado.
- `DELETE /api/emergency-contacts/{id}` — elimina un contacto, validando que pertenezca al usuario autenticado.

### Alertas (`AlertsController`)
- `POST /api/alerts` — crea una alerta nueva.
  - Body mínimo: `canalActivacion`, opcionalmente `ubicacionInicial` (lat/lon), `precisionMetros`, `fuente`.
  - Debe ser idempotente (ver sección 6).
  - Debe responder rápido: la creación del registro en `alerts` es síncrona, pero cualquier disparo de verificación IA o notificación a contactos debe encolarse de forma asíncrona (ver sección 7), nunca bloquear la respuesta.
  - Estado inicial: `pendiente`.
- `PATCH /api/alerts/{id}` — actualiza el estado de una alerta (ej. cancelación durante la ventana de confirmación). Validar que la alerta pertenezca al usuario autenticado y que la transición de estado sea válida (no permitir saltos arbitrarios; ver máquina de estados en sección 8).
- `POST /api/alerts/{id}/location` — agrega una nueva ubicación al historial de una alerta activa. Inserta en `alert_locations` y actualiza `alerts.ubicacion` con el mismo valor, en la misma transacción.
- `GET /api/alerts/{id}/status` — devuelve el estado actual de la alerta, validando que pertenezca al usuario autenticado.
- `GET /api/alerts` — lista el historial de alertas del usuario autenticado.

### Fallback SMS (endpoint especial, sin JWT — ver sección 9)
- Un mecanismo de recepción de alertas vía SMS cuando falla el envío por datos móviles. Detallar en sección 9.

---

## 6. Idempotencia (obligatorio en `POST /api/alerts`)

El cliente puede reintentar la creación de una alerta si no recibió confirmación de red a tiempo (típico en conectividad pobre). Para evitar alertas duplicadas:

- El cliente debe generar un `clientGeneratedId` (UUID) en el dispositivo, único por intento real de activación, y enviarlo en el body de `POST /api/alerts`.
- El backend debe verificar si ya existe una alerta con ese `clientGeneratedId` para ese usuario antes de crear una nueva. Si existe, devolver la alerta existente (mismo código de respuesta que una creación exitosa) en vez de crear un duplicado.
- Esto implica agregar una columna `client_generated_id` (uuid, nullable, con índice único por `user_id` + `client_generated_id`) a `alerts` si no existe — si tu SQL de referencia no la incluye, créala como una migración adicional y avísalo explícitamente en tu respuesta, no la agregues en silencio.

---

## 7. Procesamiento asíncrono (verificación IA + notificaciones)

Implementar usando `BackgroundService` (incluido en ASP.NET Core) y una cola interna (puede ser `Channel<T>` de .NET para esta fase inicial — sin infraestructura externa de mensajería todavía, eso se evalúa en una fase posterior si el volumen lo justifica).

Flujo esperado:

1. `POST /api/alerts` guarda la alerta con estado `pendiente` y publica un evento interno `AlertCreated` en la cola.
2. Un worker (`VerificationWorker : BackgroundService`) consume el evento, ejecuta la verificación (ver heurística abajo), guarda el resultado en `verification_logs`, y actualiza `alerts.nivel_prioridad_ia` y `alerts.estado` a `verificando` o `activa` según corresponda.
3. Un worker separado (`NotificationWorker : BackgroundService`) consume el mismo evento (o uno derivado tras la verificación) y envía notificaciones a los `emergency_contacts` del usuario con la ubicación disponible en ese momento.
4. Ninguno de estos workers debe hacer que `POST /api/alerts` espere su resultado.

**Heurística inicial de verificación (sin modelo entrenado todavía)**: implementar como un servicio con reglas simples y explícitas, por ejemplo: si `canal_activacion = boton_fisico` o `voz`, asignar prioridad más alta por defecto; si hay inconsistencia entre `ubicacion_fuente = celular` y una `ubicacion` GPS reciente contradictoria, marcar como posible anomalía. Documentar cada regla en el código con un comentario que explique el porqué, para poder reemplazarlas después por un modelo real sin perder el razonamiento original.

---

## 8. Máquina de estados de `alerts`

Transiciones válidas (rechazar cualquier otra con un error claro, no en silencio):

```
pendiente → activa
pendiente → descartada (cancelación en ventana de confirmación)
activa → verificando
verificando → escalada
verificando → atendida
verificando → descartada
escalada → atendida
escalada → descartada
```

Implementar esta validación en un solo lugar (ej. un método `puedeTransicionar(estadoActual, estadoNuevo)`), no repetida en cada controller.

---

## 9. Fallback SMS (diseño para esta fase, implementación puede quedar como stub)

Como este backend aún no tiene definido el proveedor de SMS (pendiente de decisión — no asumas uno), construir:

- Un endpoint `POST /api/alerts/sms-fallback` que reciba un payload ya parseado (el parsing crudo del SMS entrante depende del proveedor que se elija después) con un formato mínimo: `userId` (o un identificador alternativo si el usuario no puede autenticarse por este canal), `lat`, `lon`, `timestamp`, y un campo de autenticación ligera (`hash` o `token` corto) para evitar spoofing.
- Este endpoint NO debe requerir JWT (el usuario puede no tener datos móviles funcionando), pero sí debe validar el campo de autenticación ligera antes de aceptar el payload.
- Documentar en el código, con un comentario claro, que la integración real con el proveedor SMS (Twilio u otro) es una decisión pendiente y este endpoint asume que el parsing ya ocurrió en una capa anterior.

---

## 10. Configuración y secretos

- La cadena de conexión a PostgreSQL, las claves de validación de JWT de Supabase, y cualquier otro secreto deben leerse desde variables de entorno o `appsettings.{Environment}.json` **excluido de control de versiones** (agregar a `.gitignore`). Nunca hardcodear credenciales en el código.
- Incluir un `appsettings.Example.json` (sin valores reales) mostrando qué variables se necesitan, para referencia.

---

## 11. Qué NO construir en esta fase

- Nada relacionado con el panel del CAI, oficiales, o despacho (`officers`, `officer_decisions`, `cais`, `officer_duty_log`) — esas tablas existen en la base de datos pero no tienen endpoints todavía; eso es la siguiente fase.
- No implementar un modelo de IA entrenado — solo la heurística basada en reglas descrita en la sección 7.
- No implementar el registro con hash-chaining para auditoría externa — eso es Prioridad 3 del roadmap general del proyecto, no de esta fase.

---

## 12. Antes de dar por terminado cualquier entregable

- Confirmar que cada endpoint que recibe o modifica datos de un usuario valida el `user_id` contra el JWT, no contra un valor del body o la URL.
- Confirmar que `POST /api/alerts` responde antes de que termine cualquier procesamiento asíncrono.
- Confirmar que las transiciones de estado inválidas son rechazadas explícitamente.
- Si algo en este documento es ambiguo o falta información para tomar una decisión (ej. proveedor SMS, formato exacto de un payload), preguntar antes de asumir — no rellenar huecos de diseño por cuenta propia.
