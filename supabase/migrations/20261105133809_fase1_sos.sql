-- Fase 1 (SOS de punta a punta): todos los cambios de esquema de la fase en una sola migracion,
-- para que Roberto la apruebe una sola vez (plan 01-05). Pruebas: supabase/tests/fase1_sos_test.sql.

-- 1. Esquema privado y pgTAP (D-22: las pruebas corren contra el remoto)
create schema if not exists private;
create extension if not exists pgtap with schema extensions;

-- 2. Perfiles (D-02): cuenta regresiva de 5 s. Nadie pudo fijar otro valor (ProfilesController lo rechaza).
alter table public.profiles alter column ventana_confirmacion_segundos set default 5;
update public.profiles set ventana_confirmacion_segundos = 5 where ventana_confirmacion_segundos = 4;

-- 3. Alertas (D-09): estado terminal "finalizada" ("Estoy a salvo")
alter table public.alerts add column finalizada_en timestamptz null;
alter table public.alerts drop constraint alerts_estado_check;
alter table public.alerts add constraint alerts_estado_check
    check (estado = any (array['pendiente', 'activa', 'verificando', 'escalada', 'atendida', 'descartada', 'finalizada']));

-- 4. Ubicaciones (UBIC-02): hora del fix del GPS; nula en filas viejas
alter table public.alert_locations add column capturada_en timestamptz null;

-- 5. Enlace de seguimiento (D-07): solo el hash SHA-256 del token
create table public.tracking_links (
    id uuid primary key default gen_random_uuid(),
    alert_id uuid not null unique references public.alerts(id) on delete cascade,
    token_hash bytea not null unique,
    revocado_en timestamptz null,
    creado_en timestamptz not null default now()
);

-- 6. Outbox y registro visible por contacto (NOTI-04, D-11): 1 envio + 2 reintentos.
-- contacto_telefono sin CHECK de formato: un contacto viejo mal formado no debe impedir el SOS;
-- Twilio lo rechaza y queda como fallido honesto.
create table public.notification_deliveries (
    id uuid primary key default gen_random_uuid(),
    alert_id uuid not null references public.alerts(id) on delete cascade,
    contact_id uuid null references public.emergency_contacts(id) on delete set null,
    canal text not null default 'sms' check (canal in ('sms')),
    tipo text not null check (tipo in ('alerta', 'a_salvo')),
    estado text not null default 'en_cola'
        check (estado in ('en_cola', 'enviando', 'enviado', 'entregado', 'fallido', 'reintento', 'cancelado')),
    contacto_nombre text not null,
    contacto_telefono text not null,
    intentos int not null default 0,
    proximo_intento_en timestamptz not null default now(),
    lease_hasta timestamptz null,
    proveedor_sid text null unique,
    codigo_error int null,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    constraint notification_deliveries_unica_por_contacto unique (alert_id, contact_id, canal, tipo)
);

create index ix_notification_deliveries_pendientes on public.notification_deliveries (proximo_intento_en)
    where estado in ('en_cola', 'reintento', 'enviando');
create index ix_notification_deliveries_alert_id on public.notification_deliveries (alert_id);
create index ix_notification_deliveries_contact_id on public.notification_deliveries (contact_id);

-- 7. Reclamo del outbox: SKIP LOCKED + lease; recupera "enviando" con lease vencido tras un reinicio.
-- Funcion (no CTE suelto) para que EF Core la pueda componer con FromSql. En "private" para que
-- PostgREST no la exponga como RPC (Pitfall 12).
create or replace function private.claim_deliveries(p_limite int, p_lease interval)
returns setof public.notification_deliveries
language sql
set search_path = ''
as $$
    with siguientes as (
        select id
        from public.notification_deliveries
        where (estado in ('en_cola', 'reintento') and proximo_intento_en <= now())
           or (estado = 'enviando' and lease_hasta < now())
        order by proximo_intento_en
        limit p_limite
        for update skip locked
    )
    update public.notification_deliveries d
       set estado = 'enviando',
           lease_hasta = now() + p_lease,
           intentos = d.intentos + 1,
           actualizado_en = now()
      from siguientes
     where d.id = siguientes.id
    returning d.*;
$$;

revoke all on function private.claim_deliveries(int, interval) from public, anon, authenticated;

-- 8. Tablas nuevas: RLS sin policies y sin acceso para anon/authenticated.
-- El API conecta con un rol que omite RLS y aplica ownership en codigo.
alter table public.tracking_links enable row level security;
alter table public.notification_deliveries enable row level security;
revoke all on public.tracking_links from anon, authenticated;
revoke all on public.notification_deliveries from anon, authenticated;

-- 9. Perfil desde el registro (D-20): nombre y telefono de raw_user_meta_data del signUp.
-- Telefono solo si es celular colombiano E.164; si no, vacio (nunca bloquea el registro).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_telefono text := btrim(coalesce(new.raw_user_meta_data->>'telefono', ''));
begin
    insert into public.profiles (id, correo, nombre, telefono)
    values (
        new.id,
        new.email,
        left(btrim(coalesce(new.raw_user_meta_data->>'nombre', '')), 100),
        case when v_telefono ~ '^\+573[0-9]{9}$' then v_telefono else '' end
    );
    return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

-- 10. Indices de las 8 FKs de public que no tenian (advisor; alerts.user_id ya lo cubre
-- ix_alerts_user_id_client_generated_id). Las FKs nuevas ya tienen indice arriba.
create index if not exists ix_alert_locations_alert_id on public.alert_locations (alert_id);
create index if not exists ix_emergency_contacts_user_id on public.emergency_contacts (user_id);
create index if not exists ix_officer_decisions_alert_id on public.officer_decisions (alert_id);
create index if not exists ix_officer_decisions_officer_id on public.officer_decisions (officer_id);
create index if not exists ix_officer_duty_log_cai_id on public.officer_duty_log (cai_id);
create index if not exists ix_officer_duty_log_officer_id on public.officer_duty_log (officer_id);
create index if not exists ix_officers_cai_id on public.officers (cai_id);
create index if not exists ix_verification_logs_alert_id on public.verification_logs (alert_id);

-- 11. Policies de alerts con (select auth.uid()): se evalua una vez por consulta, no por fila.
drop policy alerts_select_own on public.alerts;
drop policy alerts_insert_own on public.alerts;
create policy alerts_select_own on public.alerts for select using ((select auth.uid()) = user_id);
create policy alerts_insert_own on public.alerts for insert with check ((select auth.uid()) = user_id);
