-- RutaViva: mail diario de novedades (pg_cron + pg_net llaman a la función novedades-diarias)
create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists privado;
create table if not exists privado.config (k text primary key, v text not null);
revoke all on schema privado from public, anon, authenticated;
insert into privado.config (k, v) values ('cron_key', encode(extensions.gen_random_bytes(24), 'hex')) on conflict (k) do nothing;
insert into privado.config (k, v) values ('novedades_hasta', '2026-11-27') on conflict (k) do nothing;

create or replace function public.rv_config_get(p_k text) returns text language sql security definer set search_path = '' as $$
  select v from privado.config where k = p_k $$;
create or replace function public.rv_config_set(p_k text, p_v text) returns void language sql security definer set search_path = '' as $$
  insert into privado.config (k, v) values (p_k, p_v) on conflict (k) do update set v = excluded.v $$;
revoke all on function public.rv_config_get(text) from public, anon, authenticated;
revoke all on function public.rv_config_set(text, text) from public, anon, authenticated;
grant execute on function public.rv_config_get(text) to service_role;
grant execute on function public.rv_config_set(text, text) to service_role;

-- todos los días a las 20:00 de Argentina (23:00 UTC)
select cron.unschedule('rv-novedades') where exists (select 1 from cron.job where jobname = 'rv-novedades');
select cron.schedule('rv-novedades', '0 23 * * *', $$
  select net.http_post(
    url := 'https://aaabcjynoimkhrisyyhd.supabase.co/functions/v1/novedades-diarias',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-key', (select v from privado.config where k = 'cron_key')),
    body := '{}'::jsonb, timeout_milliseconds := 60000)
$$);
