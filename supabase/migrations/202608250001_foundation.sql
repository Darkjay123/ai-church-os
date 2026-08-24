create extension if not exists "pgcrypto";

create type public.subscription_plan as enum ('starter', 'growth', 'pro', 'enterprise');
create type public.subscription_status as enum ('trial', 'active', 'past_due', 'cancelled');
create type public.profile_status as enum ('active', 'invited', 'suspended');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  denomination text,
  logo_url text,
  timezone text not null default 'Africa/Lagos',
  country text,
  default_language text not null default 'en',
  subscription_plan public.subscription_plan not null default 'starter',
  subscription_status public.subscription_status not null default 'trial',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  status public.profile_status not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, email)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(trim(event_type)) > 0),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index profiles_organization_id_idx on public.profiles (organization_id);
create index audit_logs_organization_id_created_at_idx on public.audit_logs (organization_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

create function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_organization_id() from public;
grant execute on function public.current_organization_id() to authenticated;

create policy "members can read their organization"
on public.organizations for select to authenticated
using (id = (select public.current_organization_id()));

create policy "members can read organization profiles"
on public.profiles for select to authenticated
using (organization_id = (select public.current_organization_id()));

create policy "members can update their own profile"
on public.profiles for update to authenticated
using (id = auth.uid() and organization_id = (select public.current_organization_id()))
with check (id = auth.uid() and organization_id = (select public.current_organization_id()));

create policy "members can read organization audit logs"
on public.audit_logs for select to authenticated
using (organization_id = (select public.current_organization_id()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_name text;
  organization_uuid uuid;
begin
  organization_name := nullif(trim(new.raw_user_meta_data ->> 'church_name'), '');
  if organization_name is null then
    raise exception 'church_name is required to create a workspace';
  end if;

  insert into public.organizations (name)
  values (organization_name)
  returning id into organization_uuid;

  insert into public.profiles (id, organization_id, email, full_name)
  values (
    new.id,
    organization_uuid,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  );

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id)
  values (organization_uuid, new.id, 'auth.user_registered', 'profile', new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute procedure public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

alter publication supabase_realtime add table public.audit_logs;
