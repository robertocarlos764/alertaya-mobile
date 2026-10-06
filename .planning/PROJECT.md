# AlertaYA

## What This Is

AlertaYA es una app Android de seguridad personal para cualquier ciudadano. Con un botón SOS —o sin siquiera desbloquear el teléfono: agitándolo, presionando varias veces el botón de encendido o de volumen, o diciendo una palabra clave— dispara una alerta que avisa a sus contactos de confianza (SMS, push y link de seguimiento en vivo) y a la policía (panel web para CAI/oficiales), con ubicación en tiempo real, un clip de audio y priorización por IA. Monorepo: app móvil Expo/React Native (`apps/mobile`), API .NET (`apps/api`), panel web policial y base de datos PostgreSQL en Supabase.

## Core Value

Cuando una persona activa una alerta, alguien que puede ayudar se entera de verdad, con su ubicación real, en segundos. Nunca se informa un envío que no ocurrió ni una ubicación inventada.

## Requirements

### Validated

<!-- Inferido del código existente en apps/api (back del compañero, .NET 8 + Supabase) -->

- ✓ Autenticación vía JWT de Supabase Auth; perfil creado por trigger `handle_new_user` — existing
- ✓ CRUD de contactos de emergencia (`/api/emergency-contacts`) — existing
- ✓ Perfil propio GET/PATCH (`/api/profiles/me`) — existing
- ✓ Creación de alerta idempotente con `clientGeneratedId` (`POST /api/alerts`) — existing
- ✓ Máquina de estados de alerta (pendiente|activa|verificando|escalada|atendida|descartada) — existing
- ✓ Registro de ubicaciones de tracking por alerta (`POST /api/alerts/{id}/location`, PostGIS) — existing
- ✓ Esquema Supabase con tablas de ciudadano (profiles, emergency_contacts, alerts, alert_locations, verification_logs) y policía (cais, officers, officer_duty_log, officer_decisions) — existing

### Active

- [ ] App Android con diseño oscuro/rojo del legacy (onboarding, inicio, contactos, historial, ajustes, alerta activa)
- [ ] Registro/login con correo + contraseña y verificación de celular (OTP SMS)
- [ ] Onboarding que pide permisos reales (ubicación siempre, micrófono, notificaciones, llamadas, segundo plano)
- [ ] Botón SOS en la app (núcleo) con cuenta regresiva + vibración cancelable
- [ ] Activadores sin abrir la app (complementos): agitar, varias pulsaciones de encendido, volumen, palabra clave — vía servicio en primer plano Android
- [ ] Notificación real a contactos: SMS (Twilio), push si tienen la app, link web de seguimiento en vivo
- [ ] Tracking de ubicación en tiempo real durante la alerta, en segundo plano
- [ ] Clip de audio corto (10–30 s) al activarse, subido cifrado, con consentimiento explícito
- [ ] IA: detecta peligro en el audio, filtra falsas alarmas, prioriza y resume la alerta para el oficial
- [ ] Panel web policial: mapa de alertas activas ordenadas por prioridad, detalle con resumen IA/audio/tracking, atender o descartar
- [ ] Llamada al 123 opcional (activable en ajustes) con cuenta regresiva para cancelar
- [ ] Cancelar alerta / marcar falsa alarma con PIN, avisando a los contactos
- [ ] Historial de alertas con el estado real de entrega por contacto

### Out of Scope

- iOS — Apple bloquea los activadores en segundo plano (botón de encendido, volumen, micrófono permanente); el producto pierde su diferencial. Reconsiderar solo con el botón SOS.
- WhatsApp como canal — exige WhatsApp Business API; SMS + push + link cubren v1.
- Llamada automática al 123 sin confirmación — riesgo legal por llamadas falsas a emergencias.
- Copiar el comportamiento del Flutter legacy — tiene defectos graves (SOS que no notifica, GPS que cae a Bogotá, permisos falsos); el contrato son las specs, no ese código.

## Context

