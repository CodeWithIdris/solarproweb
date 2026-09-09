alter table public.solar_projects
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists location_name text;

alter table public.solar_projects
  add constraint solar_projects_coordinates_valid check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  );

create table public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  country text,
  region text,
  provider_metadata jsonb not null default '{}'::jsonb,
  project_id uuid references public.solar_projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create index saved_locations_user_created_idx on public.saved_locations(user_id, created_at desc);
alter table public.saved_locations enable row level security;
create policy "Users can view their own saved locations" on public.saved_locations for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own saved locations" on public.saved_locations for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own saved locations" on public.saved_locations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own saved locations" on public.saved_locations for delete to authenticated using (auth.uid() = user_id);
revoke all on public.saved_locations from anon;
grant select, insert, update, delete on public.saved_locations to authenticated;
grant all on public.saved_locations to service_role;
