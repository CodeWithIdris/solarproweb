create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  region text,
  country text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  installed_capacity_kw numeric not null check (installed_capacity_kw >= 0),
  panel_wattage integer,
  panel_count integer,
  inverter_capacity_kw numeric,
  tilt numeric,
  azimuth numeric,
  system_loss_percent numeric,
  data_mode text not null check (data_mode in ('demo', 'modelled', 'historical', 'connected', 'live')),
  data_provider text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.solar_data_cache (
  cache_key text primary key,
  provider text not null,
  data_mode text not null check (data_mode in ('modelled', 'historical')),
  location jsonb not null,
  request_parameters jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  retrieved_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table public.generation_estimates (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade,
  provider text not null,
  data_mode text not null check (data_mode in ('demo', 'modelled', 'historical', 'connected', 'live')),
  installed_capacity_kw numeric not null,
  expected_daily_kwh numeric not null default 0,
  expected_monthly_kwh numeric not null default 0,
  expected_annual_kwh numeric not null default 0,
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.sites enable row level security;
alter table public.solar_data_cache enable row level security;
alter table public.generation_estimates enable row level security;
create policy "Users can manage their own sites" on public.sites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can view their own generation estimates" on public.generation_estimates for select to authenticated using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));
create policy "Server owns solar data cache" on public.solar_data_cache for all to service_role using (true) with check (true);
revoke all on public.sites, public.solar_data_cache, public.generation_estimates from anon;
grant select, insert, update, delete on public.sites to authenticated;
grant select on public.generation_estimates to authenticated;
grant all on public.sites, public.solar_data_cache, public.generation_estimates to service_role;
