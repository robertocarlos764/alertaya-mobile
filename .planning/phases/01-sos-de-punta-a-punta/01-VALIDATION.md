---
phase: "01"
slug: "sos-de-punta-a-punta"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-06"
---

# Phase 01 — Validation Strategy

> Contrato de validación por fase para el muestreo de feedback durante la ejecución. Fuente: `01-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | API: xUnit 2.9.3 + `FakeTimeProvider` (integración: Testcontainers + Mvc.Testing, requieren Docker) · Móvil: jest-expo ~57.0.5 + Jest 29 · Web: vitest 5.0.3 |
| **Config file** | none — Wave 0 instala: `apps/api/tests/*`, `apps/mobile/jest.config.js`, `apps/web/vitest.config.ts` |
| **Quick run command** | `dotnet test apps/api/AlertaYA.sln --filter "Category!=Integration"` · `cd apps/mobile && npx jest --silent && npx tsc --noEmit` · `cd apps/web && npx vitest run` |
| **Full suite command** | `dotnet test apps/api/AlertaYA.sln` (con Docker) · `cd apps/mobile && npx jest && npx tsc --noEmit && npx expo lint && npx expo-doctor` · `cd apps/web && npx vitest run && npx tsc --noEmit && npx next build` |
| **Estimated runtime** | ~30 s quick por componente; full con Docker ~3 min |

---

## Sampling Rate

- **After every task commit:** comando quick del componente tocado
- **After every plan wave:** suite completa por app + `npx expo lint` + `dotnet build`
- **Before `/gsd-verify-work`:** suite completa verde + recorrido manual en el teléfono de Roberto (SOS real, GPS apagado, modo avión, API reiniciada, worker apagado)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

> Los Task ID los asigna el planner; esta tabla mapea requisito → prueba y se completa con los IDs al planear.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | AUTH-01 | — | Validación de registro (nombre, correo, teléfono +57, contraseña) | unit TS | `npx jest features/auth` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-02 | — | Sin sesión → login; alerta activa → `/alert` | unit TS | `npx jest features/auth/routeGuard` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | CONT-01 | IDOR | Ownership 404, duplicado 409, E.164 | integración API + unit | `dotnet test --filter Category=Integration` / `npx jest lib/phone` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SOS-01 | — | Hold 2 s completa solo al cumplirse | unit TS | `npx jest components/holdProgress` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SOS-02 | — | Deadline absoluto; cancelar no llama red | unit TS | `npx jest features/alert/countdown` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SOS-03 | Idempotencia | Mismo `clientGeneratedId` → 1 alerta, 1 entrega por contacto | unit TS + .NET | `npx jest features/alert/pendingSync`; `dotnet test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SOS-04 | Veracidad | "Enviado" nunca sin `sent`; "Entregado" solo `delivered` | unit TS + .NET | `npx jest components/DeliveryStatus features/alert/headline` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NOTI-01 | Abuso SMS | `SmsTextBuilder` GSM-7/segmentos; dispatcher con `FakeSmsSender` | unit .NET | `dotnet test --filter "Category!=Integration"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NOTI-03 | Token público | Sin auth; null location; ventana 1 h; revocado → 404 | unit .NET + integración + vitest | `dotnet test`; `npx vitest run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NOTI-04 | Webhook falsificado | Worker muerto entre claim y envío → 1 SMS; firma inválida rechazada; callbacks fuera de orden | integración (Docker) | `dotnet test --filter Category=Integration` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | UBIC-02 | Coordenada sustituta | Sin GPS → `lastLocation=null`; (0,0) rechazado; sin coordenadas de Bogotá | unit .NET + grep | `dotnet test`; `git grep -n "4\.7110\|-74\.0721" -- apps` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | Máquina de estados | PATCH arbitrario | Matriz estados × estados incl. `finalizada` | unit .NET | `dotnet test AlertaYA.Domain.Tests` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/tests/AlertaYA.Domain.Tests`, `.Application.Tests`, `.Api.IntegrationTests` + referencia en `.sln`
- [ ] Docker Desktop instalado (integración, `db pull`, pgTAP) + SQL stub de `auth`/roles para Testcontainers
- [ ] `apps/mobile`: `jest.config.js` con preset `jest-expo`, script `test`
- [ ] `apps/web`: scaffold Next + `vitest.config.ts`
- [ ] `supabase/` (`supabase init`, `link`), baseline local sin aplicar al remoto
- [ ] `scripts/check-no-substitute-coords.sh`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Registro real y sesión persistente al reabrir | AUTH-01/02 | Dispositivo + Supabase real | Registrarse, cerrar la app, reabrir: sigue dentro |
| Vibración por segundo en la cuenta regresiva | SOS-02 | Háptica física | Pulsar SOS, sentir vibración cada segundo, cancelar |
| SMS real a celulares colombianos (Claro, Movistar, Tigo) | NOTI-01 | Red de operador real | Spike día 1: enviar a números verificados de los 3 operadores |
| GPS apagado → "ubicación pendiente" | UBIC-02 | Sensor real | Apagar GPS, disparar SOS, abrir link: sin coordenada |
| Modo avión / API reiniciada / worker apagado | SOS-03, SOS-04 | Fallas de red y proceso reales | Disparar SOS en modo avión, reconectar: 1 alerta, 1 SMS por contacto |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
