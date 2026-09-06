create type public.account_type as enum ('individual', 'business');
create type public.project_status as enum ('draft', 'calculated', 'saved', 'ready_for_quote', 'quoted', 'installation');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  company_name text,
  country text,
  account_type public.account_type not null default 'individual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.solar_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status public.project_status not null default 'saved',
  property_type text not null default 'Other',
  location text,
  grid_availability text,
  assessment_inputs jsonb not null default '{}'::jsonb,
  calculation_result jsonb not null default '{}'::jsonb,
  system_configuration jsonb not null default '{}'::jsonb,
  selected_recommendation_tier text,
  selected_panel_wattage numeric,
  panel_quantity integer,
  configuration_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index solar_projects_user_updated_idx on public.solar_projects(user_id, updated_at desc);

create or replace function public.set_updated_at() returns trigger
language plpgsql security invoker set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger solar_projects_set_updated_at before update on public.solar_projects for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, full_name, email, phone, company_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'company_name',
    case when coalesce(new.raw_user_meta_data ->> 'account_type', 'individual') = 'business' then 'business'::public.account_type else 'individual'::public.account_type end
  ) on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.solar_projects enable row level security;
create policy "Users can view their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can view their own projects" on public.solar_projects for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own projects" on public.solar_projects for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own projects" on public.solar_projects for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own projects" on public.solar_projects for delete to authenticated using (auth.uid() = user_id);

revoke all on public.profiles from anon;
revoke all on public.solar_projects from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.solar_projects to authenticated;
grant all on public.profiles, public.solar_projects to service_role;
