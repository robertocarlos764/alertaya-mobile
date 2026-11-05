# Roadmap: AlertaYA

## Overview

AlertaYA se construye en rebanadas verticales (móvil + API + BD, y panel web cuando aplica), cada una demostrable de punta a punta. Las Fases 1 a 4 son el alcance del demo de avance del jueves 2026-10-15: primero el SOS real (botón → cuenta regresiva → SMS real con link de seguimiento), con los cimientos de BD y API incluidos dentro de esa misma rebanada; después la protección manos libres con agitar y el tracking en segundo plano; luego el resto de pantallas del diseño (historial y ajustes); y por último el panel policial con una IA mínima. Las Fases 5 a 7 llegan después del demo: cierre de la alerta con PIN, llamada al 123 y escalamiento; cuenta verificada y avisos por todos los canales; y los activadores restantes (botón de encendido, palabra clave) junto con el clip de audio y la IA sobre el audio. En todas las fases rige el Core Value: nunca se informa un envío que no ocurrió ni una ubicación inventada.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: SOS de punta a punta** - Botón SOS → cuenta regresiva → SMS real con link de seguimiento y estado de entrega honesto (incluye cimientos de BD y API) — demo
- [ ] **Phase 2: Protección manos libres y tracking en segundo plano** - Onboarding con permisos reales, servicio en primer plano, activador agitar y ubicación con pantalla apagada — demo
- [ ] **Phase 3: Historial, ajustes y modo silencioso** - Historial con entrega real y trayecto, ajustes guardados en el servidor, modo silencioso — demo
- [ ] **Phase 4: Panel policial mínimo e IA mínima** - Oficiales ven y atienden las alertas de su CAI por prioridad, con resumen IA y marca de posible falsa alarma — demo
- [ ] **Phase 5: Cierre de la alerta y escalamiento** - Cancelación con PIN avisando a contactos, llamada opcional al 123 y escalamiento al supervisor
- [ ] **Phase 6: Cuenta verificada y avisos por todos los canales** - OTP de celular, recuperación de contraseña, SMS al designar contacto y push a contactos con la app
- [ ] **Phase 7: Activadores por botón y voz, audio e IA sobre el audio** - Botón de encendido, palabra clave, clip de audio cifrado con consentimiento y clasificación IA del audio

## Phase Details

### Phase 1: SOS de punta a punta

**Goal**: Una persona con sesión iniciada pulsa SOS y, tras la cuenta regresiva, sus contactos reciben un SMS real con un link donde ven su ubicación real; la app solo muestra estados de entrega confirmados
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, CONT-01, SOS-01, SOS-02, SOS-03, SOS-04, NOTI-01, NOTI-03, NOTI-04, UBIC-02
**Success Criteria** (what must be TRUE):

  1. El usuario se registra con correo y contraseña, inicia sesión y, al cerrar y reabrir la app, sigue dentro; desde la pantalla de contactos agrega, edita y elimina contactos (nombre, teléfono, relación), todo con el diseño oscuro/rojo del legacy
  2. El usuario pulsa SOS, ve y siente la cuenta regresiva con vibración y puede cancelarla antes de que termine; si no la cancela, cada contacto recibe en un celular real colombiano un SMS con el nombre de la persona y el link de seguimiento
  3. El contacto abre el link sin iniciar sesión y ve un mapa con la última ubicación real, su precisión y su antigüedad, y el estado de la alerta; con el GPS apagado la alerta se crea igual con "ubicación pendiente" y nunca aparece una coordenada sustituta
  4. La pantalla de alerta activa muestra por contacto el estado real (en cola, enviado, entregado, fallido); "entregado" aparece solo tras la confirmación de Twilio, y con el worker apagado la app no dice "enviado"
  5. Si el SOS se dispara sin red o el API se reinicia a mitad del envío, al volver la conexión la alerta y sus SMS se completan sin duplicarse (una sola alerta en el servidor, un SMS por contacto)

**Plans:** 5/16 plans executed (10 waves)

Plans:
**Wave 1**

