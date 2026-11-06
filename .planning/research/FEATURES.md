# Feature Research

**Dominio:** App Android de seguridad personal (SOS) con panel web de despacho policial (Colombia)
**Investigado:** 2026-10-06
**Confianza:** MEDIUM (bSafe, Noonlight, Google/Samsung SOS y apps policiales colombianas verificados con fuentes web; Life360 y práctica de RapidSOS solo parcialmente, ver Fuentes)

## Panorama de funcionalidades

El dominio se reparte en tres familias de producto, y AlertaYA toma algo de cada una:

1. **SOS nativo del sistema (Google Personal Safety, Samsung Emergency SOS):** 5 pulsaciones de encendido, cuenta regresiva de 5 s con sonido de alarma opcional (o "mantener 3 s dentro del círculo rojo"), llamada al número de emergencias, compartir ubicación en vivo con contactos (con batería), grabación de video de hasta 45 min y "Safety Check" (check-in programado de hasta 24 h; si no confirmas, avisa a los contactos). Es el estándar que el usuario ya conoce y la vara contra la que se medirá cualquier activador.
2. **Apps de "guardianes" (bSafe, Life360):** SOS por toque o voz, siren opcional, grabación automática de audio/video enviada a los guardianes, seguimiento en vivo, temporizador "sígueme", llamada falsa. El destinatario es una persona de confianza, no la policía.
3. **Monitoreo con despacho (Noonlight/SafeTrek, RapidSOS):** el usuario mantiene un botón presionado y lo suelta con PIN de 4 dígitos para decir "estoy bien"; si suelta sin PIN, un operador contacta (texto y llamada) y, sin respuesta, despacha policía con ubicación, nombre y tipo de emergencia. Sin penalización por falsa alarma. RapidSOS entrega datos enriquecidos (ubicación híbrida) al centro de despacho y advierte explícitamente que puede haber falsas alarmas.
4. **Apps policiales colombianas (SIES-D, Polis, A Denunciar, GAULA Móvil):** botón de pánico que envía GPS al 123, denuncias en línea, seguimiento de denuncias, chat con policía en ciudades selectas, mapa de riesgo. Baja visibilidad frente a apps privadas. Los botones físicos de la UNP (activistas) fallaron por inseguridad (micrófono activable remotamente, rastreo), falta de transparencia sobre el micrófono y no funcionar cuando se necesitaba: la confianza y la veracidad son el punto débil histórico.

### Table Stakes (el usuario espera esto)

Faltar cualquiera de estas hace que el producto se sienta roto o inseguro.

| Funcionalidad | Por qué se espera | Complejidad | Notas |
|---------------|-------------------|-------------|-------|
| Botón SOS en la app con cuenta regresiva + vibración, cancelable | Google/Samsung usan 5 s de cuenta regresiva; es el control estándar anti-disparo accidental | LOW | Núcleo del producto. Debe funcionar aunque fallen los activadores. Hápticos y diseño ya definidos |
| Alerta a contactos de confianza con ubicación | Función base de bSafe, Google Emergency Sharing, Life360 | MEDIUM | SMS vía Twilio desde el servidor (no `SEND_SMS` en el dispositivo: Google Play lo restringe a handlers por defecto o a un permiso excepcional para apps de emergencia) + push + link |
| Link web de seguimiento en vivo para contactos sin la app | Los contactos rara vez tienen la app; Google comparte ubicación en vivo por link | MEDIUM | Página pública con token de corta vida, sin login, solo lectura; expira al cerrar la alerta |
| Tracking de ubicación en tiempo real en segundo plano durante la alerta | Todas las apps lo hacen; es el Core Value | HIGH | Foreground service con tipo `location`, permiso "siempre", batería baja/sin señal (cola local y reintento). Nunca ubicación sustituta |
| Estado honesto de entrega ("enviado", "entregado", "falló") por contacto | Core Value de AlertaYA; el legacy mentía | MEDIUM | Requiere tabla de entregas por contacto y webhooks de estado de Twilio. Sin esto, no hay historial veraz |
| Cancelar alerta / marcar falsa alarma con PIN y avisar a contactos | Noonlight (PIN de 4 dígitos), Google (cancelar en la interfaz) | LOW | PIN guardado con hash, nunca en texto plano. El aviso de cancelación a contactos y policía es obligatorio |
| Gestión de contactos de confianza (alta/edición/baja, prioridad) | Toda app del dominio | LOW | CRUD ya existe en el API |
| Onboarding con permisos reales explicados (ubicación siempre, micrófono, notificaciones, llamadas, exclusión de batería) | Sin permisos la app falla en silencio; el legacy los simulaba | MEDIUM | Detectar el estado real del permiso y mostrar qué NO funciona si se niega |
| Registro/login y verificación de celular (OTP) | Identidad confiable para que la policía confíe en la alerta | MEDIUM | Auth Supabase ya existe; falta OTP SMS |
| Historial de alertas con detalle | Esperado en cualquier app con registro de eventos | LOW | Depende de entregas por contacto |
| Funcionamiento con pantalla bloqueada | El caso de uso real es peligro con el teléfono en el bolsillo | HIGH | Notificación persistente/foreground service, pantalla de alerta sobre el lock screen |
| Consentimiento explícito de audio y ubicación (Ley 1581) | Obligación legal y requisito de confianza (el caso del micrófono oculto de la UNP) | LOW | Pantalla de consentimiento versionada, registrada con fecha |
| Panel policial: lista/mapa de alertas activas con ubicación en vivo y acción atender/descartar | Es el producto del lado policía; Noonlight/RapidSOS lo ofrecen al despachador | MEDIUM | Tablas `cais`/`officers` ya existen; máquina de estados ya existe. Falta RLS con policies y realtime |

