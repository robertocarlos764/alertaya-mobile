-- Baseline: esquema public del proyecto remoto vzyasmeeyvbkpoiosses tal como estaba el 2026-11-05,
-- escrito a mano desde la inspeccion de solo lectura del catalogo (D-22, sin Docker ni db dump).
-- Nombres de restricciones, indices y policies son los reales del remoto.
-- No se aplica al remoto (ya tiene este esquema): en 01-05 se marca como aplicado con
-- `migration repair --status applied`, previa confirmacion de Roberto.
--
-- Extensiones que el proyecto trae de fabrica y no se crean aqui: plpgsql, pg_stat_statements,
-- supabase_vault. Las que usa el esquema se declaran abajo.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ------------------------------------------------------------------
-- Ciudadano
-- ------------------------------------------------------------------

create table public.profiles (
    id uuid not null,
    nombre text not null,
    telefono text not null,
    palabra_clave text,
    creado_en timestamptz default now(),
    correo text,
    ventana_confirmacion_segundos integer not null default 4,
    modo_silencioso boolean not null default false,
    constraint profiles_pkey primary key (id),
    constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade
);

create table public.emergency_contacts (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    nombre text not null,
    telefono text not null,
    relacion text,
    creado_en timestamptz default now(),
    constraint emergency_contacts_pkey primary key (id),
    constraint emergency_contacts_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);

create table public.alerts (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    estado text not null default 'pendiente',
    canal_activacion text not null,
    nivel_prioridad_ia text,
    ubicacion extensions.geography(Point, 4326),
    ubicacion_precision_metros numeric,
    ubicacion_fuente text,
    creado_en timestamptz default now(),
    actualizado_en timestamptz default now(),
    client_generated_id uuid,
    constraint alerts_pkey primary key (id),
    constraint alerts_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
    constraint alerts_estado_check check (estado = any (array['pendiente', 'activa', 'verificando', 'escalada', 'atendida', 'descartada'])),
    constraint alerts_canal_activacion_check check (canal_activacion = any (array['boton_pulsado', 'voz', 'boton_fisico'])),
    constraint alerts_nivel_prioridad_ia_check check (nivel_prioridad_ia = any (array['critico', 'medio', 'posible_falso_positivo'])),
    constraint alerts_ubicacion_fuente_check check (ubicacion_fuente = any (array['gps', 'celular', 'cache']))
);

create unique index ix_alerts_user_id_client_generated_id on public.alerts using btree (user_id, client_generated_id);

create table public.alert_locations (
    id uuid not null default gen_random_uuid(),
    alert_id uuid not null,
    ubicacion extensions.geography(Point, 4326) not null,
    precision_metros numeric,
    fuente text not null,
    creado_en timestamptz default now(),
    constraint alert_locations_pkey primary key (id),
    constraint alert_locations_alert_id_fkey foreign key (alert_id) references public.alerts(id) on delete cascade,
    constraint alert_locations_fuente_check check (fuente = any (array['gps', 'celular', 'cache']))
);

create table public.verification_logs (
    id uuid not null default gen_random_uuid(),
    alert_id uuid not null,
    movimiento_score numeric,
    audio_ambiente_score numeric,
    consistencia_ubicacion boolean,
    hora_del_dia time,
    nivel_asignado text,
    creado_en timestamptz default now(),
    constraint verification_logs_pkey primary key (id),
    constraint verification_logs_alert_id_fkey foreign key (alert_id) references public.alerts(id) on delete cascade,
    constraint verification_logs_nivel_asignado_check check (nivel_asignado = any (array['critico', 'medio', 'posible_falso_positivo']))
);

-- ------------------------------------------------------------------
-- Policia
-- ------------------------------------------------------------------

create table public.cais (
    id uuid not null default gen_random_uuid(),
    nombre text not null,
    telefono text not null,
    direccion text not null,
    ubicacion extensions.geography(Point, 4326),
    comandante_nombre text not null,
    creado_en timestamptz default now(),
    constraint cais_pkey primary key (id)
);

