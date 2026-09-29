# Spec Delta

## Purpose

Obtiene la ubicación de quien activa una alerta y define cómo se comporta el sistema
cuando no puede obtenerla, de modo que nunca se transmita una posición que no
corresponde a la persona.

## ADDED Requirements

### Requirement: Solicitud real de permisos

La aplicación SHALL solicitar los permisos de ubicación al sistema operativo mediante sus
API reales. La pantalla de permisos MUST reflejar el estado que reporta el sistema
operativo y MUST NOT mostrar un estado simulado o fijo.

#### Scenario: Concesión del permiso

- **WHEN** la persona acepta el permiso de ubicación en el diálogo del sistema operativo
- **THEN** la aplicación refleja el permiso como concedido según lo que reporta el sistema operativo

#### Scenario: Denegación del permiso

- **WHEN** la persona rechaza el permiso en el diálogo del sistema operativo
- **THEN** la aplicación refleja el permiso como denegado y explica qué deja de funcionar sin él

#### Scenario: Denegación permanente

- **WHEN** el permiso está denegado de forma permanente
- **THEN** la aplicación lo indica y ofrece abrir los ajustes del sistema, sin volver a mostrar un diálogo que el sistema operativo ya no presentará

#### Scenario: Estado mostrado al abrir la pantalla

- **WHEN** la persona abre la pantalla de permisos
- **THEN** cada permiso aparece con el estado real consultado al sistema operativo en ese momento

### Requirement: Ausencia de ubicación sustituta

Cuando la ubicación no pueda determinarse, el sistema SHALL tratarla como desconocida.
MUST NOT devolverse, almacenarse ni transmitirse ninguna coordenada por defecto,
aproximada o de respaldo.

#### Scenario: Permiso denegado al activar la alerta

- **WHEN** se activa una alerta y el permiso de ubicación está denegado
- **THEN** la alerta se registra con la ubicación marcada como desconocida y no con una coordenada sustituta

#### Scenario: Servicio de ubicación deshabilitado

- **WHEN** se activa una alerta y el servicio de ubicación del dispositivo está apagado
- **THEN** la alerta se registra con la ubicación marcada como desconocida

#### Scenario: Tiempo de espera agotado

- **WHEN** la obtención de la ubicación supera el tiempo máximo de espera
- **THEN** la alerta se registra con la ubicación marcada como desconocida y la activación no se bloquea

### Requirement: La ubicación no bloquea la alerta

La imposibilidad de obtener la ubicación SHALL NOT impedir que se registre la alerta ni
que se notifique a los contactos.

#### Scenario: Alerta sin ubicación

- **WHEN** se activa una alerta y la ubicación no puede determinarse
- **THEN** la alerta se registra y los contactos reciben la notificación indicando que la ubicación no está disponible

### Requirement: Visibilidad del estado de la ubicación

La aplicación SHALL indicar a la persona si su ubicación está siendo compartida en una
alerta activa.

#### Scenario: Alerta activa con ubicación conocida

- **WHEN** hay una alerta activa y la ubicación se obtuvo correctamente
- **THEN** la aplicación indica que la ubicación se está compartiendo

#### Scenario: Alerta activa sin ubicación

- **WHEN** hay una alerta activa y la ubicación no pudo obtenerse
- **THEN** la aplicación advierte de forma visible que los contactos no recibieron la ubicación

### Requirement: Enlace de ubicación derivado

El enlace al mapa SHALL construirse a partir de las coordenadas en el momento de usarlo.
El sistema MUST NOT almacenarlo como dato independiente junto a la alerta.

#### Scenario: Apertura del mapa desde una alerta

- **WHEN** se abre la ubicación de una alerta con coordenadas conocidas
- **THEN** el enlace se construye a partir de esas coordenadas