### Diferenciadores (ventaja competitiva)

| Funcionalidad | Propuesta de valor | Complejidad | Notas |
|---------------|--------------------|-------------|-------|
| Activadores manos libres: agitar | Samsung/Google solo ofrecen encendido; agitar es rápido y discreto | MEDIUM | Foreground service con acelerómetro; el más barato de los activadores, buen candidato para la demo del 15-oct |
| Activador: varias pulsaciones de encendido/volumen | Equivalente a Emergency SOS pero ligado al flujo AlertaYA (contactos + policía) | HIGH | No hay API pública para el botón de encendido en apps de terceros; típicamente se aprovecha `SCREEN_ON/OFF` broadcasts o el servicio de accesibilidad, que Google Play vigila. Requiere spike |
| Activador: palabra clave | bSafe lo ofrece por voz; da activación sin manos real | HIGH | Escucha continua del micrófono: Android 14 restringe micrófono en segundo plano (el servicio debe iniciarse con la app en primer plano, tipo `microphone`), consume batería y es sensible a privacidad. Spike + opt-in explícito. Candidato a v1.x |
| Despacho policial directo (panel CAI/oficiales) con prioridad | Las apps de guardianes no llegan a la policía; SIES-D envía al 123 pero sin panel de priorización y seguimiento | HIGH | Es el diferenciador real frente a bSafe/Life360. Alcance mínimo para la demo: lista ordenada, detalle, atender/descartar |
| Priorización y resumen por IA para el oficial | Reduce el tiempo de lectura; RapidSOS vende datos enriquecidos al despachador | HIGH | La IA solo ordena y resume; nunca descarta una alerta sola (ver anti-funcionalidades). Entradas: clip de audio, tiempo de tracking, historial de la persona |
| Clip de audio corto (10-30 s) cifrado con consentimiento | Evidencia y entrada para IA; más ligero y discreto que video en vivo | MEDIUM | Subida cifrada a Storage (hoy no existe), retención definida, recorte cuando no hay señal (subir al reconectar) |
| Detección de peligro en audio y filtro de falsas alarmas | Dispatchers reportan carga por llamadas accidentales; filtrar sin descartar es valor para la policía | HIGH | Salida: puntaje de confianza + etiqueta, la decisión final es humana. Medir tasa de falsos negativos antes de cualquier regla automática |
| Llamada opcional al 123 con cuenta regresiva (apagada por defecto) | Google/Samsung llaman a emergencias tras 5 s; aquí es configurable y cancelable | MEDIUM | `ACTION_CALL` requiere confirmación o permiso; nunca automática sin cuenta regresiva ni opt-in |
| Entrega veraz por contacto y por canal visible al usuario | Directamente contra el defecto central del legacy y de otras apps que "dicen" enviar | MEDIUM | Es diferenciador de confianza más que de capacidades; mostrar fallos y reintentar |
| Aviso de cancelación/falsa alarma a policía y contactos con PIN | Cierra el ciclo; evita despliegues inútiles | LOW | Complemento de la máquina de estados |

