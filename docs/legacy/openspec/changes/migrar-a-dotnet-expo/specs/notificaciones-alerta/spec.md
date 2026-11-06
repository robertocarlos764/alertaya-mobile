# Spec Delta

## Purpose

Garantiza que los contactos de confianza reciban realmente el aviso cuando se activa una
alerta, y que el resultado de cada envío quede registrado de forma auditable en lugar de
darse por supuesto.

## ADDED Requirements

### Requirement: Envío desde el servidor

El sistema SHALL realizar el envío de las notificaciones desde el servidor. La aplicación
móvil MUST NOT ser responsable de enviarlas, porque las plataformas móviles no permiten
el envío programático y silencioso de mensajes de texto.

#### Scenario: Envío tras una activación

- **WHEN** se registra una alerta con destinatarios pendientes
- **THEN** el servidor envía el mensaje a cada destinatario sin requerir ninguna acción adicional de la persona

### Requirement: Contenido del mensaje

El mensaje SHALL identificar a quien pide ayuda por su nombre e incluir un enlace a su
ubicación. El contenido MUST construirse en el servidor.

#### Scenario: Mensaje con ubicación disponible

- **WHEN** se envía la notificación de una alerta con ubicación conocida
- **THEN** el mensaje incluye el nombre de quien pide ayuda y un enlace a esa ubicación

#### Scenario: Mensaje sin ubicación disponible

- **WHEN** se envía la notificación de una alerta cuya ubicación no pudo determinarse
- **THEN** el mensaje indica explícitamente que la ubicación no está disponible y MUST NOT incluir ninguna coordenada aproximada o supuesta

### Requirement: Registro del resultado por destinatario

Cada destinatario SHALL tener un estado de entrega propio: `pending`, `sent` o `failed`.
El sistema MUST registrar el identificador que devuelve el proveedor cuando el envío
tiene éxito, y el motivo del fallo cuando no lo tiene.

#### Scenario: Envío exitoso

- **WHEN** el proveedor acepta el mensaje para un destinatario
- **THEN** el sistema marca ese destinatario como `sent` y guarda el identificador devuelto por el proveedor

#### Scenario: Envío fallido

- **WHEN** el proveedor rechaza el mensaje para un destinatario
- **THEN** el sistema marca ese destinatario como `failed` y guarda el motivo del fallo

#### Scenario: Fallo parcial

- **WHEN** el envío tiene éxito para unos destinatarios y falla para otros
- **THEN** cada destinatario conserva su propio estado y la alerta refleja ambos resultados

### Requirement: Veracidad de lo informado

Lo que la aplicación muestra sobre una alerta SHALL corresponder al estado real de los
envíos. El sistema MUST NOT presentar una notificación como entregada mientras su estado
sea `pending` o `failed`.

#### Scenario: Consulta con envíos pendientes

- **WHEN** se consulta una alerta cuyos envíos aún no se han completado
- **THEN** la aplicación los presenta como pendientes y no como enviados

#### Scenario: Consulta con envíos fallidos

- **WHEN** se consulta una alerta con destinatarios en estado `failed`
- **THEN** la aplicación indica cuántos fallaron y permite distinguirlos de los entregados

### Requirement: Datos del destinatario conservados

El sistema SHALL conservar el nombre y el teléfono del contacto tal como estaban en el
momento de la alerta. Eliminar un contacto después MUST NOT alterar ni borrar el registro
histórico de las notificaciones que se le enviaron.

#### Scenario: Contacto eliminado tras una alerta

- **WHEN** se elimina un contacto que había sido notificado en una alerta anterior
- **THEN** esa alerta sigue mostrando el nombre y el teléfono que tenía el contacto cuando se le notificó

### Requirement: Reintento acotado

El sistema SHALL reintentar los envíos fallidos por causas transitorias, con un número
máximo de intentos. Un destinatario MUST NOT recibir el mismo mensaje más de una vez por
un reintento exitoso.

#### Scenario: Fallo transitorio recuperado

- **WHEN** un envío falla por una causa transitoria y un reintento posterior tiene éxito
- **THEN** el destinatario queda como `sent` y recibe el mensaje una sola vez

#### Scenario: Agotamiento de reintentos

- **WHEN** se agota el número máximo de intentos para un destinatario
- **THEN** queda en estado `failed` con el motivo registrado y el sistema deja de reintentar
