# Spec Delta

## Purpose

Gestiona la lista de personas que reciben la notificación cuando alguien activa una
alerta SOS. Sin al menos un contacto registrado, una alerta no puede avisar a nadie.

## ADDED Requirements

### Requirement: Alta de contacto

El sistema SHALL permitir añadir un contacto con nombre y teléfono. El teléfono MUST
estar en formato E.164, porque se usa directamente para el envío. El contacto MUST
quedar asociado a la cuenta que lo crea.

#### Scenario: Alta válida

- **WHEN** una persona autenticada envía un nombre y un teléfono válidos
- **THEN** el sistema crea el contacto y lo devuelve con su identificador asignado

#### Scenario: Teléfono con formato inválido

- **WHEN** se envía un teléfono que no cumple el formato E.164
- **THEN** el sistema rechaza el alta e indica el formato esperado

#### Scenario: Nombre vacío

- **WHEN** se envía un nombre vacío o solo con espacios
- **THEN** el sistema rechaza el alta e indica que el nombre es obligatorio

### Requirement: Listado de contactos propios

El sistema SHALL devolver únicamente los contactos de la persona autenticada, ordenados
de forma estable por fecha de alta ascendente.

#### Scenario: Listado con contactos

- **WHEN** una persona autenticada solicita sus contactos
- **THEN** el sistema devuelve su lista completa en orden de alta ascendente

#### Scenario: Listado vacío

- **WHEN** una persona sin contactos solicita su lista
- **THEN** el sistema devuelve una lista vacía y no un error

### Requirement: Baja de contacto

El sistema SHALL permitir eliminar un contacto propio. La baja MUST NOT alterar el
historial de alertas anteriores en las que ese contacto fue notificado.

#### Scenario: Baja de contacto propio

- **WHEN** una persona autenticada elimina un contacto suyo
- **THEN** el sistema lo retira de su lista y las alertas pasadas siguen mostrando que fue notificado

#### Scenario: Baja de contacto ajeno

- **WHEN** una persona intenta eliminar un contacto que pertenece a otra cuenta
- **THEN** el sistema rechaza la operación y el contacto permanece intacto

#### Scenario: Baja de contacto inexistente

- **WHEN** se intenta eliminar un identificador que no corresponde a ningún contacto
- **THEN** el sistema responde que el recurso no existe

### Requirement: Advertencia sin contactos registrados

La aplicación SHALL advertir de forma visible que una alerta no avisará a nadie mientras
la lista de contactos esté vacía.

#### Scenario: Pantalla principal sin contactos

- **WHEN** una persona sin contactos registrados abre la pantalla principal
- **THEN** la aplicación muestra una advertencia que indica que el SOS no notificará a nadie y ofrece añadir un contacto