### Anti-funcionalidades (se piden a menudo, suelen dar problemas)

| Funcionalidad | Por qué se pide | Por qué es problemática | Alternativa |
|---------------|-----------------|-------------------------|-------------|
| Llamada automática al 123 sin confirmación | "Que llame solo si no puedo" | Riesgo legal por llamadas falsas a emergencias; los despachadores ya sufren llamadas accidentales (aprox. 1 de cada 10 son falsas en algunos centros de EE. UU.) | Llamada opcional con cuenta regresiva cancelable, apagada por defecto |
| IA que descarta alertas automáticamente | "Menos ruido para la policía" | Un falso negativo puede costar una vida; sin datos de calibración no es defendible | La IA prioriza y resume; todas las alertas siguen visibles con su prioridad |
| Streaming de audio/video en vivo a contactos (como bSafe) | Atractivo para "ver todo en vivo" | Ancho de banda, batería, almacenamiento, riesgos de privacidad y Ley 1581; complejidad enorme | Clip de audio corto cifrado + tracking en vivo |
| Escucha permanente del micrófono sin opt-in | Mejor detección de palabra clave | Android 14 lo restringe; el caso de los botones de la UNP muestra el daño de confianza de un micrófono no declarado | Opt-in explícito, indicador visible, procesamiento en el dispositivo |
| WhatsApp como canal | Es el canal dominante en LatAm | Exige WhatsApp Business API y plantillas; no cabe en v1 | SMS + push + link |
| iOS | Mercado amplio | Apple bloquea activadores en segundo plano; se pierde el diferenciador | Solo Android; reconsiderar con solo el botón SOS |
| Mostrar "enviado" antes de confirmar la entrega o usar una ubicación sustituta | Percepción de respuesta inmediata | Es el defecto central del legacy y rompe el Core Value | Estados honestos (enviando / entregado / falló) y "sin ubicación" explícito |
| Denuncias en línea, chat con policía, mapa de riesgo (como SIES-D) | Cobertura amplia de seguridad ciudadana | Ya existen apps oficiales; diluye el foco en alertas en tiempo real | Enlazar a las apps oficiales; no construir |
| Red social/comunidad de reportes entre usuarios | Engagement | Moderación, desinformación, riesgo legal | Fuera de alcance |
| Siren/alarma sonora por defecto al activarse | Atrae atención | Puede poner en mayor riesgo a la persona en secuestros/violencia doméstica | Opcional y apagada por defecto; cuenta regresiva silenciosa con vibración |

## Dependencias entre funcionalidades

```
Auth + OTP celular
    └──requiere──> Contactos de confianza
                       └──requiere──> Botón SOS + cuenta regresiva
                                          ├──requiere──> Permisos reales (ubicación siempre, notificaciones)
                                          ├──requiere──> Tracking en segundo plano (foreground service)
                                          │                  └──requiere──> Link web de seguimiento en vivo
                                          └──requiere──> Notificación a contactos (SMS Twilio + push)
                                                             └──requiere──> Tabla de entregas por contacto
                                                                                └──requiere──> Historial con estado real

Panel policial ──requiere──> Alerta creada + Tracking + RLS de policías + Realtime
Resumen/prioridad IA ──requiere──> Clip de audio cifrado (Storage) + consentimiento + Panel policial
Filtro de falsas alarmas ──requiere──> Resumen/prioridad IA + datos de PIN/cancelaciones
Activadores (agitar, botones, voz) ──mejoran──> Botón SOS (reutilizan el mismo flujo)
Palabra clave ──requiere──> Servicio en primer plano de micrófono + consentimiento de audio
Cancelación con PIN ──requiere──> PIN hasheado en perfil + aviso a contactos y policía
Llamada 123 opcional ──requiere──> Ajustes de usuario + cuenta regresiva (no hay endpoint de ajustes hoy)

Llamada automática al 123 ──entra en conflicto──> Cuenta regresiva cancelable / riesgo legal
IA que descarta ──entra en conflicto──> Panel con todas las alertas visibles
```

