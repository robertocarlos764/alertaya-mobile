# Proposal

## Why

La funcionalidad central de AlertaYA no existe: `MockNotificationAdapter` —el único
`NotificationService` cableado en `injection_container.dart`— solo ejecuta un `print()`.
Cuando un usuario activa el SOS, ningún contacto recibe nada, pero la app persiste
`'Alerta enviada a N contacto(s)'` en el historial. El sistema afirma un envío que nunca
ocurrió, y eso en una app de seguridad personal es peor que fallar de forma visible.

El problema no se puede resolver en el cliente: iOS prohíbe el envío programático de SMS
y Android lo restringe con el permiso `SEND_SMS`, que Google Play limita con dureza.
Hace falta un backend propio, que hoy no existe — Firebase se consume directo desde el
dispositivo, sin reglas de seguridad desplegadas ni validación de servidor.

## What Changes

- **BREAKING** Se divide el monorepo Flutter en dos repositorios: `alertaya-api`
  (.NET 10, Clean Architecture) y `alertaya-mobile` (Expo / React Native / TypeScript).
- **BREAKING** PostgreSQL reemplaza a Cloud Firestore. El modelo pasa de documentos
  anidados a tablas relacionales con claves foráneas e integridad referencial.
- **BREAKING** ASP.NET Core Identity con JWT reemplaza a Firebase Auth. Los hashes
  scrypt de Firebase no son importables; se arranca con base limpia porque los datos
  actuales de `alertaya-b95d8` son de prueba.
- El envío de notificaciones pasa al servidor vía Twilio. El cliente deja de decidir a
  quién notificar y con qué mensaje.
- Se registra el estado de entrega por destinatario (`pending` / `sent` / `failed`),
  hoy imposible de representar. El historial deja de poder mentir.
- La captura de ubicación falla de forma explícita. Se elimina el retorno silencioso a
  `(4.7110, -74.0721)` —el centro de Bogotá— cuando el permiso se deniega.
- La pantalla de permisos del onboarding solicita permisos reales. Hoy solo pinta
  tarjetas con booleanos `isGranted` cosméticos, sin invocar ninguna API del sistema.
- Los ajustes de usuario se persisten en la base de datos en vez de `SharedPreferences`,
  para que sobrevivan a una reinstalación y se sincronicen entre dispositivos.
- **BREAKING** Se retiran del modelo persistido los campos derivados: `title` y
  `subtitle` (texto de UI en español dentro de la base), `location` (URL derivable de
  lat/lng), `initials` (calculable del nombre) y `duration` (ahora `ended_at - started_at`).
- Se descarta el código muerto confirmado sin llamadores: `FirestoreAlertRepository`,
  `ContactRepositoryImpl`, `AssetContactDatasource`, `lib/models/` y
  `lib/services/contact_service.dart`.
- La activación por voz y la llamada automática a policía **quedan diferidas**. Los
  campos `voiceActivationEnabled`, `voiceKeyword` y `policeAutoCall` se migran y siguen
  siendo editables, pero sin comportamiento asociado — igual que hoy. Se documentan como
  requisito pendiente para que no se pierdan.

## Capabilities

### New Capabilities

El proyecto no tiene specs previas (`openspec list --specs` no devuelve ninguna), así que
todas las capacidades son nuevas. Cada una corresponde a un área de comportamiento
observable y a un contrato de repositorio del dominio actual.

- `autenticacion`: registro, inicio de sesión, emisión y renovación de JWT, cierre de
  sesión y persistencia de la sesión entre arranques de la app.
- `perfil-usuario`: consulta y actualización de los datos personales del usuario
  (nombre, correo, teléfono) y su creación en el alta.
- `contactos-confianza`: alta, listado y baja de los contactos que reciben las alertas.
- `alertas-sos`: activación de la alerta, ciclo de vida de su estado
  (`active` / `completed` / `cancelled`) e historial consultable.
- `notificaciones-alerta`: envío real de la notificación a cada contacto y registro
  auditable del resultado de entrega por destinatario.
- `ubicacion`: solicitud de permisos, captura de la ubicación y comportamiento explícito
  ante denegación o servicio deshabilitado.
- `ajustes-usuario`: lectura y escritura de las preferencias del usuario, incluidos los
  campos cuyo comportamiento queda diferido.

### Modified Capabilities

Ninguna. No existen specs previas que modificar.

## Impact

**Repositorios**

- `alertaya-api` (nuevo, privado): `AlertaYA.Domain`, `AlertaYA.Application`,
  `AlertaYA.Infrastructure`, `AlertaYA.Api`, `AlertaYA.Domain.Tests`.
- `alertaya-mobile` (nuevo, privado): capas `domain`, `data` y `presentation`.
- `alertaya-legacy-flutter`: queda como referencia histórica, sin desarrollo activo.

**Contrato entre repos**

La API publica `openapi.json` y el móvil genera su cliente TypeScript desde ahí. El
contrato se verifica en CI en vez de acordarse de palabra.

**Dominio portado**

4 entidades (`AlertEvent`, `Contact`, `UserProfile`, `UserSettings`), 2 enums
(`AlertStatus`, `AlertType`), 4 contratos de repositorio con 12 operaciones y 7 casos de
uso. Se añade la entidad `AlertNotification` y el enum `DeliveryStatus`, que no tienen
equivalente en el modelo actual.

**Dependencias**

- Entran: PostgreSQL, EF Core con Npgsql, Twilio, `expo-location`, `expo-task-manager`.
- Salen: `cloud_firestore`, `firebase_auth`, `firebase_core`, `shared_preferences`,
  `geolocator`, `get`, y `permission_handler` (declarada en `pubspec.yaml` pero sin uso
  en todo `lib/`).

**Cobertura de pruebas**

Hoy existe un único archivo de test (`test/widget_test.dart`, 30 líneas, la plantilla por
defecto). CodeGraph reporta *no tests found within 3 caller hops* para los cuatro
ViewModels: el camino del SOS no tiene ninguna cobertura. El dominio portado a C# debe
llegar con pruebas.

**Riesgo principal**

El flujo SOS es el camino crítico de una app de seguridad y hoy está roto de punta a
punta. La migración debe validarlo end-to-end —con envío real de SMS— antes de
considerarse completa.
