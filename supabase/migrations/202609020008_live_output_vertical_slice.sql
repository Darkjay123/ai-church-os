-- Lean church-test vertical slice: a tenant-scoped, operator-approved live output.

create type public.live_output_kind as enum ('image', 'video', 'scripture');

create table public.live_output_states (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  kind public.live_output_kind not null,
  payload jsonb not null,
  version bigint not null default 1,
  updated_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint live_output_payload_is_object check (jsonb_typeof(payload) = 'object')
);

create index live_output_states_service_idx on public.live_output_states (service_id);

-- Extend the Sprint 2 timeline with the single operator-approved output event.
alter table public.service_timeline_events
  drop constraint if exists service_timeline_events_event_type_check;
alter table public.service_timeline_events
  add constraint service_timeline_events_event_type_check
  check (event_type in ('service.created', 'service.started', 'service.ended', 'service.output_sent'));

alter table public.live_output_states enable row level security;
revoke all on table public.live_output_states from anon, authenticated;
grant select on table public.live_output_states to authenticated;
grant all privileges on table public.live_output_states to service_role;

create policy "members can read their organization live output"
on public.live_output_states for select to authenticated
using (organization_id = public.current_organization_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'church-media',
  'church-media',
  false,
  262144000,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "members can read organization church media"
on storage.objects for select to authenticated
using (
  bucket_id = 'church-media'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);

create policy "presentation managers can upload church media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'church-media'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
  and public.has_organization_permission(public.current_organization_id(), 'presentations.manage')
);

create policy "presentation managers can replace church media"
on storage.objects for update to authenticated
using (
  bucket_id = 'church-media'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
  and public.has_organization_permission(public.current_organization_id(), 'presentations.manage')
)
with check (
  bucket_id = 'church-media'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
  and public.has_organization_permission(public.current_organization_id(), 'presentations.manage')
);

create policy "presentation managers can remove church media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'church-media'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
  and public.has_organization_permission(public.current_organization_id(), 'presentations.manage')
);

create or replace function public.set_live_output(
  output_kind public.live_output_kind,
  output_payload jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_uuid uuid := public.current_organization_id();
  active_service_uuid uuid;
  required_permission text := case when output_kind = 'scripture' then 'scriptures.display' else 'presentations.manage' end;
  new_version bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if organization_uuid is null
    or not public.has_organization_permission(organization_uuid, required_permission) then
    raise exception 'You do not have permission to send this item live';
  end if;
  if jsonb_typeof(output_payload) <> 'object' then
    raise exception 'Live output payload must be an object';
  end if;

  select id into active_service_uuid
  from public.services
  where organization_id = organization_uuid and status = 'live'
  limit 1;
  if active_service_uuid is null then
    raise exception 'Start a live service before sending content live';
  end if;

  insert into public.live_output_states (
    organization_id, service_id, kind, payload, version, updated_by_profile_id, updated_at
  ) values (
    organization_uuid, active_service_uuid, output_kind, output_payload, 1, auth.uid(), timezone('utc', now())
  )
  on conflict (organization_id) do update
  set service_id = excluded.service_id,
      kind = excluded.kind,
      payload = excluded.payload,
      version = public.live_output_states.version + 1,
      updated_by_profile_id = excluded.updated_by_profile_id,
      updated_at = excluded.updated_at
  returning version into new_version;

  insert into public.service_timeline_events (
    organization_id, service_id, actor_id, event_type, label, details
  ) values (
    organization_uuid,
    active_service_uuid,
    auth.uid(),
    'service.output_sent',
    'Content sent live',
    case output_kind
      when 'scripture' then coalesce(output_payload->>'reference', 'Scripture')
      else coalesce(output_payload->>'name', 'Media')
    end
  );

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id, metadata)
  values (
    organization_uuid,
    auth.uid(),
    'live_output.sent',
    'live_output',
    active_service_uuid,
    jsonb_build_object('kind', output_kind, 'version', new_version)
  );

  return new_version;
end;
$$;

revoke all on function public.set_live_output(public.live_output_kind, jsonb) from public;
grant execute on function public.set_live_output(public.live_output_kind, jsonb) to authenticated;