### Notas de dependencia

- **Entregas por contacto requiere el stub de `NotificationService` reemplazado:** hoy solo hace log, así que "estado real de entrega" no existe aún. Es la dependencia que más bloquea la veracidad del producto.
- **Panel policial requiere RLS:** las tablas de policía tienen RLS sin policies; sin ellas el panel no puede leer ni actualizar nada. Realtime y Storage tampoco existen aún.
- **IA depende del audio:** sin clip cifrado no hay señal para detección de peligro; el resumen mínimo puede basarse solo en metadatos (hora, duración, tracking, historial) para la demo.
- **Activadores dependen del servicio en primer plano Android:** módulo nativo Kotlin; Expo Go no sirve.
- **Ajustes de usuario (123, activadores, consentimientos)** no tienen endpoint: bloquea la llamada al 123 y la activación/desactivación de activadores.
- **Palabra clave en texto plano:** `palabra_clave` está sin protección en la BD; si se usa como palabra de coacción o de activación debe guardarse con hash o cifrada.

## Definición de MVP

### Lanzar con (v1 / demo del 15-oct)

- [ ] Auth + OTP + onboarding con permisos reales: sin esto no hay alerta confiable
- [ ] Contactos de confianza: ya existen en el back, falta pantalla
- [ ] Botón SOS con cuenta regresiva + vibración + cancelar con PIN: núcleo
- [ ] Notificación a contactos: SMS Twilio + push + link de seguimiento, con estado real por contacto
- [ ] Tracking en tiempo real en segundo plano
- [ ] Al menos un activador sin abrir la app (agitar): es el más viable y demuestra el diferencial
- [ ] Panel policial mínimo: mapa/lista ordenada por prioridad, detalle, atender/descartar
- [ ] Historial con estado de entrega por contacto
- [ ] Diseño completo oscuro/rojo

### Agregar después de validar (v1.x)

- [ ] Activadores de varias pulsaciones de encendido/volumen: requiere spike de viabilidad en Android 14+ y política de Play
- [ ] Palabra clave: spike de consumo de batería y restricciones de micrófono en segundo plano
- [ ] Clip de audio cifrado + IA de detección de peligro/filtro de falsas alarmas: tras Storage y consentimiento
- [ ] Llamada opcional al 123 con cuenta regresiva
- [ ] Safety Check (check-in programado, como Google): bajo costo una vez exista tracking y notificación

### Consideración futura (v2+)

- [ ] iOS solo con botón SOS: depende de si el producto valida sin activadores
- [ ] WhatsApp: tras validar demanda y cubrir costo de Business API
- [ ] Llamada falsa / temporizador "sígueme": útiles pero fuera del foco policial
- [ ] Integración directa con la central 123 o CAD: depende de convenio institucional

## Matriz de priorización

| Funcionalidad | Valor para el usuario | Costo de implementación | Prioridad |
|---------------|-----------------------|-------------------------|-----------|
| Botón SOS + cuenta regresiva + cancelar con PIN | HIGH | LOW | P1 |
| Notificación a contactos con estado real | HIGH | MEDIUM | P1 |
| Tracking en vivo en segundo plano + link web | HIGH | HIGH | P1 |
| Onboarding con permisos reales + OTP | HIGH | MEDIUM | P1 |
| Panel policial mínimo | HIGH | MEDIUM | P1 |
| Historial con entrega por contacto | MEDIUM | LOW | P1 |
| Activador: agitar | HIGH | MEDIUM | P1 |
| Activadores: encendido/volumen | HIGH | HIGH | P2 |
| Clip de audio cifrado | MEDIUM | MEDIUM | P2 |
| IA: resumen y prioridad | MEDIUM | HIGH | P2 (versión mínima para la demo) |
| IA: detección de peligro y filtro de falsas alarmas | MEDIUM | HIGH | P2 |
| Llamada opcional al 123 | MEDIUM | MEDIUM | P2 |
| Activador: palabra clave | MEDIUM | HIGH | P3 |
| Safety Check / check-in programado | MEDIUM | MEDIUM | P3 |
| Llamada falsa, siren, video en vivo | LOW | MEDIUM-HIGH | No construir en v1 |

