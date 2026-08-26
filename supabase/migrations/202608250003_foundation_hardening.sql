-- Foundation hardening corrective migration.
-- This migration is additive: 202608250001 and 202608250002 may already be applied.

-- 1. Canonical permission and least-privilege table grants.
insert into public.permissions (key, label, description)
values ('audit.read', 'View audit history', 'View security and workspace audit history.')
on conflict (key) do update
set label = excluded.label,
    description = excluded.description;

insert into public.role_permissions (organization_id, role_id, permission_id)
select roles.organization_id, roles.id, permissions.id
from public.roles roles
join public.permissions permissions on permissions.key = 'audit.read'
where roles.key in ('owner', 'administrator')
on conflict do nothing;

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on table public.permissions from anon, authenticated;
revoke all on table public.roles from anon, authenticated;
revoke all on table public.role_permissions from anon, authenticated;
revoke all on table public.organization_role_assignments from anon, authenticated;
revoke all on table public.teams from anon, authenticated;
revoke all on table public.team_memberships from anon, authenticated;
revoke all on table public.invitations from anon, authenticated;
revoke all on table public.invitation_teams from anon, authenticated;

grant select on table public.organizations to authenticated;
grant update (name, denomination, logo_url, timezone, country, default_language)
on table public.organizations to authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url, phone) on table public.profiles to authenticated;
grant select on table public.audit_logs to authenticated;
grant select on table public.permissions to authenticated;
grant select on table public.roles to authenticated;
grant select on table public.role_permissions to authenticated;
grant select on table public.organization_role_assignments to authenticated;
grant select, insert, update, delete on table public.teams to authenticated;
grant select on table public.team_memberships to authenticated;
grant select on table public.invitations to authenticated;
grant select on table public.invitation_teams to authenticated;

grant all privileges on table public.organizations to service_role;
grant all privileges on table public.profiles to service_role;
grant all privileges on table public.audit_logs to service_role;
grant all privileges on table public.permissions to service_role;
grant all privileges on table public.roles to service_role;
grant all privileges on table public.role_permissions to service_role;
grant all privileges on table public.organization_role_assignments to service_role;
grant all privileges on table public.teams to service_role;
grant all privileges on table public.team_memberships to service_role;
grant all privileges on table public.invitations to service_role;
grant all privileges on table public.invitation_teams to service_role;

