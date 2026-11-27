-- RutaViva: estadísticas de cada salida, historial propio y rutas propias para repetir
alter table public.salidas
  add column if not exists ruta_id text,
  add column if not exists km_inicio numeric,
  add column if not exists completa boolean not null default false,
  add column if not exists vel_media numeric,
  add column if not exists vel_max numeric,
  add column if not exists fc_media integer,
  add column if not exists fc_max integer,
  add column if not exists pot_media integer,
  add column if not exists pot_max integer,
  add column if not exists pot_np integer,
  add column if not exists cad_media integer,
  add column if not exists kj integer,
  add column if not exists serie jsonb,
  add column if not exists gpx_path text,
  add column if not exists mail_enviado timestamptz;

drop policy if exists salidas_update on public.salidas;
create policy salidas_update on public.salidas for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists salidas_delete on public.salidas;
create policy salidas_delete on public.salidas for delete to authenticated using (user_id = auth.uid());
create index if not exists salidas_user_creado on public.salidas (user_id, creado desc);

insert into storage.buckets (id, name, public, file_size_limit)
values ('rutas-usuarios', 'rutas-usuarios', false, 10485760)
on conflict (id) do nothing;

drop policy if exists rutas_usuarios_leer on storage.objects;
create policy rutas_usuarios_leer on storage.objects for select to authenticated
  using (bucket_id = 'rutas-usuarios' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists rutas_usuarios_subir on storage.objects;
create policy rutas_usuarios_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'rutas-usuarios' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists rutas_usuarios_actualizar on storage.objects;
create policy rutas_usuarios_actualizar on storage.objects for update to authenticated
  using (bucket_id = 'rutas-usuarios' and (storage.foldername(name))[1] = auth.uid()::text);
