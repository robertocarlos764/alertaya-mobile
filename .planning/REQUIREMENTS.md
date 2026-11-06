# Requirements: AlertaYA

**Defined:** 2026-10-06
**Core Value:** Cuando una persona activa una alerta, alguien que puede ayudar se entera de verdad, con su ubicación real, en segundos. Nunca se informa un envío que no ocurrió ni una ubicación inventada.

## v1 Requirements

### Cuenta y Onboarding (AUTH)

- [ ] **AUTH-01**: El usuario puede registrarse con correo y contraseña
- [ ] **AUTH-02**: El usuario puede iniciar sesión y la sesión persiste al cerrar y reabrir la app
- [ ] **AUTH-03**: El usuario verifica su número de celular con un código OTP por SMS
- [ ] **AUTH-04**: El usuario puede recuperar su contraseña mediante un enlace al correo
- [ ] **AUTH-05**: El onboarding solicita y verifica de verdad los permisos (ubicación siempre, micrófono, notificaciones, llamadas, exclusión de optimización de batería), con divulgación destacada antes de cada uno
- [ ] **AUTH-06**: El usuario ve un estado de protección (activa / degradada / inactiva) que refleja los permisos y servicios reales del teléfono, y se actualiza si un permiso se revoca

### Contactos (CONT)

- [x] **CONT-01**: El usuario puede agregar, editar y eliminar contactos de emergencia (nombre, teléfono, relación)
- [ ] **CONT-02**: Al agregarse, el contacto recibe un SMS que le informa que fue designado contacto de emergencia de esa persona

### SOS núcleo (SOS)

- [x] **SOS-01**: El usuario puede disparar una alerta con el botón SOS de la app
- [ ] **SOS-02**: Toda activación inicia una cuenta regresiva con vibración (duración configurable) que el usuario puede cancelar antes de que se envíe
- [x] **SOS-03**: La alerta queda guardada en el teléfono antes de cualquier llamada de red y se reintenta sin duplicarse (clientGeneratedId) hasta que el servidor la confirme
- [x] **SOS-04**: El usuario ve una pantalla de alerta activa con el estado real por contacto y canal (en cola, enviado, entregado, fallido); nunca se muestra "entregado" sin confirmación del proveedor
- [ ] **SOS-05**: El usuario puede cancelar una alerta activa ingresando su PIN; queda marcada como falsa alarma y los contactos reciben aviso de cancelación
- [ ] **SOS-06**: En modo silencioso la cuenta regresiva y la alerta corren sin sonido ni pantalla visible (solo vibración discreta configurable)

### Notificación a contactos (NOTI)

- [ ] **NOTI-01**: Cada contacto recibe un SMS (Twilio, desde el servidor) con el nombre de la persona y el link de seguimiento
- [ ] **NOTI-02**: Los contactos que también tienen AlertaYA reciben una notificación push
- [ ] **NOTI-03**: El contacto puede abrir el link de seguimiento sin login y ver un mapa con la ubicación en vivo, su antigüedad y el estado de la alerta; el link expira y es revocable
- [ ] **NOTI-04**: Ninguna notificación se pierde si el servidor se reinicia (cola durable con reintentos) y el estado de entrega se actualiza con la confirmación del proveedor

### Ubicación (UBIC)

- [ ] **UBIC-01**: Durante una alerta activa, la ubicación se envía periódicamente aunque la pantalla esté apagada o la app cerrada
- [x] **UBIC-02**: Si no hay GPS, la alerta se crea igual con "ubicación pendiente"; nunca se usa una ubicación sustituta, y se muestran precisión y antigüedad de cada punto
- [ ] **UBIC-03**: En el historial, el usuario puede ver el trayecto recorrido durante cada alerta

### Activadores sin abrir la app (ACTV)

- [ ] **ACTV-01**: El usuario puede activar/desactivar la protección en segundo plano (servicio en primer plano con notificación persistente)
- [ ] **ACTV-02**: Agitar el teléfono con un patrón definido dispara la cuenta regresiva del SOS, con sensibilidad configurable
- [ ] **ACTV-03**: Presionar el botón de encendido varias veces seguidas dispara la cuenta regresiva del SOS
- [ ] **ACTV-04**: Decir la palabra clave configurada dispara la cuenta regresiva del SOS (reconocimiento en el dispositivo; la protección se arma con la app abierta)
- [ ] **ACTV-05**: Un disparo desde segundo plano funciona con la app cerrada y la pantalla bloqueada, aunque hayan pasado horas sin abrir la app

### Audio e IA (IA)

- [ ] **IA-01**: Con consentimiento explícito previo, al activarse la alerta se graba un clip de audio de 10–30 s que se sube a almacenamiento privado
- [ ] **IA-02**: La IA transcribe el clip y clasifica el peligro y la prioridad de la alerta; si falla o tarda, la alerta conserva prioridad base o alta
- [ ] **IA-03**: La IA marca "posible falsa alarma" para el oficial sin descartar ni ocultar nunca la alerta
- [ ] **IA-04**: El oficial ve un resumen de la alerta (audio, movimiento, ubicación) etiquetado como "generado por IA"

