# Síntesis de Investigación: AlertaYA

**Proyecto:** AlertaYA (SOS personal manos libres + panel policial)
**Dominio:** App Android de seguridad personal con despacho policial en tiempo real (Colombia)
**Investigado:** 2026-10-06
**Confianza general:** MEDIA-ALTA

---

## Resumen Ejecutivo

AlertaYA es una app de botón de pánico inteligente con activadores manos libres (agitar, botones, palabra clave) que notifica a contactos y envía alertas a panel policial en tiempo real. Diferenciador: despacho directo a policía, estado honesto de entrega por contacto, IA que prioriza sin descartar.

Android 14/15 restringen severamente FGS de micrófono/ubicación, obligando arquitectura con dueño Kotlin nativo de countdown y permisos verificables. Core Value: Veracidad. Cola durable Postgres obligatoria desde día 1. IA asíncrona, subordinada a decisión humana.

Riesgos: (1) mostrar enviado por optimismo, (2) batería consumida, (3) falsas alarmas por gesto, (4) rechazo Play, (5) JWT vencido en background.

---

## Hallazgos Clave

### Stack Recomendado

Expo SDK 57 + módulo Kotlin alertaya-protection para FGS. .NET 8 Clean Arch (4 proyectos). Patrón outbox transaccional. Twilio, Deepgram, Claude, Supabase, Next.js 16. Versiones críticas: Expo 57.0.24+, targetSdk 36, .NET 8 EOL 2026-11-10.

### Funcionalidades

Must-have: botón SOS+countdown+cancelable; notificación honesta (SMS+push+link) con estado real; tracking background; link web; auth+OTP; panel policial; historial.

Diferenciadores: activador agitar; despacho policial directo; IA prioriza (nunca descarta); estado honesto; clip audio cifrado.

Defer: activadores adicionales, audio background, iOS.

### Arquitectura

Transactional outbox Postgres. Kotlin FGS detecta gesto, countdown nativo, Headless JS ejecuta TriggerSos. Rastreo: GPS buffer→lotes→idempotente. IA job asíncrono, fail-open a heurísticas. RLS correcto por Custom Token Hook.

### Pitfalls Críticos

1. No mostrar enviado antes de confirmar. 2. GPS nunca falso. 3. Permisos verificables. 4. FGS tipos en manifest. 5. OEM killers matriz física. 6. Gesto en Kotlin no JS. 7. Token emergencia largo plazo. 8. Gesto patrón no pico. 9. Escucha on-device. 10. Declare Play. 11. Twilio Colombia SMS confirmación. 12. IA nunca descarta. 13. Audio Ley 1581. 14. 123 opcional. 15. RLS tests pgTAP.

---

## Roadmap: 6 Fases

F0: Fundaciones (1-2d) → F1: Shell+Auth (1d, paralelo) → F2: SOS vertical (3-4d) + F3: Tracking+Panel (2d, paralelo) + F4: Activador (1-2d) + F5: Audio+IA (1-2d) → F6: Hardening (post-demo).

F0 spike: ninguno. F2 spike: Twilio Colombia. F4 spike: Headless JS, OEM matriz. F5 spike: STT/LLM. F6 spike: ley, FGS micrófono.

---

## Confianza: MEDIA-ALTA

Stack ALTA (docs). Features MEDIA-ALTA (spike Android). Architecture MEDIA-ALTA (OEM MEDIA). Pitfalls MEDIA-ALTA (legal MEDIA).

Gaps: Headless JS fiabilidad, Play viabilidad, motor word spotting, Twilio DLR real, Ley 1581 validación, OEM matriz, indicador privacidad.

---

Síntesis completada: 2026-10-06. Listo para roadmap: sí