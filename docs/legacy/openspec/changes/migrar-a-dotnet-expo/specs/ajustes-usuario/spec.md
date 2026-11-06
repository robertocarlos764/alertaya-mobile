# Spec Delta

## Purpose

Guarda las preferencias de configuración de cada persona en su cuenta, de modo que
sobrevivan a una reinstalación y estén disponibles desde cualquier dispositivo donde
inicie sesión.

## ADDED Requirements

### Requirement: Persistencia asociada a la cuenta

Los ajustes SHALL almacenarse asociados a la cuenta y no únicamente en el dispositivo.
MUST estar disponibles tras reinstalar la aplicación o iniciar sesión en otro dispositivo.

#### Scenario: Reinstalación de la aplicación

- **WHEN** una persona reinstala la aplicación e inicia sesión
- **THEN** recupera los ajustes que tenía guardados antes de desinstalar

#### Scenario: Inicio de sesión en otro dispositivo

- **WHEN** una persona inicia sesión en un dispositivo distinto
- **THEN** encuentra los mismos ajustes de su cuenta

### Requirement: Valores por defecto

El sistema SHALL devolver un conjunto completo de ajustes por defecto para una cuenta que
nunca los ha modificado, sin requerir una escritura previa.

#### Scenario: Primera consulta

- **WHEN** una persona que nunca ha modificado sus ajustes los consulta
- **THEN** el sistema devuelve los valores por defecto y no un error ni una respuesta vacía

### Requirement: Actualización de ajustes

El sistema SHALL permitir modificar los ajustes de la cuenta autenticada y MUST validar
cada valor antes de guardarlo. Un valor inválido MUST NOT persistirse ni alterar los
demás ajustes.

#### Scenario: Actualización válida

- **WHEN** una persona autenticada envía ajustes con valores válidos
- **THEN** el sistema los guarda y devuelve el conjunto actualizado

#### Scenario: Intervalo fuera de rango

- **WHEN** se envía un intervalo de reenvío fuera del rango permitido
- **THEN** el sistema rechaza la operación e indica el rango válido, sin modificar ningún ajuste

#### Scenario: Palabra clave vacía con activación por voz habilitada

- **WHEN** se habilita la activación por voz sin indicar una palabra clave
- **THEN** el sistema rechaza la operación e indica que la palabra clave es obligatoria en ese caso

### Requirement: Ajustes sin comportamiento asociado

La activación por voz y la llamada automática a emergencias SHALL poder configurarse y
persistirse, pero su comportamiento queda fuera del alcance de este cambio. La aplicación
MUST indicar con claridad que aún no están operativas, para no inducir a confiar en una
función que no actuará durante una emergencia.

#### Scenario: Activación por voz habilitada

- **WHEN** una persona habilita la activación por voz
- **THEN** el ajuste se guarda y la aplicación indica de forma visible que la función todavía no está disponible

#### Scenario: Llamada automática habilitada

- **WHEN** una persona habilita la llamada automática a emergencias
- **THEN** el ajuste se guarda y la aplicación indica de forma visible que la función todavía no está disponible

#### Scenario: Alerta activada con ambos ajustes habilitados

- **WHEN** se activa una alerta con la activación por voz y la llamada automática habilitadas
- **THEN** el sistema no ejecuta ninguna de las dos y el resultado de la alerta es el mismo que si estuvieran deshabilitadas