- **Legacy de referencia:** `docs/legacy/` (Flutter + Firebase, openspec `migrar-a-dotnet-expo` con 7 specs y 55 tareas, dominio C# viejo con 87 tests). Prohibido repetir sus tres defectos (ver specs *Veracidad de lo informado* y *Ausencia de ubicación sustituta*).
- **Back existente (`apps/api`):** .NET 8 monoproyecto del compañero. Sin tests ni CI, `NotificationService` es un stub que solo hace log, sms-fallback con HMAC global inseguro, errores `{error}` en vez de ProblemDetails, sin endpoints de ajustes. Trabajo compartido: se puede modificar libremente.
- **BD Supabase (`vzyasmeeyvbkpoiosses`):** esquema hecho a mano sin migraciones; policies duplicadas en profiles; alerts sin policy UPDATE; tablas de policía con RLS sin policies; `palabra_clave` en texto plano; trigger que no lee metadata; sin realtime, storage, tabla de push tokens ni de entregas por contacto; advisors con FKs sin índice y `auth.uid()` sin `(select)`.
- **Mapeo del código:** `.planning/codebase/` (2026-09-28).
- **Diseño a conservar:** bg `#0D0D0D`, surface `#1A1A1A`, primary `#E8212B`, border `#2A2A2A`, hint `#5A5A5A`; DM Sans; radios 10/12/16; labels en mayúsculas con letterSpacing; glow rojo; pressable scale 0.95 + háptico; stagger fade-in.
- **Demo de avance:** jueves 15 de octubre de 2026. "Listo para mostrar" = recorrido en vivo, paso a paso, de cada función, con aprobación de Roberto. Se itera hasta que él decida.

## Constraints

- **Plataforma**: solo Android — los activadores en segundo plano dependen de un servicio en primer plano Android.
- **Tech stack**: Expo + TypeScript con development build y módulos nativos (Kotlin) para los activadores — Expo Go no alcanza; back .NET/C#; PostgreSQL en Supabase.
- **Arquitectura**: Clean Architecture + SOLID — decisión del usuario.
- **Timeline**: demo de avance el 2026-10-15 con SOS de punta a punta, diseño completo, al menos un activador, tracking en vivo; IA y panel en versión mínima funcional.
- **Seguridad/privacidad**: Ley 1581 (habeas data) — consentimiento explícito para audio y ubicación; audio cifrado; datos sensibles nunca en texto plano.
- **Veracidad**: la app nunca afirma un envío que no ocurrió ni usa una ubicación sustituta.
- **BD**: cambios de esquema solo como migraciones versionadas y con confirmación de Roberto antes de aplicarlas al proyecto remoto.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo (apps/mobile, apps/api, docs/legacy) con un solo `.planning/` | GSD abarca front, back y BD juntos | ✓ Good |
| Solo Android | iOS bloquea los activadores sin abrir la app | — Pending |
| Botón SOS = núcleo; agitar/botones/voz = complementos | El SOS debe funcionar aunque fallen los activadores | — Pending |
| Contactos por SMS (Twilio) + push + link de seguimiento | Llega aunque el contacto no tenga la app | — Pending |
| Panel policial web | Patrón típico de centro de monitoreo; tablas cais/officers ya existen | — Pending |
| 123 opcional con cuenta regresiva | Evita llamadas falsas a emergencias | — Pending |
| Falsa alarma: cuenta regresiva + vibración, cancelación posterior con PIN | Reduce disparos accidentales de los activadores | — Pending |
| IA en v1: audio, filtro de falsas alarmas, prioridad y resumen | Valor clave para la policía | — Pending |
| Clip de audio corto (10–30 s) cifrado con consentimiento | Evidencia + insumo IA, cumpliendo Ley 1581 | — Pending |
| Login correo + contraseña y verificación de celular OTP | Identidad confiable para la policía | — Pending |
| Back compartido con el compañero, sin restricciones de cambio | Avanzar sin bloqueo de contrato | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-06 after initialization*