### Panel policial web (PANEL)

- [ ] **PANEL-01**: Un oficial puede iniciar sesión en el panel web y solo ve las alertas de su CAI según su rol
- [ ] **PANEL-02**: El oficial ve en un mapa y una lista las alertas activas ordenadas por prioridad, actualizadas en tiempo real
- [ ] **PANEL-03**: El oficial abre el detalle de una alerta (trayecto, audio, resumen IA, datos de la persona) y puede atenderla o descartarla; la decisión queda registrada
- [ ] **PANEL-04**: Si nadie acusa recibo de una alerta en X minutos, se escala automáticamente al supervisor

### Emergencias 123 (EMRG)

- [ ] **EMRG-01**: El usuario puede habilitar en ajustes la llamada al 123; al activarse una alerta hay una cuenta regresiva para cancelarla antes de marcar

### Historial y Ajustes (HIST)

- [ ] **HIST-01**: El usuario ve su historial de alertas con fecha, activador usado y el estado real de entrega por contacto
- [ ] **HIST-02**: Los ajustes (ventana de confirmación, modo silencioso, activadores, palabra clave, PIN, 123) se guardan en el servidor y persisten entre dispositivos; PIN y palabra clave nunca en texto plano

## v2 Requirements

### Activadores

- **ACTV-V2-01**: Botones de volumen disparan el SOS con la pantalla apagada (incierto por fabricante; AccessibilityService rechazado por Play)

### SOS

- **SOS-V2-01**: PIN de coacción que aparenta cancelar pero escala la alerta en silencio

### Plataforma

- **PLAT-V2-01**: Migración de .NET 8 a .NET 10 LTS (soporte de .NET 8 termina 2026-11-10)
- **PLAT-V2-02**: Publicación en Play Store (declaraciones FGS con video, Data safety, política de privacidad Ley 1581)
- **PLAT-V2-03**: Short code Twilio o remitente local en Colombia (4–10 semanas de trámite)

## Out of Scope

| Feature | Reason |
|---------|--------|
| iOS | Apple bloquea los activadores en segundo plano; el producto pierde su diferencial |
| WhatsApp | Requiere WhatsApp Business API; SMS + push + link cubren v1 |
| Llamada automática al 123 sin confirmación | Riesgo legal por llamadas falsas a emergencias |
| IA que descarta o archiva alertas | Un falso negativo en emergencia es inaceptable; la IA solo prioriza y resume |
| Streaming en vivo de audio/video | Batería, datos, privacidad y complejidad; el clip corto cubre la evidencia |
| Escucha de micrófono sin opt-in | Viola Ley 1581 y políticas de Play |
| SEND_SMS desde el teléfono | Play lo restringe a apps SMS por defecto; los SMS salen por Twilio desde el servidor |
| Denuncias / chat con la policía | Fuera del propósito de alerta inmediata |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 6 | Pending |
| AUTH-04 | Phase 6 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| CONT-01 | Phase 1 | Complete |
| CONT-02 | Phase 6 | Pending |
| SOS-01 | Phase 1 | Complete |
| SOS-02 | Phase 1 | Pending |
| SOS-03 | Phase 1 | Complete |
| SOS-04 | Phase 1 | Complete |
| SOS-05 | Phase 5 | Pending |
| SOS-06 | Phase 3 | Pending |
| NOTI-01 | Phase 1 | Pending |
| NOTI-02 | Phase 6 | Pending |
| NOTI-03 | Phase 1 | Pending |
| NOTI-04 | Phase 1 | Pending |
| UBIC-01 | Phase 2 | Pending |
| UBIC-02 | Phase 1 | Complete |
| UBIC-03 | Phase 3 | Pending |
| ACTV-01 | Phase 2 | Pending |
| ACTV-02 | Phase 2 | Pending |
| ACTV-03 | Phase 7 | Pending |
| ACTV-04 | Phase 7 | Pending |
| ACTV-05 | Phase 2 | Pending |
| IA-01 | Phase 7 | Pending |
| IA-02 | Phase 7 | Pending |
| IA-03 | Phase 4 | Pending |
| IA-04 | Phase 4 | Pending |
| PANEL-01 | Phase 4 | Pending |
| PANEL-02 | Phase 4 | Pending |
| PANEL-03 | Phase 4 | Pending |
| PANEL-04 | Phase 5 | Pending |
| EMRG-01 | Phase 5 | Pending |
| HIST-01 | Phase 3 | Pending |
| HIST-02 | Phase 3 | Pending |

**Coverage:**

- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-06*
*Last updated: 2026-10-06 after roadmap creation*
