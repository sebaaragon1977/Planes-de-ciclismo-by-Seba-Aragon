-- RutaViva: agenda de encuentros para pedalear juntos
alter table public.perfiles add column if not exists zona text; -- zona horaria del navegador (ej. Europe/Madrid)

create table if not exists public.encuentros (
  id bigint generated always as identity primary key,
  creador uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ruta text not null,
  ruta_id text,
  fecha timestamptz not null,
  nota text,
  notificado timestamptz,
  creado timestamptz not null default now()
);
create table if not exists public.encuentros_asistentes (
  encuentro_id bigint not null references public.encuentros(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (encuentro_id, user_id)
);
alter table public.encuentros enable row level security;
alter table public.encuentros_asistentes enable row level security;

drop policy if exists encuentros_ver on public.encuentros;
create policy encuentros_ver on public.encuentros for select to authenticated using (true);
drop policy if exists encuentros_crear on public.encuentros;
create policy encuentros_crear on public.encuentros for insert to authenticated
  with check (creador = auth.uid() and fecha > now() and fecha < now() + interval '15 days' and length(ruta) between 1 and 120 and coalesce(length(nota), 0) <= 300);
drop policy if exists encuentros_borrar on public.encuentros;
create policy encuentros_borrar on public.encuentros for delete to authenticated using (creador = auth.uid() or es_admin());

drop policy if exists asistentes_ver on public.encuentros_asistentes;
create policy asistentes_ver on public.encuentros_asistentes for select to authenticated using (true);
drop policy if exists asistentes_sumarme on public.encuentros_asistentes;
create policy asistentes_sumarme on public.encuentros_asistentes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists asistentes_bajarme on public.encuentros_asistentes;
create policy asistentes_bajarme on public.encuentros_asistentes for delete to authenticated using (user_id = auth.uid());

-- Agenda con nombre público y bandera del que propone, sin exponer mails
create or replace function public.agenda_encuentros()
returns table(id bigint, ruta text, ruta_id text, fecha timestamptz, nota text, apodo text, pais text, asistentes bigint, me_sumo boolean, es_mio boolean)
language sql stable security definer set search_path = public as $$
  select e.id, e.ruta, e.ruta_id, e.fecha, e.nota,
    coalesce(nullif(trim(p.apodo), ''), 'Ciclista ' || upper(left(md5(e.creador::text), 4))) as apodo,
    p.pais,
    (select count(*) from encuentros_asistentes a where a.encuentro_id = e.id) as asistentes,
    exists(select 1 from encuentros_asistentes a where a.encuentro_id = e.id and a.user_id = auth.uid()) as me_sumo,
    (e.creador = auth.uid()) as es_mio
  from encuentros e left join perfiles p on p.id = e.creador
  where e.fecha > now() - interval '3 hours' and e.fecha < now() + interval '15 days'
  order by e.fecha;
$$;
revoke all on function public.agenda_encuentros() from public, anon;
grant execute on function public.agenda_encuentros() to authenticated;
