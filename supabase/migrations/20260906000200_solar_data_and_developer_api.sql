create type public.api_key_status as enum ('active', 'revoked', 'expired');
create type public.provider_data_policy_mode as enum ('internal_only', 'redistribution_allowed', 'restricted');

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  environment text not null check (environment in ('test', 'live')),
  status public.api_key_status not null default 'active',
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz
);

create table public.api_usage (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  endpoint text not null,
  method text not null,
  response_status integer not null,
  response_time_ms integer,
  provider_used text,
  cache_hit boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'developer_free',
  requests_per_minute integer not null default 60,
  requests_per_day integer not null default 5000,
  monthly_request_limit integer not null default 100000,
  unique (user_id)
);

create table public.provider_data_policies (
  provider text primary key,
  mode public.provider_data_policy_mode not null,
  redistribution_allowed boolean not null default false,
  attribution_required boolean not null default true,
  cache_allowed boolean not null default true,
  maximum_cache_duration_seconds integer not null default 86400,
  api_exposure_allowed boolean not null default false,
  required_attribution text
);

insert into public.provider_data_policies (provider, mode, redistribution_allowed, attribution_required, cache_allowed, api_exposure_allowed, required_attribution)
values ('pvgis', 'internal_only', false, true, true, false, 'PVGIS data is used for Solar Pro modelled planning estimates; verify applicable provider terms before redistribution.')
on conflict (provider) do nothing;

alter table public.api_keys enable row level security;
alter table public.api_usage enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.provider_data_policies enable row level security;
create policy "Users can manage their own api keys" on public.api_keys for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can view their own api usage" on public.api_usage for select to authenticated using (exists (select 1 from public.api_keys k where k.id = api_key_id and k.user_id = auth.uid()));
create policy "Users can view their own rate limits" on public.api_rate_limits for select to authenticated using (auth.uid() = user_id);
create policy "Provider policies are server readable" on public.provider_data_policies for select to authenticated using (true);
revoke all on public.api_keys, public.api_usage, public.api_rate_limits, public.provider_data_policies from anon;
grant select, insert, update, delete on public.api_keys to authenticated;
grant select on public.api_usage, public.api_rate_limits, public.provider_data_policies to authenticated;
grant all on public.api_keys, public.api_usage, public.api_rate_limits, public.provider_data_policies to service_role;