- [ ] 01-01-PLAN.md — API público por ngrok (dominio fijo), spike de Twilio en Colombia y herramientas de administrador, sin Docker (D-22) (W1)
- [x] 01-02-PLAN.md — Decisiones del día 1: applicationId, destino de sms-fallback y legitimidad de paquetes (W1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Esquema versionado: baseline desde inspección de solo lectura + inventario del catálogo + migración única de la fase con pruebas pgTAP y su runner, sin tocar el remoto (W2)
- [x] 01-04-PLAN.md — API en 4 proyectos Clean Architecture + máquina de estados con `finalizada` (W2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-05-PLAN.md — [BLOCKING] Ensayo con rollback, push del esquema y política de Auth al remoto con confirmación de Roberto (W3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-06-PLAN.md — SOS en el servidor: alerta + enlace + entregas en una transacción, estado por contacto, ProblemDetails, contactos endurecidos, OpenAPI; integración contra el remoto (W4)
- [ ] 01-11-PLAN.md — App: base Expo Router, development build y sesión (login/registro) (W4)

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 01-07-PLAN.md — SMS real por Twilio con outbox durable, texto GSM-7 y 2 reintentos (W5)
- [ ] 01-12-PLAN.md — App: contactos de emergencia (CRUD) con cliente tipado (W5)

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 01-08-PLAN.md — "Entregado" solo por webhook firmado de Twilio (W6)
- [ ] 01-13-PLAN.md — App: SOS (hold 2 s → cuenta regresiva → alerta local → estados reales) y sync sin red (W6)

**Wave 7** *(blocked on Wave 6 completion)*

- [ ] 01-09-PLAN.md — Link público por token, ubicación con hora del fix y "Estoy a salvo" en el servidor (W7)

**Wave 8** *(blocked on Wave 7 completion)*

- [ ] 01-10-PLAN.md — Página pública /t/[token] en Vercel con mapa y todos los estados (W8)
- [ ] 01-14-PLAN.md — App: alerta activa completa, "Estoy a salvo" y reapertura (W8)

**Wave 9** *(blocked on Wave 8 completion)*

- [ ] 01-15-PLAN.md — App: ubicación en primer plano, mini mapa y tarjeta de ubicación (W9)

**Wave 10** *(blocked on Wave 9 completion)*

- [ ] 01-16-PLAN.md — APK release para la demo y recorrido de aceptación de la fase (W10)

**UI hint**: yes
**Spike (día 1)**: Twilio en Colombia — número/remitente, entrega en Claro, Movistar y Tigo, webhook de estado (DLR) firmado, costo por segmento y texto del SMS
**Cimientos incluidos**: baseline del esquema escrito desde la inspección de solo lectura del remoto (sin Docker, D-22) + migraciones versionadas como fuente de verdad (entregas por contacto, outbox, token de seguimiento, índices de FKs, policies de `alerts` con `(select auth.uid())`), aplicadas al remoto solo con confirmación de Roberto; refactor incremental de `apps/api` a 4 proyectos Clean Architecture solo en el corte alerta/entregas; outbox transaccional; ProblemDetails; `openapi.json` exportado y cliente tipado en `apps/mobile`; tests de la máquina de estados de alerta; development build Android y shell con tema y navegación

### Phase 2: Protección manos libres y tracking en segundo plano

**Goal**: Con la protección activada, agitar el teléfono con la app cerrada y la pantalla bloqueada dispara el mismo SOS de la Fase 1, y la ubicación sigue llegando al link mientras la alerta está activa
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUTH-05, AUTH-06, ACTV-01, ACTV-02, ACTV-05, UBIC-01
**Success Criteria** (what must be TRUE):

  1. El onboarding muestra una divulgación antes de cada permiso (ubicación siempre, micrófono, notificaciones, llamadas, exclusión de optimización de batería), los solicita de verdad y refleja lo que Android concedió; la pantalla de inicio muestra protección activa / degradada / inactiva y cambia si el usuario revoca un permiso desde los ajustes del sistema
  2. El usuario activa la protección y aparece la notificación persistente del servicio en primer plano; al desactivarla desaparece, y el estado de protección lo refleja
  3. Con la app cerrada desde Recientes y la pantalla bloqueada, agitar con el patrón definido inicia la cuenta regresiva con vibración y, si no se cancela, crea la alerta y envía los SMS; caminar, correr o ir en bus con la sensibilidad por defecto no la dispara, y la sensibilidad se puede ajustar
  4. Horas después de la última vez que se abrió la app (token de acceso vencido), agitar sigue creando la alerta y enviando los SMS
  5. Durante una alerta activa con la pantalla apagada y la app cerrada, el link de seguimiento muestra la ubicación moviéndose con su antigüedad real

**Plans**: TBD
**UI hint**: yes
**Spike (día 1)**: Headless JS desde proceso frío y FGS `location` iniciada desde segundo plano en dispositivos físicos (al menos Samsung y Xiaomi o Motorola); el resultado decide cuánto de la cadena crítica (detección → cuenta regresiva → disparo) queda en Kotlin sin depender de JS

### Phase 3: Historial, ajustes y modo silencioso

**Goal**: El usuario completa el recorrido de todas las pantallas del diseño: consulta qué pasó realmente con cada alerta y ajusta cómo funciona su protección, con ajustes que viven en su cuenta
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: HIST-01, HIST-02, UBIC-03, SOS-06
**Success Criteria** (what must be TRUE):

  1. El historial lista cada alerta con fecha, activador usado (botón o agitar) y el estado final real de entrega por contacto
  2. Al abrir una alerta del historial, el usuario ve en un mapa el trayecto recorrido durante la alerta, con precisión y antigüedad de los puntos
  3. El usuario cambia la ventana de confirmación, el modo silencioso, la sensibilidad de agitar y su PIN; al iniciar sesión en otro teléfono los ajustes siguen iguales, y el PIN no aparece en texto plano ni en la BD ni en los logs
  4. Con el modo silencioso activado, la cuenta regresiva y la alerta corren sin sonido ni pantalla visible, solo con la vibración discreta configurada, tanto desde el botón como desde agitar

**Plans**: TBD
**UI hint**: yes

### Phase 4: Panel policial mínimo e IA mínima

**Goal**: Un oficial ve en un panel web las alertas activas de su CAI ordenadas por prioridad, con un resumen generado por IA, y las atiende o descarta dejando registro
**Mode:** mvp
**Depends on**: Phase 1 (independiente de las Fases 2 y 3; puede ir en paralelo si hace falta para llegar al demo)
**Requirements**: PANEL-01, PANEL-02, PANEL-03, IA-03, IA-04
**Success Criteria** (what must be TRUE):

  1. Un oficial inicia sesión en el panel web y solo ve las alertas de su CAI; un oficial de otro CAI no las ve, y las pruebas de RLS lo confirman
  2. Al dispararse un SOS desde el teléfono, la alerta aparece en el mapa y en la lista del panel sin recargar, ordenada por prioridad, y su punto se mueve con el tracking
  3. El oficial abre el detalle (trayecto, datos de la persona, resumen etiquetado "generado por IA" a partir del activador, el movimiento y la ubicación) y la atiende o descarta; la decisión queda registrada con oficial y hora, y desde ese momento el teléfono deja de enviar ubicación y el link deja de mostrar ubicación nueva
  4. Una alerta con señales de disparo accidental aparece marcada "posible falsa alarma" pero sigue visible en la lista y el mapa; si la IA falla o tarda, la alerta aparece igual con prioridad base y sin resumen

**Plans**: TBD
**UI hint**: yes

### Phase 5: Cierre de la alerta y escalamiento

**Goal**: Toda alerta tiene un final controlado: la persona puede cancelarla con su PIN avisando a sus contactos, puede pedir que se marque el 123, y ninguna alerta queda sin atender porque se escala al supervisor
**Mode:** mvp
**Depends on**: Phase 3, Phase 4
**Requirements**: SOS-05, EMRG-01, PANEL-04
**Success Criteria** (what must be TRUE):

  1. Durante una alerta activa el usuario ingresa su PIN y la alerta queda como falsa alarma en el historial y en el panel; cada contacto recibe un SMS de cancelación y el link muestra "alerta cancelada" sin ubicación nueva
  2. Con un PIN incorrecto la alerta sigue activa y nada se avisa como cancelado
  3. Con la llamada al 123 habilitada en ajustes, al activarse una alerta aparece una cuenta regresiva para cancelar la llamada; si no se cancela, el teléfono marca al 123; con la opción deshabilitada nunca marca
  4. Si ningún oficial acusa recibo de una alerta en X minutos, el supervisor del CAI la ve escalada en el panel y el escalamiento queda registrado

**Plans**: TBD
**UI hint**: yes
**Spike (día 1)**: iniciar la llamada al 123 cuando la alerta viene de un activador en segundo plano en Android 14+

### Phase 6: Cuenta verificada y avisos por todos los canales

**Goal**: La identidad de quien alerta es confiable y los contactos se enteran por todos los canales: celular verificado, recuperación de contraseña, aviso al ser designado contacto y push para quienes tienen la app
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUTH-03, AUTH-04, CONT-02, NOTI-02
**Success Criteria** (what must be TRUE):

  1. Al registrarse, el usuario recibe un código OTP por SMS y debe ingresarlo para verificar su celular; los reintentos y reenvíos tienen límite
  2. El usuario que olvidó su contraseña recibe un enlace en su correo y con él define una nueva
  3. Al agregar un contacto, este recibe un SMS que le informa que fue designado contacto de emergencia de esa persona
  4. Un contacto que también tiene AlertaYA recibe una notificación push al dispararse la alerta, además del SMS, y la pantalla de alerta activa muestra el estado real de ese push

**Plans**: TBD
**UI hint**: yes

### Phase 7: Activadores por botón y voz, audio e IA sobre el audio

**Goal**: El usuario también puede pedir ayuda presionando el botón de encendido o diciendo su palabra clave, y la alerta lleva un clip de audio que la IA transcribe y usa para clasificar el peligro
**Mode:** mvp
**Depends on**: Phase 2, Phase 4
**Requirements**: ACTV-03, ACTV-04, IA-01, IA-02
**Success Criteria** (what must be TRUE):

  1. Con la protección activa y la pantalla bloqueada, presionar el botón de encendido varias veces seguidas inicia la cuenta regresiva del SOS
  2. Con la protección armada desde la app abierta, decir la palabra clave configurada inicia la cuenta regresiva; el reconocimiento ocurre en el teléfono y ningún audio sale del dispositivo por esta función
  3. Si el usuario dio consentimiento explícito, al activarse la alerta se graba un clip de 10 a 30 s que se sube cifrado a almacenamiento privado; sin consentimiento no se graba nada
  4. El oficial ve en el detalle la transcripción, la clasificación de peligro y la prioridad derivada del audio, y el resumen IA la incorpora; si la transcripción o la clasificación fallan o tardan, la alerta conserva prioridad base o alta

**Plans**: TBD
**UI hint**: yes
**Spike (día 1)**: FGS `microphone` en Android 14+ (restricción de inicio desde segundo plano); motor de palabra clave en el dispositivo para español colombiano y su consumo de batería; STT de servidor para español colombiano (latencia y costo con audios de prueba)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

Fases 1 a 4: alcance del demo del 2026-10-15. Fases 5 a 7: después del demo.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. SOS de punta a punta | 5/16 | In Progress|  |
| 2. Protección manos libres y tracking en segundo plano | 0/TBD | Not started | - |
| 3. Historial, ajustes y modo silencioso | 0/TBD | Not started | - |
| 4. Panel policial mínimo e IA mínima | 0/TBD | Not started | - |
| 5. Cierre de la alerta y escalamiento | 0/TBD | Not started | - |
| 6. Cuenta verificada y avisos por todos los canales | 0/TBD | Not started | - |
| 7. Activadores por botón y voz, audio e IA sobre el audio | 0/TBD | Not started | - |
