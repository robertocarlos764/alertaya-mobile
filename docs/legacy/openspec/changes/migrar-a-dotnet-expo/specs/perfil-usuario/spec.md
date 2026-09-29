# Spec Delta

## Purpose

Mantiene los datos personales de quien usa la aplicación —nombre, correo y teléfono—
que identifican a la persona ante sus contactos de confianza cuando se dispara una alerta.

## ADDED Requirements

### Requirement: Creación del perfil en el alta

El sistema SHALL crear un perfil asociado a la cuenta en el momento del registro.
El perfil MUST quedar vinculado a la cuenta y desaparecer si la cuenta se elimina.

#### Scenario: Perfil creado junto con la cuenta

- **WHEN** una persona completa su registro
- **THEN** el sistema crea su perfil con el correo de la cuenta y los datos suministrados

### Requirement: Consulta del perfil propio

El sistema SHALL devolver el perfil de la persona autenticada.

#### Scenario: Consulta con sesión válida

- **WHEN** una persona autenticada solicita su perfil
- **THEN** el sistema devuelve su nombre, correo y teléfono

### Requirement: Actualización del perfil

El sistema SHALL permitir modificar nombre y teléfono. El nombre MUST tener al menos
un carácter no vacío. El teléfono MUST estar en formato E.164, porque es el que se usa
para el envío de notificaciones.

#### Scenario: Actualización válida

- **WHEN** una persona autenticada envía un nombre y un teléfono válidos
- **THEN** el sistema guarda los cambios y devuelve el perfil actualizado

#### Scenario: Teléfono con formato inválido

- **WHEN** una persona envía un teléfono que no cumple el formato E.164
- **THEN** el sistema rechaza la operación e indica el formato esperado, sin modificar el perfil

#### Scenario: Nombre vacío

- **WHEN** una persona envía un nombre vacío o solo con espacios
- **THEN** el sistema rechaza la operación e indica que el nombre es obligatorio

### Requirement: Iniciales derivadas del nombre

Las iniciales que se muestran en la interfaz SHALL calcularse a partir del nombre en el
momento de mostrarlas. El sistema MUST NOT almacenarlas como dato independiente, para que
no puedan quedar desincronizadas del nombre.

#### Scenario: Iniciales tras cambiar el nombre

- **WHEN** una persona cambia su nombre
- **THEN** las iniciales mostradas reflejan el nombre nuevo sin requerir ninguna actualización adicional