create table public.officers (
    id uuid not null,
    nombre text not null,
    cai_id uuid,
    rol text not null default 'oficial',
    activo boolean not null default true,
    creado_en timestamptz default now(),
    constraint officers_pkey primary key (id),
    constraint officers_id_fkey foreign key (id) references auth.users(id) on delete cascade,
    constraint officers_cai_id_fkey foreign key (cai_id) references public.cais(id),
    constraint officers_rol_check check (rol = any (array['oficial', 'supervisor', 'control_interno']))
);

create table public.officer_duty_log (
    id uuid not null default gen_random_uuid(),
    officer_id uuid not null,
    cai_id uuid,
    tipo_evento text not null,
    creado_en timestamptz default now(),
    constraint officer_duty_log_pkey primary key (id),
    constraint officer_duty_log_officer_id_fkey foreign key (officer_id) references public.officers(id),
    constraint officer_duty_log_cai_id_fkey foreign key (cai_id) references public.cais(id),
    constraint officer_duty_log_tipo_evento_check check (tipo_evento = any (array['entrada', 'salida']))
);

create table public.officer_decisions (
    id uuid not null default gen_random_uuid(),
    alert_id uuid not null,
    officer_id uuid not null,
    decision text not null,
    tiempo_respuesta_segundos integer,
    accion_tomada text,
    creado_en timestamptz default now(),
    constraint officer_decisions_pkey primary key (id),
    constraint officer_decisions_alert_id_fkey foreign key (alert_id) references public.alerts(id),
    constraint officer_decisions_officer_id_fkey foreign key (officer_id) references public.officers(id) on update cascade,
    constraint officer_decisions_decision_check check (decision = any (array['critico', 'medio', 'posible_falso_positivo', 'descartado']))
);

-- ------------------------------------------------------------------
-- RLS (las tablas de policia y verification_logs no tienen policies: solo service_role)
-- ------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_locations enable row level security;
alter table public.verification_logs enable row level security;
alter table public.cais enable row level security;
alter table public.officers enable row level security;
alter table public.officer_duty_log enable row level security;
alter table public.officer_decisions enable row level security;

-- profiles: el remoto tiene las policies duplicadas (ingles y espanol); se conservan tal cual.
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);
create policy "usuarios pueden ver su propio perfil" on public.profiles for select using (auth.uid() = id);
create policy "usuarios pueden crear su propio perfil" on public.profiles for insert with check (auth.uid() = id);
create policy "usuarios pueden actualizar su propio perfil" on public.profiles for update using (auth.uid() = id);

create policy emergency_contacts_select_own on public.emergency_contacts for select using (auth.uid() = user_id);
create policy emergency_contacts_insert_own on public.emergency_contacts for insert with check (auth.uid() = user_id);
create policy emergency_contacts_update_own on public.emergency_contacts for update using (auth.uid() = user_id);
create policy emergency_contacts_delete_own on public.emergency_contacts for delete using (auth.uid() = user_id);

create policy alerts_select_own on public.alerts for select using (auth.uid() = user_id);
create policy alerts_insert_own on public.alerts for insert with check (auth.uid() = user_id);

create policy alert_locations_select_own on public.alert_locations for select
    using (exists (select 1 from public.alerts where alerts.id = alert_locations.alert_id and alerts.user_id = auth.uid()));
create policy alert_locations_insert_own on public.alert_locations for insert
    with check (exists (select 1 from public.alerts where alerts.id = alert_locations.alert_id and alerts.user_id = auth.uid()));

-- ------------------------------------------------------------------
-- Funciones y triggers
-- ------------------------------------------------------------------

-- Version actual: no lee raw_user_meta_data (la migracion de la fase 1 la reescribe, D-20).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, correo, nombre, telefono)
  values (new.id, new.email, '', '');
  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

-- Activa RLS en toda tabla nueva de public (event trigger ensure_rls del remoto).
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

do $$
begin
    if not exists (select 1 from pg_event_trigger where evtname = 'ensure_rls') then
        create event trigger ensure_rls on ddl_command_end
            when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
            execute function public.rls_auto_enable();
    end if;
end
$$;
