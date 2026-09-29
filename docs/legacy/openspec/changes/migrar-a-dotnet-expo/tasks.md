# Tasks

## 1. Dominio en C#

- [x] 1.1 Portar los enums `AlertStatus`, `AlertType` y añadir `DeliveryStatus` en `AlertaYA.Domain`; verificar que la solución compila y que `AlertaYA.Domain.csproj` no declara ninguna referencia externa
- [x] 1.2 Portar las entidades `UserProfile` y `Contact` con validación de nombre no vacío y teléfono en formato E.164; verificar con pruebas que un teléfono mal formado es rechazado
- [x] 1.3 Portar `UserSettings` con sus valores por defecto y la regla de palabra clave obligatoria cuando la activación por voz está habilitada; verificar con las pruebas de los escenarios de `ajustes-usuario`
- [x] 1.4 Crear la entidad `Alert` con `startedAt`/`endedAt` y duración calculada, y transiciones de estado válidas solo desde `active`; verificar con pruebas que una alerta finalizada rechaza cambios posteriores
- [x] 1.5 Crear la entidad `AlertNotification` con estado por destinatario y copia de nombre y teléfono del contacto; verificar con pruebas que conserva los datos copiados
- [x] 1.6 Modelar la ubicación como valor opcional que distingue "conocida" de "desconocida", sin coordenada por defecto; verificar con pruebas que no existe ninguna ruta que devuelva un valor sustituto
- [ ] 1.7 Definir en `AlertaYA.Application` las interfaces de repositorio y de servicios (`INotificationService`, `ILocationProvider`); verificar que compilan sin referencias a infraestructura

## 2. Casos de uso

- [ ] 2.1 Implementar `ActivateSosAlertUseCase`: crea la alerta y un destinatario `pending` por contacto, resolviendo los contactos desde la cuenta; verificar con pruebas los tres escenarios de activación de `alertas-sos`
- [ ] 2.2 Implementar `UpdateAlertUseCase` con las reglas de transición de estado; verificar con pruebas el rechazo sobre alerta finalizada y sobre alerta ajena
- [ ] 2.3 Implementar `GetAlertHistoryUseCase` con orden descendente y paginación; verificar con pruebas que el historial vacío devuelve lista vacía
- [ ] 2.4 Implementar los casos de uso de contactos (alta, listado, baja); verificar con pruebas el aislamiento por cuenta
- [ ] 2.5 Implementar `SaveSettingsUseCase` y la lectura con valores por defecto; verificar con pruebas que una cuenta sin ajustes previos recibe los valores por defecto
- [ ] 2.6 Implementar el caso de uso de despacho de notificaciones con reintento acotado; verificar con pruebas de doble que un reintento exitoso no duplica el envío y que agotar intentos deja estado `failed`

## 3. Persistencia

- [ ] 3.1 Añadir EF Core y Npgsql a `AlertaYA.Infrastructure`; verificar que `dotnet build` sigue en cero errores y que `AlertaYA.Domain` no los referencia
- [ ] 3.2 Crear `AppDbContext` con el mapeo de las tablas y los tipos enum de PostgreSQL definidos en el diseño; verificar que la migración inicial se genera sin errores
- [ ] 3.3 Aplicar la migración contra una base local y verificar que las claves foráneas y el `on delete set null` de `alert_notifications.contact_id` se comportan como especifica `notificaciones-alerta`
- [ ] 3.4 Implementar los repositorios contra EF Core; verificar con pruebas de integración sobre base real que cumplen los mismos escenarios que las pruebas de dominio
- [ ] 3.5 Confirmar que ningún campo derivado (`title`, `subtitle`, `location`, `initials`, `duration`) existe como columna; verificar inspeccionando el esquema aplicado

## 4. API y autenticación

- [ ] 4.1 Configurar ASP.NET Core Identity con emisión de tokens de acceso; verificar registro e inicio de sesión con peticiones reales
- [ ] 4.2 Implementar los endpoints de autenticación y verificar que el error de credenciales inválidas es idéntico para correo inexistente y contraseña incorrecta
- [ ] 4.3 Añadir el middleware que resuelve la identidad desde el token; verificar que una petición sin token y otra con token de cuenta ajena son rechazadas
- [ ] 4.4 Implementar los endpoints de contactos, perfil y ajustes; verificar el aislamiento por cuenta con dos cuentas distintas
- [ ] 4.5 Implementar `POST /api/alerts/sos` persistiendo alerta y destinatarios, respondiendo antes de que se completen los envíos; verificar que el tiempo de respuesta no crece con el número de contactos
- [ ] 4.6 Implementar `PATCH /api/alerts/{id}/status` y `GET /api/alerts`; verificar con pruebas de integración los escenarios de `alertas-sos`
- [ ] 4.7 Verificar que la petición de activación ignora cualquier lista de destinatarios enviada por el cliente
- [ ] 4.8 Publicar `openapi.json` y verificar que describe todos los endpoints con sus códigos de error

