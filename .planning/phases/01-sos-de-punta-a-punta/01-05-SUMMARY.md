---
phase: 01-sos-de-punta-a-punta
plan: 05
subsystem: database
tags: [supabase, migrations, pgtap, auth]

requires:
  - phase: 01-sos-de-punta-a-punta
    provides: "01-03: baseline, migracion fase1_sos, pruebas pgTAP y BdRemotaTests"
provides:
  - "Remoto vzyasmeeyvbkpoiosses con el esquema de la fase 1 aplicado y verificado"
  - "supabase/catalog/remoto.txt regenerado despues del push (referencia de deriva)"
  - "Politica de Auth registrada para 01-11"
affects: [01-06, 01-07, 01-08, 01-09, 01-11]

actuals:
  tasks: 3
  commits: 1
---

# 01-05 — Esquema aplicado al remoto

## Decisión de Roberto (Tarea 2)

**aplicar-6**, elegida el 2026-11-05 después de revisar `supabase/migrations/20261105133809_fase1_sos.sql`.

## Política de Auth (la consume 01-11)

| Campo (Management API) | Valor | Cambio |
|---|---|---|
| `mailer_autoconfirm` (Confirm email desactivado) | `true` | ninguno: ya estaba así |
| `password_min_length` | `6` | ninguno: ya estaba así |
| `password_hibp_enabled` (contraseñas filtradas) | `false` | ninguno (plan gratuito) |

No se llamó al `PATCH` de `config/auth`: el `GET` previo ya mostraba los valores de la opción elegida.

## Secuencia ejecutada

1. Tarea 1 (solo lectura): `migration list --linked` con Remote vacío; `CatalogoCoincide` en verde (sin deriva desde 01-03).
2. Ensayo: `PgTap` con `ALERTAYA_PGTAP_PRELUDIO=supabase/migrations/20261105133809_fase1_sos.sql` → 28/28 ok, revertido. `CatalogoCoincide` siguió en verde después del ensayo.
3. `migration repair --status applied 20261105130917 --linked` → "Repaired migration history: [20261105130917] => applied" (CLI, sin INSERT manual).
4. `db push --linked --dry-run` → solo `20261105133809_fase1_sos.sql`.
5. `db push --linked` → "Applying migration 20261105133809_fase1_sos.sql... Finished".

## Verificación posterior

| Verificación | Resultado |
|---|---|
| `migration list --linked` | ✅ ambas versiones en Local y Remote |
| `BdRemotaTests.PgTap` sin preludio | ✅ 28/28 contra el esquema aplicado |
| `BdRemotaTests` completo (pgTAP + catálogo) | ✅ 2/2 |
| `remoto.txt` contiene notification_deliveries, tracking_links, claim_deliveries, pgtap, finalizada_en, capturada_en | ✅ |
| GET `config/auth` | ✅ `mailer_autoconfirm=true`, `password_min_length=6` |

## Diff del catálogo (`remoto.txt`: +60 / −5)

- **Reemplazadas (5):** `profiles.ventana_confirmacion_segundos` (default 4 → 5), `public.handle_new_user()` (lee la metadata), `alerts_estado_check` (con `finalizada`), policies `alerts_select_own` y `alerts_insert_own` (con `(select auth.uid())`).
- **Nuevas (60):** extensión `pgtap`; `private.claim_deliveries(p_limite integer, p_lease interval)`; tablas `tracking_links` y `notification_deliveries` con sus columnas, restricciones e índices; columnas `alerts.finalizada_en` y `alert_locations.capturada_en`; 8 índices de FKs.
- No aparece ni desaparece ningún objeto ajeno a la migración.

## Notas

- El remoto es desde ahora también la BD de las pruebas de integración (D-22).
- El único `update` de datos fue el perfil existente: cuenta regresiva de 4 a 5 s.
