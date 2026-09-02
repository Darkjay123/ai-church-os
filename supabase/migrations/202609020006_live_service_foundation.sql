-- Sprint 2: Live Service Foundation.
-- A service is an operator-owned record. These routines never start or stop
-- external streaming, presentation, or audio systems.

create type public.service_status as enum ('scheduled', 'live', 'ended');

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 160),
  service_type text not null check (char_length(trim(service_type)) between 2 and 80),
  scheduled_for timestamptz,
  speaker text check (speaker is null or char_length(trim(speaker)) <= 120),
  status public.service_status not null default 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint services_live_times_check check (
    (status = 'scheduled' and started_at is null and ended_at is null)
    or (status = 'live' and started_at is not null and ended_at is null)
    or (status = 'ended' and started_at is not null and ended_at is not null and ended_at >= started_at)
  )
);

create table public.service_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('service.created', 'service.started', 'service.ended')),
  label text not null,
  details text,
  created_at timestamptz not null default timezone('utc', now())
);

create index services_organization_status_scheduled_idx
  on public.services (organization_id, status, scheduled_for asc nulls last);
create index service_timeline_events_service_created_idx
  on public.service_timeline_events (service_id, created_at desc);

alter table public.services enable row level security;
alter table public.service_timeline_events enable row level security;

revoke all on table public.services from anon, authenticated;
revoke all on table public.service_timeline_events from anon, authenticated;
grant select on table public.services to authenticated;
grant select on table public.service_timeline_events to authenticated;
grant all privileges on table public.services to service_role;
grant all privileges on table public.service_timeline_events to service_role;

create policy "members can read organization services"
on public.services for select to authenticated
using (organization_id = public.current_organization_id());

create policy "members can read organization service timelines"
on public.service_timeline_events for select to authenticated
using (organization_id = public.current_organization_id());

insert into public.permissions (key, label, description)
values ('services.operate', 'Operate live services', 'Start and end approved live-service mode.')
on conflict (key) do update
set label = excluded.label,
    description = excluded.description;

create or replace function public.create_live_service(
  service_title text,
  service_type_value text,
  scheduled_for_value timestamptz default null,
  speaker_value text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_uuid uuid := public.current_organization_id();
  service_uuid uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if organization_uuid is null
    or not public.has_organization_permission(organization_uuid, 'services.manage') then
    raise exception 'You do not have permission to create services';
  end if;
  if nullif(trim(service_title), '') is null or char_length(trim(service_title)) > 160 then
    raise exception 'Enter a valid service title';
  end if;
  if nullif(trim(service_type_value), '') is null or char_length(trim(service_type_value)) > 80 then
    raise exception 'Enter a valid service type';
  end if;
  if speaker_value is not null and char_length(trim(speaker_value)) > 120 then
    raise exception 'Enter a valid speaker name';
  end if;

  insert into public.services (
    organization_id, title, service_type, scheduled_for, speaker, created_by_profile_id
  )
  values (
    organization_uuid,
    trim(service_title),
    trim(service_type_value),
    scheduled_for_value,
    nullif(trim(speaker_value), ''),
    auth.uid()
  )
  returning id into service_uuid;

  insert into public.service_timeline_events (
    organization_id, service_id, actor_id, event_type, label, details
  )
  values (
    organization_uuid,
    service_uuid,
    auth.uid(),
    'service.created',
    'Service created',
    case when scheduled_for_value is null then 'Standing by for operator start.' else 'Scheduled by the service team.' end
  );

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id, metadata)
  values (
    organization_uuid,
    auth.uid(),
    'service.created',
    'service',
    service_uuid,
    jsonb_build_object('service_type', trim(service_type_value))
  );

  return service_uuid;
end;
$$;

create or replace function public.start_live_service(target_service_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_uuid uuid := public.current_organization_id();
  service_record public.services%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if organization_uuid is null
    or not public.has_organization_permission(organization_uuid, 'services.operate') then
    raise exception 'You do not have permission to start service mode';
  end if;

  select * into service_record
  from public.services
  where id = target_service_id
    and organization_id = organization_uuid
  for update;

  if not found then
    raise exception 'Selected service is not available in this workspace';
  end if;
  if service_record.status = 'live' then
    raise exception 'This service is already live';
  end if;
  if service_record.status = 'ended' then
    raise exception 'Completed services cannot be restarted';
  end if;
  if exists (
    select 1 from public.services
    where organization_id = organization_uuid
      and status = 'live'
  ) then
    raise exception 'Another service is already live';
  end if;

  update public.services
  set status = 'live', started_at = timezone('utc', now())
  where id = target_service_id;

  insert into public.service_timeline_events (
    organization_id, service_id, actor_id, event_type, label, details
  )
  values (
    organization_uuid,
    target_service_id,
    auth.uid(),
    'service.started',
    'Service mode started',
    'Started by an authorised operator.'
  );

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id)
  values (organization_uuid, auth.uid(), 'service.started', 'service', target_service_id);
exception
  when unique_violation then
    raise exception 'Another service is already live';
end;
$$;

create or replace function public.end_live_service(target_service_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_uuid uuid := public.current_organization_id();
  service_record public.services%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if organization_uuid is null
    or not public.has_organization_permission(organization_uuid, 'services.operate') then
    raise exception 'You do not have permission to end service mode';
  end if;

  select * into service_record
  from public.services
  where id = target_service_id
    and organization_id = organization_uuid
  for update;

  if not found then
    raise exception 'Selected service is not available in this workspace';
  end if;
  if service_record.status <> 'live' then
    raise exception 'Only a live service can be ended';
  end if;

  update public.services
  set status = 'ended', ended_at = timezone('utc', now())
  where id = target_service_id;

  insert into public.service_timeline_events (
    organization_id, service_id, actor_id, event_type, label, details
  )
  values (
    organization_uuid,
    target_service_id,
    auth.uid(),
    'service.ended',
    'Service mode ended',
    'Ended by an authorised operator.'
  );

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id)
  values (organization_uuid, auth.uid(), 'service.ended', 'service', target_service_id);
end;
$$;

revoke all on function public.create_live_service(text, text, timestamptz, text) from public;
revoke all on function public.start_live_service(uuid) from public;
revoke all on function public.end_live_service(uuid) from public;
grant execute on function public.create_live_service(text, text, timestamptz, text) to authenticated;
grant execute on function public.start_live_service(uuid) to authenticated;
grant execute on function public.end_live_service(uuid) to authenticated;

create trigger services_set_updated_at
before update on public.services
for each row execute procedure public.set_updated_at();

-- Services are always owned by the same church as their creator. Timeline
-- records are similarly bound to the service's church, even for trusted paths.
create or replace function public.ensure_service_tenant_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_organization_id uuid;
begin
  if tg_table_name = 'services' then
    select organization_id into expected_organization_id
    from public.profiles
    where id = new.created_by_profile_id;

    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Service creator does not belong to this organization';
    end if;
  elsif tg_table_name = 'service_timeline_events' then
    select organization_id into expected_organization_id
    from public.services
    where id = new.service_id;

    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Service timeline event does not belong to this organization';
    end if;
  end if;

  return new;
end;
$$;

create trigger services_enforce_tenant_integrity
before insert or update on public.services
for each row execute procedure public.ensure_service_tenant_integrity();

create trigger service_timeline_events_enforce_tenant_integrity
before insert or update on public.service_timeline_events
for each row execute procedure public.ensure_service_tenant_integrity();
