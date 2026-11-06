# Design

## Context

Ver `proposal.md` — Why para la motivación.

Restricciones que condicionan el enfoque:

- **El envío de SMS no puede ocurrir en el cliente.** iOS prohíbe el envío programático;
  Android lo restringe tras el permiso `SEND_SMS`, que Google Play limita con dureza.
  `expo-sms` solo abre el compositor nativo y exige que la persona pulse enviar. Esto
  obliga a introducir un servidor propio, que el sistema actual no tiene.
- **El dominio actual es portable.** `lib/core/domain/` no depende de Flutter ni de
  Firebase: 4 entidades, 2 enums, 4 contratos de repositorio y 7 casos de uso que se
  traducen a C# casi línea por línea. Es el activo real de la migración.
- **Los datos actuales son de prueba.** Confirmado con el equipo. No hay ETL ni migración
  de cuentas que diseñar.
- **El modelo de datos es relacional y Firestore lo obliga a fingir lo contrario.**
  `notifiedContactIds` es un arreglo de identificadores sin integridad referencial. El
  índice desplegado en producción referencia un campo `UserId` que ningún documento tiene,
  deriva que nada detecta porque Firestore no valida esquemas.
- **El equipo sabe C#** y adopta TypeScript para el móvil.

## Goals / Non-Goals

**Goals:**

- Que el resultado de cada notificación sea un hecho registrado y no una suposición.
- Que el dominio quede aislado de infraestructura y cubierto por pruebas, especialmente
  el camino del SOS, hoy sin ninguna cobertura.
- Que el contrato entre móvil y servidor se verifique automáticamente y no de palabra.
- Que la ausencia de ubicación sea un estado explícito y nunca una coordenada inventada.

**Non-Goals:**

- Activación por voz y llamada automática a emergencias: se persisten los ajustes, no el
  comportamiento.
- Notificaciones push. El canal de esta entrega es SMS.
- Seguimiento continuo de ubicación durante una alerta activa. Se captura una posición
  puntual en la activación.
- Paridad visual exacta con la aplicación Flutter. Se conservan los tokens de diseño
  (`#0D0D0D`, `#1A1A1A`, `#E8212B`, `#2A2A2A`, `#5A5A5A`), no los componentes.

## Decisions

### Dos repositorios con contrato generado

`alertaya-api` y `alertaya-mobile` por separado, con el móvil generando su cliente
TypeScript desde el `openapi.json` que publica la API.

*Por qué:* al ser lenguajes distintos, un monorepo no permitiría compartir tipos, que es
su ventaja principal. La generación desde OpenAPI recupera esa garantía por otra vía: un
cambio incompatible en un DTO rompe la compilación del móvil en CI, no en producción.

*Alternativa descartada:* monorepo con paquete de tipos compartido. Inviable entre C# y
TypeScript sin una capa de generación de todos modos.

### Cuatro proyectos con dependencias hacia adentro

`Domain` ← `Application` ← `Infrastructure` ← `Api`, con `Domain` sin referencias a nada.

*Por qué:* es lo que hace que el patrón sea real y no carpetas con nombres sugerentes. Si
`Domain` no compila contra EF Core, la regla se verifica sola en cada build. El dominio
actual ya tiene esta forma; se conserva en lugar de rediseñarse.

*Alternativa descartada:* capas por característica. Mejor para equipos grandes, peor para
portar un dominio que ya está organizado por capas.

### PostgreSQL con campos derivados fuera del almacenamiento

```sql
create type alert_status    as enum ('active','completed','cancelled');
create type alert_type      as enum ('standard','critical');
create type delivery_status as enum ('pending','sent','failed');

create table profiles (
  id          uuid primary key references auth_users(id) on delete cascade,
  name        text not null,
  phone       text not null,
  created_at  timestamptz not null default now()
);

create table contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  phone       text not null,
  color_hex   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);
create index on contacts(user_id, created_at);

create table alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  status      alert_status not null default 'active',
  type        alert_type   not null default 'standard',
  started_at  timestamptz  not null default now(),
  ended_at    timestamptz,
  lat         double precision,
  lng         double precision
);
create index on alerts(user_id, started_at desc);

create table alert_notifications (
  id            uuid primary key default gen_random_uuid(),
  alert_id      uuid not null references alerts(id) on delete cascade,
  contact_id    uuid references contacts(id) on delete set null,
  contact_name  text not null,
  contact_phone text not null,
  status        delivery_status not null default 'pending',
  provider_id   text,
  error         text,
  attempts      int not null default 0,
  sent_at       timestamptz
);
create index on alert_notifications(alert_id);
create index on alert_notifications(status) where status = 'pending';

create table user_settings (
  user_id                  uuid primary key references profiles(id) on delete cascade,
  voice_activation_enabled boolean not null default false,
  voice_keyword            text,
  police_auto_call         boolean not null default false,
  sms_interval_seconds     int     not null default 60
);
```

*Por qué `alert_notifications` es la tabla central:* es la que vuelve imposible la mentira
del sistema actual. Hoy no existe ningún lugar donde registrar si un envío ocurrió, y por
eso el historial afirma *"Alerta enviada a N contacto(s)"* sin respaldo.

*Por qué se copian `contact_name` y `contact_phone`:* un registro de emergencias debe
reflejar el estado del mundo en el instante del evento. Con `on delete set null` sobre
`contact_id`, borrar un contacto no destruye la evidencia de que fue notificado.

