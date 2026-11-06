---
phase: 01-sos-de-punta-a-punta
plan: 03
subsystem: database
tags: [supabase, postgres, pgtap, outbox, rls, migrations]

requires:
  - phase: 01-sos-de-punta-a-punta
    provides: "01-02: aprobacion de supabase CLI 2.120.0; 01-04: proyecto AlertaYA.Api.IntegrationTests"
provides:
  - "supabase/ inicializado (project_id alertaya) y vinculado a vzyasmeeyvbkpoiosses"
  - "supabase/migrations/20261105130917_baseline.sql: esquema remoto versionado (D-16, D-22)"
  - "supabase/catalog/inventario.sql + remoto.txt (135 objetos): deteccion de deriva en lugar de db diff"
  - "supabase/migrations/20261105133809_fase1_sos.sql: todos los cambios de esquema de la fase"
  - "supabase/tests/fase1_sos_test.sql: 28 aserciones pgTAP"
  - "BdRemotaTests: CatalogoCoincide y PgTap (con ALERTAYA_PGTAP_PRELUDIO)"
affects: [01-05, 01-06, 01-07, 01-08, 01-09]

actuals:
  tasks: 2
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Outbox en Postgres con private.claim_deliveries (SKIP LOCKED + lease), sin Hangfire"
    - "Pruebas de BD contra el remoto siempre dentro de begin/rollback; el runner rechaza archivos que no lo cumplan"
---

# 01-03 — Esquema versionado y migración de la fase

## Resultado

| Verificación | Resultado |
|---|---|
| `BdRemotaTests.CatalogoCoincide` (sin actualizar) | ✅ pasa |
| Baseline cubre cada objeto de `remoto.txt` (node) | ✅ |
| `migration list --linked` | ✅ columna Remote vacía (baseline y fase1_sos solo en Local) |
| `dotnet build apps/api/AlertaYA.sln` | ✅ |
| `supabase/tests/*.sql` envueltos en `begin;`/`rollback;` | ✅ |
| Ensayo: `PgTap` con la migración inyectada (`ALERTAYA_PGTAP_PRELUDIO`) | ✅ 28/28 ok, todo revertido |
| Control negativo: una aserción rota a propósito | ✅ el runner reporta `not ok 3` y falla |
| `git grep -i "password="` en `supabase/` y el runner | ✅ vacío |

## Lo que dejó la inspección del remoto (para 01-05 a 01-09)

- **CHECK de `alerts.estado`:** `alerts_estado_check` (pendiente, activa, verificando, escalada, atendida, descartada). La migración lo reemplaza con el mismo nombre y agrega `finalizada`.
- **`public.handle_new_user` actual:** `plpgsql`, `security definer`, `set search_path to 'public'`; inserta `(id, correo, nombre, telefono)` con `(new.id, new.email, '', '')`. No lee `raw_user_meta_data`.
- **Trigger `on_auth_user_created`:** existe en el remoto (`after insert on auth.users for each row`).
- **Policies:**
  - `alerts`: `alerts_select_own`, `alerts_insert_own` (sin UPDATE ni DELETE).
  - `profiles`: duplicadas en inglés y español: `profiles_select_own`, `profiles_insert_own`, `profiles_update_own`, "usuarios pueden ver su propio perfil", "usuarios pueden crear su propio perfil", "usuarios pueden actualizar su propio perfil".
  - `emergency_contacts`: `emergency_contacts_select_own`, `_insert_own`, `_update_own`, `_delete_own`.
  - `alert_locations`: `alert_locations_select_own`, `alert_locations_insert_own`.
- **Índice único `(user_id, client_generated_id)`:** existe, `ix_alerts_user_id_client_generated_id`.
- **Unique de teléfono por usuario en `emergency_contacts`:** no existe.
- **Acciones `on delete` de las FKs** (las usa la limpieza de pruebas de 01-06):

| FK | Referencia | on delete |
|---|---|---|
| `profiles_id_fkey` | auth.users | cascade |
| `officers_id_fkey` | auth.users | cascade |
| `alerts_user_id_fkey` | profiles | cascade |
| `emergency_contacts_user_id_fkey` | profiles | cascade |
| `alert_locations_alert_id_fkey` | alerts | cascade |
| `verification_logs_alert_id_fkey` | alerts | cascade |
| `officer_decisions_alert_id_fkey` | alerts | **no action** (bloquea borrar una alerta con decisiones) |
| `officer_decisions_officer_id_fkey` | officers | no action (on update cascade) |
| `officer_duty_log_officer_id_fkey`, `_cai_id_fkey`, `officers_cai_id_fkey` | officers / cais | no action |
| Nuevas: `tracking_links.alert_id`, `notification_deliveries.alert_id` | alerts | cascade |
| Nueva: `notification_deliveries.contact_id` | emergency_contacts | set null |

Borrar el usuario de prueba en `auth.users` limpia en cascada perfil, contactos, alertas, ubicaciones, enlaces y entregas, siempre que la alerta no tenga `officer_decisions`.

- **FKs que no tenían índice (8), indexadas en la migración:** `alert_locations.alert_id`, `emergency_contacts.user_id`, `officer_decisions.alert_id`, `officer_decisions.officer_id`, `officer_duty_log.cai_id`, `officer_duty_log.officer_id`, `officers.cai_id`, `verification_logs.alert_id`. `alerts.user_id` ya lo cubría el índice único.
- **Extensiones:** postgis, pgcrypto y uuid-ossp en `extensions`; pg_stat_statements; supabase_vault. **pgtap 1.3.3 está disponible** (confirma el supuesto del plan).
- **No previsto en INTEGRATIONS:** el event trigger `ensure_rls` → `public.rls_auto_enable()` activa RLS en cada tabla nueva de `public`. Queda en el baseline.

## Desviaciones

1. **Ensayo adelantado de 01-05.** Roberto dio control total de SQL sobre esta BD (2026-11-05), así que el ensayo con la migración inyectada se corrió aquí, dentro de `begin;`/`rollback;`. No se escribió nada en el remoto: `CatalogoCoincide` sigue en verde y el historial remoto vacío después del ensayo. 01-05 conserva el push real y el `migration repair` del baseline.
2. **Proyecto pausado.** El proyecto gratuito estaba pausado por inactividad; Roberto lo restauró. Datos intactos (1 usuario, 1 alerta, 6 ubicaciones).
3. **Host del pooler.** Se tomó de `supabase/.temp/pooler-url` (generado por `link`, ignorado por git): `aws-0-us-west-2.pooler.supabase.com`.
4. **`inventario.sql`** colapsa los espacios de `qual`/`with_check` de las policies para mantener una línea por objeto.

## Pendiente para 01-05

- Mostrar a Roberto el SQL de `fase1_sos` y, con su aprobación: `migration repair 20261105130917 --status applied`, `db push`, luego `PgTap` sin preludio y `CatalogoCoincide` con `ALERTAYA_ACTUALIZAR_CATALOGO=1`.