-- New workspaces must receive the same audit permission as existing workspaces.
create or replace function public.provision_organization_roles(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.roles (organization_id, key, label, description, is_system)
  values
    (target_organization_id, 'owner', 'Owner', 'Full control of the church workspace.', true),
    (target_organization_id, 'administrator', 'Administrator', 'Manages people, workspace settings and service operations.', true),
    (target_organization_id, 'pastor', 'Pastor', 'Prepares services and accesses sermon intelligence.', true),
    (target_organization_id, 'media_director', 'Media Director', 'Leads presentations, streaming and media operations.', true),
    (target_organization_id, 'operator', 'Operator', 'Runs approved live-service controls.', true),
    (target_organization_id, 'worship_leader', 'Worship Leader', 'Prepares worship content and lyrics.', true),
    (target_organization_id, 'viewer', 'Viewer', 'Read-only workspace access.', true)
  on conflict (organization_id, key) do nothing;

  insert into public.role_permissions (organization_id, role_id, permission_id)
  select target_organization_id, roles.id, permissions.id
  from public.roles roles
  cross join public.permissions permissions
  where roles.organization_id = target_organization_id
    and (
      roles.key = 'owner'
      or (roles.key = 'administrator' and permissions.key in (
        'workspace.view', 'organization.manage', 'members.manage', 'teams.manage',
        'roles.manage', 'services.manage', 'presentations.manage', 'scriptures.display',
        'lyrics.display', 'streaming.manage', 'archive.read', 'ai.use', 'audit.read'
      ))
      or (roles.key = 'pastor' and permissions.key in (
        'workspace.view', 'services.manage', 'presentations.manage', 'scriptures.display',
        'archive.read', 'ai.use'
      ))
      or (roles.key = 'media_director' and permissions.key in (
        'workspace.view', 'services.manage', 'presentations.manage', 'scriptures.display',
        'lyrics.display', 'streaming.manage', 'archive.read', 'ai.use'
      ))
      or (roles.key = 'operator' and permissions.key in (
        'workspace.view', 'scriptures.display', 'lyrics.display', 'streaming.manage', 'ai.use'
      ))
      or (roles.key = 'worship_leader' and permissions.key in (
        'workspace.view', 'lyrics.display', 'presentations.manage', 'ai.use'
      ))
      or (roles.key = 'viewer' and permissions.key in ('workspace.view', 'archive.read'))
    )
  on conflict do nothing;
end;
$$;

-- 2. Audit history is privileged. The realtime publications in prior migrations
-- are unnecessary for the current product and are intentionally removed.
drop policy if exists "members can read organization audit logs" on public.audit_logs;
create policy "audit readers can read organization audit logs"
on public.audit_logs for select to authenticated
using (
  organization_id = public.current_organization_id()
  and public.has_organization_permission(organization_id, 'audit.read')
);

alter publication supabase_realtime drop table public.audit_logs;
alter publication supabase_realtime drop table public.invitations;
alter publication supabase_realtime drop table public.organization_role_assignments;

-- 3. A profile owner can edit only their own non-security fields. Member status
-- changes go through the narrowly authorised RPC below, not broad profile RLS.
drop policy if exists "members can update their own profile" on public.profiles;
drop policy if exists "members can update authorized profiles" on public.profiles;
create policy "members can update their own profile"
on public.profiles for update to authenticated
using (
  id = auth.uid()
  and organization_id = public.current_organization_id()
)
with check (
  id = auth.uid()
  and organization_id = public.current_organization_id()
);

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'Organization cannot be changed';
  end if;
  if lower(new.email) is distinct from lower(old.email) then
    raise exception 'Email cannot be changed here';
  end if;
  if new.status is distinct from old.status
    and current_setting('app.member_status_change', true) is distinct from 'true' then
    raise exception 'Use the authorised member-management operation to change member status';
  end if;
  return new;
end;
$$;

create or replace function public.set_workspace_member_status(
  target_profile_id uuid,
  target_status public.profile_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_uuid uuid := public.current_organization_id();
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if organization_uuid is null
    or not public.has_organization_permission(organization_uuid, 'members.manage') then
    raise exception 'You do not have permission to manage members';
  end if;
  if target_profile_id = auth.uid() then
    raise exception 'You cannot change your own membership status';
  end if;
  if not exists (
    select 1
    from public.profiles
    where id = target_profile_id
      and organization_id = organization_uuid
  ) then
    raise exception 'Selected member is not available in this workspace';
  end if;

  perform set_config('app.member_status_change', 'true', true);

  update public.profiles
  set status = target_status
  where id = target_profile_id
    and organization_id = organization_uuid;

  perform public.record_audit_event(
    organization_uuid,
    'workspace.member_status_changed',
    'profile',
    target_profile_id,
    jsonb_build_object('status', target_status)
  );
end;
$$;

-- 4. Permission checks independently bind the caller, profile, role and target
-- organisation. A supplied organization ID can never create cross-tenant access.
create or replace function public.has_organization_permission(
  target_organization_id uuid,
  required_permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_role_assignments assignments
    join public.profiles profiles
      on profiles.id = assignments.profile_id
      and profiles.organization_id = target_organization_id
    join public.roles roles
      on roles.id = assignments.role_id
      and roles.organization_id = target_organization_id
    join public.role_permissions role_permissions
      on role_permissions.role_id = roles.id
      and role_permissions.organization_id = target_organization_id
    join public.permissions permissions on permissions.id = role_permissions.permission_id
    where assignments.profile_id = auth.uid()
      and assignments.organization_id = target_organization_id
      and permissions.key = required_permission_key
  )
$$;

-- Auth-created first owners run without an authenticated request context. Direct
-- client assignment still requires an existing owner in the same organization.
create or replace function public.ensure_workspace_tenant_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_organization_id uuid;
  target_role_key text;
begin
  if tg_table_name = 'organization_role_assignments' then
    select organization_id into expected_organization_id
    from public.profiles
    where id = new.profile_id;
    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Profile does not belong to this organization';
    end if;

    select organization_id, key into expected_organization_id, target_role_key
    from public.roles
    where id = new.role_id;
    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Role does not belong to this organization';
    end if;

    if target_role_key = 'owner'
      and auth.uid() is not null
      and not exists (
        select 1
        from public.organization_role_assignments assignments
        join public.roles roles on roles.id = assignments.role_id
        where assignments.profile_id = auth.uid()
          and assignments.organization_id = new.organization_id
          and roles.organization_id = new.organization_id
          and roles.key = 'owner'
      ) then
      raise exception 'Only a workspace owner can assign the Owner role';
    end if;
  elsif tg_table_name = 'team_memberships' then
    select organization_id into expected_organization_id
    from public.profiles
    where id = new.profile_id;
    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Profile does not belong to this organization';
    end if;

    select organization_id into expected_organization_id
    from public.teams
    where id = new.team_id;
    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Team does not belong to this organization';
    end if;
  elsif tg_table_name = 'invitations' then
    select organization_id into expected_organization_id
    from public.roles
    where id = new.role_id;
    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Role does not belong to this organization';
    end if;
  elsif tg_table_name = 'invitation_teams' then
    select organization_id into expected_organization_id
    from public.invitations
    where id = new.invitation_id;
    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Invitation does not belong to this organization';
    end if;

    select organization_id into expected_organization_id
    from public.teams
    where id = new.team_id;
    if expected_organization_id is distinct from new.organization_id then
      raise exception 'Team does not belong to this organization';
    end if;
  end if;
  return new;
end;
$$;

-- Audit writers are constrained to known application events and the permission
-- needed to perform the corresponding operation. This prevents arbitrary audit
-- history injection while preserving independent action auditability.
create or replace function public.record_audit_event(
  target_organization_id uuid,
  new_event_type text,
  new_entity_type text default null,
  new_entity_id uuid default null,
  new_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  if auth.uid() is null
    or target_organization_id is distinct from public.current_organization_id() then
    raise exception 'Organization scope mismatch';
  end if;

  if new_event_type = 'workspace.profile_updated' then
    if new_entity_type is distinct from 'profile' or new_entity_id is distinct from auth.uid() then
      raise exception 'Invalid profile audit event';
    end if;
  elsif new_event_type = 'workspace.organization_updated' then
    if not public.has_organization_permission(target_organization_id, 'organization.manage') then
      raise exception 'You do not have permission to record this audit event';
    end if;
  elsif new_event_type = 'workspace.team_created' then
    if not public.has_organization_permission(target_organization_id, 'teams.manage') then
      raise exception 'You do not have permission to record this audit event';
    end if;
  elsif new_event_type = 'workspace.role_assigned' then
    if not public.has_organization_permission(target_organization_id, 'roles.manage') then
      raise exception 'You do not have permission to record this audit event';
    end if;
  elsif new_event_type = 'workspace.member_status_changed' then
    if not public.has_organization_permission(target_organization_id, 'members.manage') then
      raise exception 'You do not have permission to record this audit event';
    end if;
  elsif new_event_type = 'workspace.invitation_accepted' then
    if new_entity_type is distinct from 'invitation' then
      raise exception 'Invalid invitation audit event';
    end if;
  else
    raise exception 'Audit event type is not permitted';
  end if;

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id, metadata)
  values (
    target_organization_id,
    auth.uid(),
    new_event_type,
    new_entity_type,
    new_entity_id,
    coalesce(new_metadata, '{}'::jsonb)
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

-- 5. Validate an invitation digest before calling Auth so ordinary bad links
-- return an application error instead of failing inside the auth.users trigger.
-- The one-time acceptance remains in the protected auth trigger until multi-org
-- memberships are introduced (documented in docs/foundation-hardening.md).
create or replace function public.validate_workspace_invitation(token_digest text)
returns table (email text)
language sql
stable
security definer
set search_path = public
as $$
  select invitations.email
  from public.invitations
  where invitations.token_hash = token_digest
    and invitations.status = 'pending'
    and invitations.expires_at > timezone('utc', now())
  limit 1
$$;

revoke all on function public.provision_organization_roles(uuid) from public;
revoke all on function public.has_organization_permission(uuid, text) from public;
revoke all on function public.record_audit_event(uuid, text, text, uuid, jsonb) from public;
revoke all on function public.create_workspace_invitation(text, uuid, uuid, text) from public;
revoke all on function public.assign_workspace_role(uuid, uuid) from public;
revoke all on function public.set_workspace_member_status(uuid, public.profile_status) from public;
revoke all on function public.validate_workspace_invitation(text) from public;

grant execute on function public.has_organization_permission(uuid, text) to authenticated;
grant execute on function public.record_audit_event(uuid, text, text, uuid, jsonb) to authenticated;
grant execute on function public.create_workspace_invitation(text, uuid, uuid, text) to authenticated;
grant execute on function public.assign_workspace_role(uuid, uuid) to authenticated;
grant execute on function public.set_workspace_member_status(uuid, public.profile_status) to authenticated;
grant execute on function public.validate_workspace_invitation(text) to anon, authenticated;

-- 6. Invitation provisioning is explicit after authentication. This avoids
-- invalid invitation metadata aborting auth.users creation. The profile schema
-- currently binds a user to one organization, so joining a second organization
-- is deliberately rejected until the planned membership migration lands.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_name text;
  organization_uuid uuid;
  owner_role_uuid uuid;
begin
  organization_name := nullif(trim(new.raw_user_meta_data ->> 'church_name'), '');

  if organization_name is null then
    -- Invitation recipients receive no tenant profile until they authenticate
    -- and explicitly accept a validated invitation.
    return new;
  end if;

  insert into public.organizations (name)
  values (organization_name)
  returning id into organization_uuid;

  perform public.provision_organization_roles(organization_uuid);

  insert into public.profiles (id, organization_id, email, full_name)
  values (new.id, organization_uuid, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));

  select id into owner_role_uuid
  from public.roles
  where organization_id = organization_uuid and key = 'owner';

  insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
  values (organization_uuid, new.id, owner_role_uuid, new.id);

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id)
  values (organization_uuid, new.id, 'auth.user_registered', 'profile', new.id);

  return new;
end;
$$;

create or replace function public.accept_workspace_invitation(
  invitation_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_record public.invitations%rowtype;
  profile_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if invitation_token is null or char_length(invitation_token) < 32 then
    raise exception 'Invitation is invalid or expired';
  end if;

  select * into invitation_record
  from public.invitations
  where token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
    and status = 'pending'
    and expires_at > timezone('utc', now())
  for update;

  if not found then
    raise exception 'Invitation is invalid, expired, or already used';
  end if;
  if lower(invitation_record.email) <> lower((select email from auth.users where id = auth.uid())) then
    raise exception 'Invitation does not match this account';
  end if;

  select organization_id into profile_organization_id
  from public.profiles
  where id = auth.uid()
  for update;

  if profile_organization_id is null then
    insert into public.profiles (id, organization_id, email, full_name)
    values (
      auth.uid(),
      invitation_record.organization_id,
      (select email from auth.users where id = auth.uid()),
      nullif(trim((select raw_user_meta_data ->> 'full_name' from auth.users where id = auth.uid())), '')
    );
  elsif profile_organization_id <> invitation_record.organization_id then
    raise exception 'This account already belongs to another workspace';
  end if;

  insert into public.organization_role_assignments (
    organization_id,
    profile_id,
    role_id,
    assigned_by_profile_id
  )
  values (
    invitation_record.organization_id,
    auth.uid(),
    invitation_record.role_id,
    invitation_record.invited_by_profile_id
  )
  on conflict do nothing;

  insert into public.team_memberships (organization_id, team_id, profile_id, added_by_profile_id)
  select invitation_record.organization_id, invitation_teams.team_id, auth.uid(), invitation_record.invited_by_profile_id
  from public.invitation_teams
  where invitation_teams.invitation_id = invitation_record.id
  on conflict do nothing;

  update public.profiles
  set status = 'active'
  where id = auth.uid();

  update public.invitations
  set status = 'accepted', accepted_at = timezone('utc', now())
  where id = invitation_record.id;

  perform public.record_audit_event(
    invitation_record.organization_id,
    'workspace.invitation_accepted',
    'invitation',
    invitation_record.id
  );

  return invitation_record.organization_id;
end;
$$;

revoke all on function public.accept_workspace_invitation(text) from public;
grant execute on function public.accept_workspace_invitation(text) to authenticated;