*Por qué desaparecen `title`, `subtitle`, `location`, `initials` y `duration`:* son
derivables. `title` y `subtitle` además guardaban texto de interfaz en español dentro de
la base, lo que bloquea la internacionalización y permite que el dato contradiga a la
realidad.

*Alternativa descartada:* conservar Firestore y añadir Cloud Functions. Menor esfuerzo
inmediato, pero mantiene la ausencia de integridad referencial y de validación de esquema.

### Respuesta a la activación desacoplada del envío

`POST /api/alerts/sos` persiste la alerta y sus destinatarios en `pending`, responde, y
procesa los envíos aparte.

*Por qué:* el tiempo de respuesta ante una emergencia no debe depender de la latencia de
un proveedor externo ni crecer con el número de contactos. El código actual recorre los
contactos esperando cada envío en serie.

*Alternativa descartada:* envío síncrono dentro de la petición. Más simple, pero acopla la
confirmación a un tercero justo en el momento más crítico.

### Twilio como proveedor de mensajería

Detrás de la interfaz `INotificationService`, que conserva la firma actual
`SendNotification(to, message)`.

*Por qué:* mantener la interfaz del dominio permite sustituir el proveedor sin tocar los
casos de uso, y deja el `MockNotificationAdapter` como implementación legítima para pruebas
en lugar de como sustituto accidental en producción.

*Alternativa descartada:* `expo-sms`, que no puede enviar sin intervención manual.

### Identidad propia con tokens

ASP.NET Core Identity emitiendo tokens de acceso, almacenados en el dispositivo mediante
almacenamiento seguro.

*Por qué:* al desaparecer Firebase, la identidad debe vivir donde vive la autorización. El
servidor resuelve la identidad desde el token y nunca desde un identificador enviado por el
cliente, que es la falla que hoy permite el acceso directo del dispositivo a la base.

*Alternativa descartada:* conservar Firebase Auth validando sus tokens en .NET. Evitaría
rehacer el alta, pero mantiene una dependencia de la plataforma que se está abandonando y
complica el despliegue.

### Expo con capas equivalentes

`src/domain`, `src/data`, `src/presentation`, con `expo-router` para navegación,
`react-native-reanimated` y `moti` para animación, `@shopify/react-native-skia` para el
botón SOS y `expo-secure-store` para el token.

*Por qué el mismo vocabulario en ambos repos:* quien entiende el backend entiende el móvil.
`src/domain` en TypeScript es un reflejo de `AlertaYA.Domain` y puede probarse igual de
barato.

*Sobre el estado:* la mayor parte es estado de servidor. Se resuelve con el cliente HTTP y
contexto de React; no se introduce una librería de estado global hasta que un caso concreto
lo justifique.

## Risks / Trade-offs

- **El SMS depende de un tercero de pago** → La interfaz `INotificationService` aísla al
  proveedor; los fallos quedan registrados por destinatario con su motivo y se reintentan
  de forma acotada.
- **Tres frentes simultáneos: lenguaje, framework y base de datos** → Se secuencia. El
  dominio en C# se porta y se prueba antes de existir base de datos o endpoints; el móvil
  arranca contra una API ya funcionando.
- **Sin cola de escritura sin conexión** → Firestore encolaba escrituras automáticamente.
  Se acepta la pérdida: sin conectividad tampoco saldría el SMS, que es lo crítico. El
  registro histórico puede reintentarse desde el cliente.
- **El costo de los mensajes escala con los contactos** → Límite de destinatarios por
  alerta y de alertas por intervalo, para acotar tanto el gasto como el abuso.
- **Una alerta sin ubicación es menos útil** → Se acepta de forma deliberada. Una
  ubicación falsa es peor que ninguna: envía a quien ayuda hacia el lugar equivocado.
- **El dominio portado podría desviarse del original** → Las specs son el contrato, no el
  código Flutter. Las pruebas se escriben contra los escenarios de las specs.

## Migration Plan

1. `AlertaYA.Domain` y `AlertaYA.Application` portados desde `lib/core/domain/`, con
   pruebas sobre los escenarios de las specs. Sin base de datos ni endpoints todavía.
2. `AlertaYA.Infrastructure`: EF Core con Npgsql, esquema y migraciones.
3. Endpoints y autenticación. Se publica `openapi.json`.
4. `alertaya-mobile`: generación del cliente y autenticación contra la API real.
5. Pantallas, en orden de dependencia: splash, autenticación, onboarding con permisos
   reales, principal, y el resto.
6. Integración de Twilio y validación del flujo SOS de punta a punta con envío real.

*Reversión:* `alertaya-legacy-flutter` permanece operativo contra Firebase durante toda la
migración. No hay corte hasta que el paso 6 esté verificado.

*Criterio de finalización:* una alerta activada desde un dispositivo real hace llegar un
SMS a un teléfono real, y el estado de entrega registrado coincide con lo ocurrido.

## Open Questions

- Proveedor de alojamiento para la API y la base de datos. No altera specs, dominio ni
  desglose de tareas.
- Si el remitente de los SMS será un número largo o un identificador alfanumérico. Afecta
  a la configuración del proveedor y a la normativa local, no al diseño.
- Política de retención del historial de alertas. Puede definirse una vez haya datos
  reales.
