begin;
-- Pruebas de la migracion fase1_sos. Corren contra el remoto (D-22) con BdRemotaTests.PgTap:
-- todo va dentro de begin/rollback, incluidas las filas de prueba y lo que reclame claim_deliveries.
-- now() es constante dentro de la transaccion: los tiempos de abajo son deterministas.

select plan(28);

-- Datos de prueba (ids fijos con prefijo reconocible)
insert into auth.users (id, email, raw_user_meta_data) values
    ('00000000-0000-4000-a000-000000000001', 'pgtap-ana@example.com', '{"nombre":"Ana Garcia","telefono":"+573001234567"}'),
    ('00000000-0000-4000-a000-000000000002', 'pgtap-malo@example.com', '{"nombre":"Telefono Malo","telefono":"abc"}');

insert into public.emergency_contacts (id, user_id, nombre, telefono) values
    ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'Contacto 1', '+573001111111'),
    ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 'Contacto 2', '+573002222222'),
    ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000001', 'Contacto 3', '+573003333333');

insert into public.alerts (id, user_id, estado, canal_activacion) values
    ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000001', 'activa', 'boton_pulsado');

-- Test 1: cuenta regresiva de 5 s (D-02)
select col_default_is('public', 'profiles', 'ventana_confirmacion_segundos', '5'::text, 'default de la cuenta regresiva es 5');
select is((select count(*)::int from public.profiles where ventana_confirmacion_segundos = 4), 0, 'no quedan perfiles con 4 s');

-- Test 2: perfil desde la metadata del signUp (D-20)
select is((select nombre from public.profiles where id = '00000000-0000-4000-a000-000000000001'), 'Ana Garcia', 'nombre copiado de la metadata');
select is((select telefono from public.profiles where id = '00000000-0000-4000-a000-000000000001'), '+573001234567', 'celular E.164 copiado');
select is((select telefono from public.profiles where id = '00000000-0000-4000-a000-000000000002'), '', 'telefono invalido queda vacio');

-- Test 3: estado finalizada (D-09)
select lives_ok(
    $$ insert into public.alerts (user_id, estado, canal_activacion) values ('00000000-0000-4000-a000-000000000001', 'finalizada', 'boton_pulsado') $$,
    'alerts acepta finalizada');
select throws_ok(
    $$ insert into public.alerts (user_id, estado, canal_activacion) values ('00000000-0000-4000-a000-000000000001', 'inventado', 'boton_pulsado') $$,
    '23514', null, 'alerts rechaza un estado inventado');

-- Entregas de prueba: d1 en cola, d2 enviando con lease vencido, d3 reintento a futuro
insert into public.notification_deliveries (id, alert_id, contact_id, tipo, estado, contacto_nombre, contacto_telefono, intentos, proximo_intento_en, lease_hasta) values
    ('00000000-0000-4000-d000-000000000001', '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 'alerta', 'en_cola', 'Contacto 1', '+573001111111', 0, now(), null),
    ('00000000-0000-4000-d000-000000000002', '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000002', 'alerta', 'enviando', 'Contacto 2', '+573002222222', 1, now() - interval '2 minutes', now() - interval '1 minute'),
    ('00000000-0000-4000-d000-000000000003', '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000003', 'alerta', 'reintento', 'Contacto 3', '+573003333333', 1, now() + interval '1 hour', null);

-- Test 4: un SMS por contacto (SOS-03)
select throws_ok(
    $$ insert into public.notification_deliveries (alert_id, contact_id, tipo, contacto_nombre, contacto_telefono)
       values ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 'alerta', 'Contacto 1', '+573001111111') $$,
    '23505', null, 'segunda entrega del mismo tipo y canal al mismo contacto falla');

-- Test 5: claim_deliveries (NOTI-04). Filtra por la alerta de prueba: el remoto puede tener otras filas.
select set_eq(
    $$ select id from private.claim_deliveries(1000, interval '30 seconds') where alert_id = '00000000-0000-4000-c000-000000000001' $$,
    $$ values ('00000000-0000-4000-d000-000000000001'::uuid), ('00000000-0000-4000-d000-000000000002'::uuid) $$,
    'reclama la fila en cola y la enviando con lease vencido');
select is((select estado from public.notification_deliveries where id = '00000000-0000-4000-d000-000000000001'), 'enviando', 'la fila reclamada queda enviando');
select is((select intentos from public.notification_deliveries where id = '00000000-0000-4000-d000-000000000001'), 1, 'intentos + 1 al reclamar');
select ok((select lease_hasta > now() from public.notification_deliveries where id = '00000000-0000-4000-d000-000000000001'), 'lease en el futuro');
select is_empty(
    $$ select id from private.claim_deliveries(1000, interval '30 seconds') where alert_id = '00000000-0000-4000-c000-000000000001' $$,
    'una segunda llamada inmediata no reclama nada');
select is((select estado from public.notification_deliveries where id = '00000000-0000-4000-d000-000000000003'), 'reintento', 'reintento a futuro no se reclama');

-- Test 6: nada expuesto a anon/authenticated (T-01-07, T-01-08)
select has_table('public', 'tracking_links', 'existe tracking_links');
select has_table('public', 'notification_deliveries', 'existe notification_deliveries');
select has_function('private', 'claim_deliveries', array['integer', 'interval'], 'existe private.claim_deliveries');
select ok(not has_function_privilege('anon', 'private.claim_deliveries(integer, interval)', 'execute'), 'anon no ejecuta claim_deliveries');
select ok(not has_function_privilege('authenticated', 'private.claim_deliveries(integer, interval)', 'execute'), 'authenticated no ejecuta claim_deliveries');
select ok(not has_table_privilege('anon', 'public.notification_deliveries', 'select'), 'anon no lee notification_deliveries');
select ok(not has_table_privilege('authenticated', 'public.notification_deliveries', 'select'), 'authenticated no lee notification_deliveries');
select ok(not has_table_privilege('anon', 'public.tracking_links', 'select'), 'anon no lee tracking_links');
select ok(not has_table_privilege('authenticated', 'public.tracking_links', 'select'), 'authenticated no lee tracking_links');
select ok((select relrowsecurity from pg_class where oid = 'public.tracking_links'::regclass), 'tracking_links con RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.notification_deliveries'::regclass), 'notification_deliveries con RLS');

-- Test 7: ninguna FK de public sin indice que la cubra
select is((
    select count(*)::int from pg_constraint c
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace
      and not exists (
          select 1 from pg_index i
          where i.indrelid = c.conrelid
            and (string_to_array(i.indkey::text, ' ')::int2[])[1:array_length(c.conkey, 1)] = c.conkey)
), 0, 'todas las FKs de public tienen indice');

-- Test 8: policies de alerts con (select auth.uid())
select ok((select count(*) > 0 from pg_policies where schemaname = 'public' and tablename = 'alerts'), 'alerts tiene policies');
select is((
    select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'alerts'
      and coalesce(qual, '') || coalesce(with_check, '') not ilike '%select auth.uid()%'
), 0, 'toda policy de alerts usa (select auth.uid())');

select * from finish();
rollback;
