-- Inventario de solo lectura del catalogo remoto (D-22): reemplaza a `supabase db diff` sin Docker.
-- Una linea por objeto: tipo<TAB>nombre<TAB>detalle. Excluye objetos de extensiones (pg_depend deptype 'e')
-- y no incluye versiones de extensiones para que una actualizacion de Supabase no genere ruido.
-- Lo ejecuta BdRemotaTests.CatalogoCoincide y lo compara con supabase/catalog/remoto.txt.
with de_extension as (
    select objid from pg_depend where deptype = 'e'
),
tablas as (
    select c.oid, n.nspname || '.' || c.relname as nombre, c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relkind in ('r', 'p')
      and c.oid not in (select objid from de_extension)
)
select linea from (
    select 'tabla' || E'\t' || t.nombre || E'\t' || 'rls=' || t.relrowsecurity as linea
    from tablas t

    union all
    select 'columna' || E'\t' || t.nombre || '.' || a.attname || E'\t'
        || format_type(a.atttypid, a.atttypmod)
        || case when a.attnotnull then ' not null' else '' end
        || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')
    from tablas t
    join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum

    union all
    select 'restriccion' || E'\t' || t.nombre || '.' || co.conname || E'\t' || pg_get_constraintdef(co.oid)
    from tablas t
    join pg_constraint co on co.conrelid = t.oid

    union all
    select 'indice' || E'\t' || t.nombre || '.' || ic.relname || E'\t' || pg_get_indexdef(i.indexrelid)
    from tablas t
    join pg_index i on i.indrelid = t.oid
    join pg_class ic on ic.oid = i.indexrelid

    union all
    select 'policy' || E'\t' || p.schemaname || '.' || p.tablename || '.' || p.policyname || E'\t'
        || p.cmd || ' roles=' || array_to_string(p.roles, ',')
        -- qual/with_check traen saltos de linea: se colapsan para mantener una linea por objeto.
        || ' using=' || regexp_replace(coalesce(p.qual, ''), '\s+', ' ', 'g')
        || ' check=' || regexp_replace(coalesce(p.with_check, ''), '\s+', ' ', 'g')
    from pg_policies p
    where p.schemaname in ('public', 'private')

    union all
    select 'funcion' || E'\t' || n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
        || E'\t' || md5(pg_get_functiondef(p.oid))
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prokind = 'f'
      and p.oid not in (select objid from de_extension)

    union all
    select 'trigger' || E'\t' || n.nspname || '.' || c.relname || '.' || tg.tgname || E'\t' || pg_get_triggerdef(tg.oid)
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not tg.tgisinternal
      and (n.nspname in ('public', 'private') or (n.nspname = 'auth' and c.relname = 'users'))

    union all
    select 'extension' || E'\t' || e.extname || E'\t' || n.nspname
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
) inventario
order by linea collate "C";
