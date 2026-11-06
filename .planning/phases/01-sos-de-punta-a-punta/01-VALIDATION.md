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
| **Framework** | API: xUnit 2.9.3 + `FakeTimeProvider` (integración: Mvc.Testing contra el proyecto Supabase remoto `vzyasmeeyvbkpoiosses` con `ALERTAYA_TEST_DB`, en serie, usuarios `it-alertaya-…` que se limpian; D-22, sin Docker) · BD: pgTAP en el remoto (extensión habilitada por la migración de fase) ejecutado por `BdRemotaTests` (Npgsql, cada archivo envuelto en `begin;`/`rollback;`) + comparación de catálogo contra `supabase/catalog/remoto.txt` · Móvil: jest-expo ~57.0.5 + Jest 29 · Web: vitest 5.0.3 |
| **Config file** | none — la infraestructura de pruebas la crea la primera tarea que la necesita: `apps/api/tests/*` (01-04 T1), `supabase/catalog/` + `BdRemotaTests` (01-03 T1), `supabase/tests/` (01-03 T2), `BdRemotaFixture` (01-06 T1), `apps/mobile/jest.config.js` (01-11 T2), `apps/web/vitest.config.ts` (01-10 T1) |
| **Quick run command** | `dotnet test apps/api/AlertaYA.sln --filter "Category!=Integration"` (sin BD) · `npm --prefix apps/mobile test && npm --prefix apps/mobile run typecheck` · `npm --prefix apps/web run test` |
| **Full suite command** | `dotnet test apps/api/AlertaYA.sln` (con `ALERTAYA_TEST_DB` y el API real detenido; incluye pgTAP y catálogo de `BdRemotaTests`) · `npm --prefix apps/mobile test && npm --prefix apps/mobile run typecheck && npm --prefix apps/mobile run lint && (cd apps/mobile && npx expo-doctor)` · `npm --prefix apps/web run test && npm --prefix apps/web run typecheck && npm --prefix apps/web run build` · `git grep -n -e "4\.7110" -e "-74\.0721" -- apps; test $? -eq 1` |
| **Estimated runtime** | ~30 s quick por componente; full contra el remoto ~3–5 min (latencia de red y pruebas en serie) |

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
| 01-11-T2 | 01-11 | 4 | AUTH-01 | T-01-53 | Validación de registro (nombre, correo, teléfono +57, contraseña) | unit TS | `npm --prefix apps/mobile test -- phone validation` | ❌ se crea en la tarea | ⬜ pending |
| 01-03-T2 / 01-05-T3 | 01-03 / 01-05 | 2 / 3 | AUTH-01 (D-20) | T-01-09, T-01-10 | Trigger copia nombre/teléfono válidos de la metadata | pgTAP | `dotnet test apps/api/tests/AlertaYA.Api.IntegrationTests --filter "FullyQualifiedName~BdRemotaTests"` (contra el remoto, D-22) | ❌ se crea en 01-03 T2; corre en 01-05 T3 (ensayo con rollback y tras el push) | ⬜ pending |
| 01-11-T3 | 01-11 | 4 | AUTH-02 | T-01-50 | Sin sesión → login; sesión expirada → aviso | unit TS | `npm --prefix apps/mobile test -- routeGuard` | ❌ se crea en la tarea | ⬜ pending |
| 01-14-T3 | 01-14 | 8 | AUTH-02 / D-12 | — | Alerta activa → `/alert` al reabrir; reconciliación local/servidor | unit TS | `npm --prefix apps/mobile test -- routeGuard` | ❌ se crea en la tarea | ⬜ pending |
| 01-06-T3 | 01-06 | 4 | CONT-01 | T-01-19 (IDOR) | Ownership 404, duplicado 409, límite 10, E.164 | integración API + unit .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~TelefonoTests\|FullyQualifiedName~ContactsTests"` | ❌ se crea en la tarea | ⬜ pending |
| 01-12-T2 | 01-12 | 5 | CONT-01 | — | Validación de contacto, contador, mapeo de ProblemDetails | unit TS | `npm --prefix apps/mobile test -- contactForm problem` | ❌ se crea en la tarea | ⬜ pending |
| 01-13-T2 | 01-13 | 6 | SOS-01, SOS-02 | T-01-58 | Deadline absoluto; volver con deadline vencido dispara; SOS sin contactos | unit TS + manual (hold, vibración) | `npm --prefix apps/mobile test -- countdown deliveryStatus` | ❌ se crea en la tarea | ⬜ pending |
| 01-06-T1 | 01-06 | 4 | SOS-03 | T-01-20 | Mismo `clientGeneratedId` (serie y concurrente) → 1 alerta, 1 entrega por contacto | integración .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~CreateAlertTests"` | ❌ se crea en la tarea | ⬜ pending |
| 01-13-T3 | 01-13 | 6 | SOS-03 | T-01-60 | Sync reintenta con el mismo id; 400 no reintenta en bucle | unit TS | `npm --prefix apps/mobile test -- pendingSync` | ❌ se crea en la tarea | ⬜ pending |
| 01-13-T2 | 01-13 | 6 | SOS-04 | T-01-59 (veracidad) | "Enviado" solo con `enviado`; "Entregado" solo con `entregado` | unit TS | `npm --prefix apps/mobile test -- countdown deliveryStatus` | ❌ se crea en la tarea | ⬜ pending |
| 01-14-T2 | 01-14 | 8 | SOS-04 | T-01-63 | Titular honesto (4 casos) y cronómetro | unit TS | `npm --prefix apps/mobile test -- headline elapsed` | ❌ se crea en la tarea | ⬜ pending |
| 01-06-T2 | 01-06 | 4 | SOS-04 | T-01-19 | Estado real por contacto al dueño; 404 a otro usuario | integración .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~StatusTests"` | ❌ se crea en la tarea | ⬜ pending |
| 01-07-T2 | 01-07 | 5 | NOTI-01 | T-01-30 | `SmsTextBuilder` GSM-7/2 segmentos; reglas de reintento y códigos permanentes | unit .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~SmsTextBuilderTests\|FullyQualifiedName~DeliveryRulesTests"` | ❌ se crea en la tarea | ⬜ pending |
| 01-07-T3 | 01-07 | 5 | NOTI-04 | T-01-29 | Reinicio entre claim y envío → 1 SMS; concurrencia; alerta finalizada; worker apagado | integración .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~DispatchTests"` | ❌ se crea en la tarea | ⬜ pending |
| 01-08-T2 | 01-08 | 6 | NOTI-04, SOS-04 | T-01-33 (webhook falsificado) | Firma inválida 403; desorden; SID viejo; permanente; tercer fallo | integración .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~WebhookTests"` | ❌ se crea en la tarea | ⬜ pending |
| 01-03-T2 / 01-05-T3 | 01-03 / 01-05 | 2 / 3 | NOTI-04 | T-01-07 | `claim_deliveries` con SKIP LOCKED y lease; sin EXECUTE para anon/authenticated | pgTAP | `dotnet test apps/api/tests/AlertaYA.Api.IntegrationTests --filter "FullyQualifiedName~BdRemotaTests"` (contra el remoto, D-22) | ❌ se crea en 01-03 T2; corre en 01-05 T3 (ensayo con rollback y tras el push) | ⬜ pending |
| 01-09-T1 | 01-09 | 7 | NOTI-03 | T-01-37 (token público) | Sin auth; null location; inválido/revocado → 404; CORS; no-store | integración .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~PublicTrackingTests"` | ❌ se crea en la tarea | ⬜ pending |
| 01-09-T3 | 01-09 | 7 | NOTI-03 | T-01-38 | Ventana de 1 h (FakeTimeProvider); finish idempotente; a_salvo solo a quien recibió | integración .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~FinishTests"` | ❌ se crea en la tarea | ⬜ pending |
| 01-10-T1 | 01-10 | 8 | NOTI-03 | T-01-45 | Estados de la página (pendiente, activa, finalizada < y > 1 h, 404, 5xx, red) | vitest | `npm --prefix apps/web run test` | ❌ se crea en la tarea | ⬜ pending |
| 01-09-T2 | 01-09 | 7 | UBIC-02 | T-01-42 (coordenada sustituta) | `capturadaEn` real; (0,0)/rango/futuro → 400; sin coordenadas de Bogotá | integración .NET + grep | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~LocationTests"`; `git grep -n -e "4\.7110" -e "-74\.0721" -- apps; test $? -eq 1` | ❌ se crea en la tarea | ⬜ pending |
| 01-15-T1 | 01-15 | 9 | UBIC-02 | T-01-67 | Fix → payload válido; (0,0)/NaN rechazados; antigüedad con serverNow | unit TS | `npm --prefix apps/mobile test -- locationPayload age` | ❌ se crea en la tarea | ⬜ pending |
| 01-04-T2 | 01-04 | 2 | Máquina de estados | T-01-14 (PATCH arbitrario, eliminado en 01-06) | Matriz 7 × 7 incl. `finalizada` | unit .NET | `dotnet test apps/api/AlertaYA.sln --filter "FullyQualifiedName~AlertStateMachineTests"` | ❌ se crea en la tarea | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/tests/AlertaYA.Domain.Tests` y `AlertaYA.Api.IntegrationTests` + referencia en `.sln` (01-04 T1; `Application.Tests` se omite: la lógica pura vive en Domain y los handlers se prueban por integración)
- [ ] Sin Docker (D-22): `ALERTAYA_TEST_DB` definida (Session pooler del remoto, nunca versionada); `BdRemotaTests` (pgTAP + catálogo, 01-03) y `BdRemotaFixture` (aislamiento y limpieza de la integración, 01-06)
- [ ] `apps/mobile`: `jest.config.js` con preset `jest-expo` y scripts `test`, `typecheck`, `lint` (01-11)
- [ ] `apps/web`: scaffold Next + `vitest.config.ts` (01-10 T1)
- [ ] `supabase/` (`init`, `link`), baseline escrito desde la inspección de solo lectura e inventario `supabase/catalog/remoto.txt`, sin aplicar al remoto (01-03 T1)
- [ ] Guarda de coordenadas sustitutas como comando inline `git grep -n -e "4\.7110" -e "-74\.0721" -- apps; test $? -eq 1` (sin script aparte)

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
