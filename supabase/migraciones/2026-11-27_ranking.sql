-- RutaViva: ranking de tiempos por ruta (solo salidas completas desde el km 0) y apodo público
alter table public.perfiles add column if not exists apodo text;

create or replace function public.ranking_ruta(p_ruta text, p_limite int default 20)
returns table(posicion bigint, apodo text, pais text, minutos numeric, vel_media numeric, fecha timestamptz, es_mio boolean)
language sql stable security definer set search_path = public as $$
  with mejores as (
    select distinct on (s.user_id) s.user_id, s.minutos, s.vel_media, s.creado
    from salidas s
    where s.ruta = p_ruta and s.completa and coalesce(s.km_inicio, 0) <= 0.05 and s.minutos > 0
    order by s.user_id, s.minutos asc, s.creado asc
  ), tabla as (
    select rank() over (order by m.minutos asc) as posicion,
      coalesce(nullif(trim(p.apodo), ''), 'Ciclista ' || upper(left(md5(m.user_id::text), 4))) as apodo,
      p.pais, m.minutos, m.vel_media, m.creado as fecha, (m.user_id = auth.uid()) as es_mio
    from mejores m left join perfiles p on p.id = m.user_id
  )
  select * from tabla where posicion <= greatest(1, p_limite) or es_mio order by posicion, fecha;
$$;
revoke all on function public.ranking_ruta(text, int) from public, anon;
grant execute on function public.ranking_ruta(text, int) to authenticated;