## 5. Notificaciones

- [ ] 5.1 Implementar `TwilioNotificationService` detrás de `INotificationService`; verificar con credenciales de prueba del proveedor que un envío alcanza un teléfono real
- [ ] 5.2 Implementar el procesamiento en segundo plano de destinatarios `pending`, registrando `provider_id` en éxito y motivo en fallo; verificar que un fallo parcial deja cada destinatario con su propio estado
- [ ] 5.3 Construir el contenido del mensaje en el servidor con nombre y enlace de ubicación; verificar que sin ubicación el mensaje lo indica y no incluye coordenada alguna
- [ ] 5.4 Aplicar límite de destinatarios por alerta y de alertas por intervalo; verificar que superarlos produce un rechazo explicado
- [ ] 5.5 Exponer el estado de entrega agregado en la consulta de una alerta; verificar que una alerta con envíos pendientes no se presenta como entregada

## 6. Móvil: base

- [ ] 6.1 Configurar `expo-router` y la estructura `src/domain`, `src/data`, `src/presentation`; verificar que la app arranca con `npx expo start`
- [ ] 6.2 Generar el cliente TypeScript desde `openapi.json` y añadir el paso a CI; verificar que un cambio incompatible en un DTO rompe la compilación del móvil
- [ ] 6.3 Portar entidades y casos de uso a `src/domain` en TypeScript puro; verificar con pruebas unitarias sin React ni peticiones de red
- [ ] 6.4 Implementar los repositorios de `src/data` sobre el cliente generado; verificar contra la API en local
- [ ] 6.5 Implementar autenticación con el token en `expo-secure-store` y sesión persistente; verificar que al reabrir con token vigente no se pide credenciales y con token expirado sí
- [ ] 6.6 Portar los tokens de diseño (`#0D0D0D`, `#1A1A1A`, `#E8212B`, `#2A2A2A`, `#5A5A5A`) y la tipografía; verificar comparando con capturas de la app Flutter

## 7. Móvil: pantallas

- [ ] 7.1 Implementar splash y enrutado según estado de sesión; verificar ambos caminos
- [ ] 7.2 Implementar inicio de sesión y registro contra la API; verificar que los errores de credenciales se muestran sin revelar si el correo existe
- [ ] 7.3 Implementar la pantalla de permisos del onboarding con solicitudes reales vía `expo-location`; verificar los cuatro escenarios de permisos de `ubicacion`, incluido el de denegación permanente
- [ ] 7.4 Implementar la captura de ubicación sin valor sustituto y con tiempo máximo de espera; verificar que con permiso denegado la alerta se registra con ubicación desconocida
- [ ] 7.5 Implementar contactos: listado, alta y baja; verificar la advertencia visible cuando la lista está vacía
- [ ] 7.6 Implementar la pantalla principal con el botón SOS animado con `@shopify/react-native-skia` y respuesta háptica; verificar en dispositivo físico
- [ ] 7.7 Implementar la pantalla de alerta activa mostrando si la ubicación se está compartiendo; verificar el caso sin ubicación
- [ ] 7.8 Implementar historial y detalle de alerta derivando los textos en la vista; verificar que muestra enviados, pendientes y fallidos por separado
- [ ] 7.9 Implementar perfil y ajustes, con aviso visible de que voz y llamada automática no están operativas; verificar los escenarios de `ajustes-usuario`

## 8. Verificación end-to-end

- [ ] 8.1 Activar una alerta desde un dispositivo físico y verificar que llega un SMS a un teléfono real con el enlace de ubicación correcto
- [ ] 8.2 Verificar que el estado de entrega registrado coincide con lo ocurrido, forzando un fallo con un número inválido entre los contactos
- [ ] 8.3 Verificar el flujo completo sin permiso de ubicación: la alerta se registra, el SMS sale, y ni el mensaje ni el registro contienen coordenadas
- [ ] 8.4 Verificar con dos cuentas que ninguna accede a alertas, contactos ni ajustes de la otra
- [ ] 8.5 Eliminar un contacto notificado en una alerta previa y verificar que el historial conserva su nombre y teléfono

## 9. Cierre

- [ ] 9.1 Confirmar que el código muerto identificado no tiene equivalente en los repos nuevos: `FirestoreAlertRepository`, `ContactRepositoryImpl`, `AssetContactDatasource`, `lib/models/`, `lib/services/contact_service.dart`
- [ ] 9.2 Confirmar que `permission_handler` no se reintrodujo como dependencia sin uso; verificar revisando `package.json`
- [ ] 9.3 Documentar en el README de cada repo cómo levantar el entorno completo; verificar siguiendo los pasos desde cero en una máquina limpia
- [ ] 9.4 Marcar `alertaya-legacy-flutter` como archivado una vez superada la verificación end-to-end
