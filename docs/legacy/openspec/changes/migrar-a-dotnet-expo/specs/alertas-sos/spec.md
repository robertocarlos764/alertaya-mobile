# Spec Delta

## Purpose

Gobierna la activación de una alerta de emergencia, su ciclo de vida y el historial
consultable. Es el camino crítico del producto: lo que ocurre cuando alguien pide ayuda.

## ADDED Requirements

### Requirement: Activación de la alerta SOS

El sistema SHALL registrar una alerta cuando la persona la active, asociada a su cuenta,
con la ubicación capturada y estado inicial `active`. El servidor MUST resolver la
identidad desde el token y MUST determinar por sí mismo la lista de destinatarios a
partir de los contactos de esa cuenta. El cliente MUST NOT poder indicar a quién notificar
ni con qué contenido.

#### Scenario: Activación con contactos registrados

- **WHEN** una persona autenticada activa el SOS y tiene contactos registrados
- **THEN** el sistema crea la alerta en estado `active`, registra un destinatario pendiente por cada contacto y devuelve el identificador de la alerta

#### Scenario: Activación sin contactos registrados

- **WHEN** una persona sin contactos registrados activa el SOS
- **THEN** el sistema crea igualmente la alerta para dejar constancia del evento, sin destinatarios, e informa que no se notificó a nadie

#### Scenario: El cliente intenta imponer destinatarios

- **WHEN** una petición de activación incluye una lista de destinatarios
- **THEN** el sistema la ignora y usa exclusivamente los contactos asociados a la cuenta autenticada

### Requirement: Respuesta inmediata a la activación

La activación SHALL confirmarse a quien la solicita sin esperar a que se completen los
envíos a los destinatarios. El tiempo de respuesta MUST NOT depender de la cantidad de
contactos ni de la latencia del proveedor de mensajería.

#### Scenario: Confirmación antes del envío

- **WHEN** una persona activa el SOS
- **THEN** el sistema confirma la creación de la alerta de inmediato y procesa los envíos por separado

#### Scenario: Proveedor de mensajería degradado

- **WHEN** el proveedor de mensajería responde con lentitud o no está disponible
- **THEN** la activación se confirma igual y la alerta queda registrada, con los envíos pendientes o fallidos según corresponda

### Requirement: Ciclo de vida del estado

Una alerta SHALL tener exactamente uno de estos estados: `active`, `completed` o
`cancelled`. Solo una alerta en estado `active` MUST poder cambiar de estado. Una alerta
ya finalizada MUST NOT admitir cambios posteriores.

#### Scenario: Finalización de una alerta activa

- **WHEN** la persona finaliza una alerta suya en estado `active`
- **THEN** el sistema la marca como `completed` y registra el instante de cierre

#### Scenario: Cancelación de una alerta activa

- **WHEN** la persona cancela una alerta suya en estado `active`
- **THEN** el sistema la marca como `cancelled` y registra el instante de cierre

#### Scenario: Cambio sobre una alerta ya finalizada

- **WHEN** se intenta cambiar el estado de una alerta que ya está `completed` o `cancelled`
- **THEN** el sistema rechaza la operación y el estado permanece intacto

#### Scenario: Cambio sobre una alerta ajena

- **WHEN** una persona intenta cambiar el estado de una alerta de otra cuenta
- **THEN** el sistema rechaza la operación y no expone ningún dato de esa alerta

### Requirement: Duración derivada

La duración de una alerta SHALL calcularse como la diferencia entre su instante de cierre
y su instante de inicio. El sistema MUST NOT almacenarla como valor independiente, para
que no pueda contradecir a las marcas de tiempo.

#### Scenario: Duración de una alerta finalizada

- **WHEN** se consulta una alerta ya finalizada
- **THEN** su duración corresponde exactamente al intervalo entre el inicio y el cierre registrados

#### Scenario: Duración de una alerta activa

- **WHEN** se consulta una alerta que sigue en estado `active`
- **THEN** el sistema no reporta una duración final, porque la alerta aún no ha terminado

### Requirement: Historial de alertas

El sistema SHALL devolver únicamente las alertas de la persona autenticada, ordenadas de
más reciente a más antigua y paginadas.

#### Scenario: Consulta del historial

- **WHEN** una persona autenticada consulta su historial
- **THEN** el sistema devuelve sus alertas de la más reciente a la más antigua

#### Scenario: Historial vacío

- **WHEN** una persona sin alertas consulta su historial
- **THEN** el sistema devuelve una lista vacía y no un error

### Requirement: Textos de presentación fuera del almacenamiento

Los textos que se muestran al describir una alerta SHALL derivarse en el momento de
mostrarlos, a partir del tipo, el estado y el resultado real de los envíos. El sistema
MUST NOT persistir cadenas de interfaz junto a la alerta.

#### Scenario: Descripción de una alerta

- **WHEN** la aplicación muestra una alerta del historial
- **THEN** su descripción se construye a partir de los datos de la alerta y refleja el resultado real de los envíos