**Clave de prioridad:**
- P1: indispensable para el lanzamiento
- P2: debería estar, agregar cuando sea posible
- P3: deseable, consideración futura

## Análisis de la competencia

| Funcionalidad | bSafe | Noonlight | Google/Samsung SOS | SIES-D (Policía Colombia) | Nuestro enfoque |
|---------------|-------|-----------|--------------------|---------------------------|-----------------|
| SOS con cuenta regresiva | Toque o voz, siren opcional | Mantener botón y soltar con PIN | 5 pulsaciones de encendido, 5 s | Un toque, envía GPS al 123 | Botón + cuenta regresiva + vibración, cancelable con PIN |
| Activadores manos libres | Voz | No | Encendido (5 veces) | No | Agitar, encendido/volumen, palabra clave (por fases) |
| Aviso a contactos | Guardianes con ubicación y grabaciones | Opcional | Emergency Sharing con batería y ubicación en vivo | No | SMS + push + link, con estado real de entrega |
| Audio/video | Audio/video automático a guardianes | Opera con operador | Video hasta 45 min | No | Clip de audio 10-30 s cifrado con consentimiento |
| Llegada a la policía | No | Operadores certificados llaman a 911 | Llama a emergencias tras la cuenta regresiva | Envía al 123 | Panel web propio para CAI/oficiales, 123 opcional |
| Falsa alarma | Cancelar | PIN de 4 dígitos, sin penalización | Cancelar y avisar al operador | No documentado | PIN + aviso a contactos y policía + filtro IA como apoyo |
| Priorización/IA | No | Operador humano | No | No | Prioridad y resumen por IA para el oficial |
| Check-in programado | Temporizador | Mantener botón | Safety Check hasta 24 h | No | v1.x |

## Fuentes

- bSafe, funciones (SOS, llamada falsa, temporizador, grabación automática): resultados de búsqueda web (ABC13, R&D World, App Store). Confianza MEDIUM.
- Noonlight, cómo funciona (botón mantenido, PIN de 4 dígitos, contacto por texto y llamada, despacho): help.noonlight.com y SafeWise. Confianza MEDIUM.
- Google Personal Safety / Emergency SOS: https://support.google.com/android/answer/9319337 (cuenta regresiva de 5 s, grabación hasta 45 min, Safety Check hasta 24 h). Confianza HIGH.
- Samsung Emergency SOS (Settings > Safety and emergency): resultados de búsqueda web. Confianza MEDIUM.
- RapidSOS / Android Emergency Location Service: UrgentComm, MIT News. Confianza MEDIUM.
- Apps policiales colombianas (SIES-D, A Denunciar, GAULA Móvil): https://colombiatramita.co/policia-seguridad/apps-seguridad-colombia/ y policia.gov.co. Confianza MEDIUM (sitio de terceros).
- Fallos de botones de pánico de la UNP: https://phys.org/news/2017-03-colombia-panic-buttons-expose-activists.html (AP, 2017). Confianza HIGH, pero antiguo.
- Política de SMS de Google Play (`SEND_SMS` restringido; excepción para apps de seguridad y emergencia; alternativa por Intent requiere pulsar "enviar"): https://support.google.com/googleplay/android-developer/answer/9047303. Confianza HIGH.
- Restricciones de foreground services en Android 14 (micrófono/ubicación): documentación de Android Developers. Confianza HIGH, pero hay que revisar tipos exigidos y excepciones al implementar.
- Carga de llamadas falsas a 911: 9to5Mac, NBC, WKOW. Confianza MEDIUM.
- Life360: no se verificó con fuente en esta investigación; los comentarios sobre su SOS provienen de conocimiento previo. Confianza LOW.

---
*Feature research para: App Android de seguridad personal SOS con panel policial (AlertaYA, Colombia)*
*Investigado: 2026-10-06*
