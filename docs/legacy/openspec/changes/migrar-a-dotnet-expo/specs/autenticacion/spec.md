# Spec Delta

## Purpose

Permite que una persona cree su cuenta, inicie sesión y mantenga su identidad
verificada entre arranques de la aplicación, de modo que sus alertas y contactos
queden asociados solo a ella.

## ADDED Requirements

### Requirement: Registro de cuenta

El sistema SHALL permitir crear una cuenta con correo electrónico y contraseña.
El correo MUST ser único. La contraseña MUST tener al menos 8 caracteres. El sistema
MUST almacenar la contraseña únicamente como hash y nunca en texto plano.

#### Scenario: Registro exitoso

- **WHEN** una persona envía un correo no registrado y una contraseña válida
- **THEN** el sistema crea la cuenta, crea su perfil asociado y devuelve un token de acceso

#### Scenario: Correo ya registrado

- **WHEN** una persona envía un correo que ya existe
- **THEN** el sistema rechaza la operación e indica que el correo ya está en uso, sin revelar ningún otro dato de la cuenta existente

#### Scenario: Contraseña demasiado corta

- **WHEN** una persona envía una contraseña de menos de 8 caracteres
- **THEN** el sistema rechaza la operación e indica el requisito de longitud

### Requirement: Inicio de sesión

El sistema SHALL emitir un token de acceso cuando las credenciales sean correctas.
Ante credenciales inválidas, el mensaje de error MUST ser idéntico tanto si el correo
no existe como si la contraseña es incorrecta, para no revelar qué correos están
registrados.

#### Scenario: Credenciales correctas

- **WHEN** una persona envía su correo y contraseña correctos
- **THEN** el sistema devuelve un token de acceso y la identificación de su cuenta

#### Scenario: Contraseña incorrecta

- **WHEN** una persona envía un correo existente con una contraseña incorrecta
- **THEN** el sistema rechaza el acceso con un error genérico de credenciales inválidas

#### Scenario: Correo inexistente

- **WHEN** una persona envía un correo que no está registrado
- **THEN** el sistema rechaza el acceso con el mismo error genérico del escenario anterior

### Requirement: Sesión persistente

La aplicación SHALL conservar la sesión entre arranques mientras el token siga vigente,
sin pedir credenciales de nuevo. El token MUST almacenarse en el almacenamiento seguro
del dispositivo y nunca en almacenamiento en texto plano.

#### Scenario: Reapertura con sesión vigente

- **WHEN** la persona abre la aplicación y su token sigue vigente
- **THEN** accede directamente a la pantalla principal sin pasar por el inicio de sesión

#### Scenario: Reapertura con sesión expirada

- **WHEN** la persona abre la aplicación y su token ya expiró
- **THEN** el sistema la envía a la pantalla de inicio de sesión y descarta el token almacenado

### Requirement: Cierre de sesión

El sistema SHALL permitir cerrar la sesión. Al hacerlo, el token almacenado en el
dispositivo MUST eliminarse.

#### Scenario: Cierre de sesión

- **WHEN** la persona cierra la sesión
- **THEN** el sistema elimina el token del dispositivo y la envía a la pantalla de inicio de sesión

### Requirement: Aislamiento de datos por cuenta

Toda petición a recursos de una cuenta SHALL exigir un token válido, y el sistema MUST
resolver la identidad del solicitante desde ese token, nunca desde un identificador
enviado por el cliente.

#### Scenario: Petición sin token

- **WHEN** se solicita un recurso protegido sin token
- **THEN** el sistema rechaza la petición como no autorizada

#### Scenario: Intento de acceso a datos ajenos

- **WHEN** una persona autenticada solicita un recurso que pertenece a otra cuenta
- **THEN** el sistema rechaza la petición y no expone ningún dato del recurso
