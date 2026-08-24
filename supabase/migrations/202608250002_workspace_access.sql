create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z]+(\.[a-z_]+)+$'),
  label text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null check (key ~ '^[a-z_]+$'),
  label text not null,
  description text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, key)
);

create table public.role_permissions (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_id, permission_id)
);

create table public.organization_role_assignments (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  assigned_by_profile_id uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, role_id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, name)
);

create table public.team_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  added_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (team_id, profile_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role_id uuid not null references public.roles(id) on delete restrict,
  invited_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  token_hash text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, email, status)
);

create table public.invitation_teams (
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  primary key (invitation_id, team_id)
);

create index roles_organization_id_idx on public.roles (organization_id);
create index organization_role_assignments_organization_id_idx on public.organization_role_assignments (organization_id);
create index organization_role_assignments_profile_id_idx on public.organization_role_assignments (profile_id);
create index teams_organization_id_idx on public.teams (organization_id);
create index team_memberships_organization_id_idx on public.team_memberships (organization_id);
create index invitations_organization_id_status_idx on public.invitations (organization_id, status);

insert into public.permissions (key, label, description)
values
  ('workspace.view', 'View workspace', 'View church workspace content.'),
  ('organization.manage', 'Manage organisation', 'Edit church profile and organisation preferences.'),
  ('members.manage', 'Manage members', 'Invite, remove and manage workspace members.'),
  ('teams.manage', 'Manage teams', 'Create and manage ministry teams.'),
  ('roles.manage', 'Manage roles', 'Assign roles and manage role permissions.'),
  ('services.manage', 'Manage services', 'Create and manage live services.'),
  ('presentations.manage', 'Manage presentations', 'Create, edit and publish presentations.'),
  ('scriptures.display', 'Display scripture', 'Search and display scripture during services.'),
  ('lyrics.display', 'Display lyrics', 'Manage and display worship lyrics.'),
  ('streaming.manage', 'Manage streaming', 'Manage stream connections and broadcast outputs.'),
  ('archive.read', 'View archives', 'View sermon archives and historical service records.'),
  ('ai.use', 'Use AI Brain', 'Request AI suggestions through the central AI Brain.')
on conflict (key) do update set label = excluded.label, description = excluded.description;

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
  from public.roles
  cross join public.permissions
  where roles.organization_id = target_organization_id
    and (
      roles.key = 'owner'
      or (roles.key = 'administrator' and permissions.key in ('workspace.view', 'organization.manage', 'members.manage', 'teams.manage', 'roles.manage', 'services.manage', 'presentations.manage', 'scriptures.display', 'lyrics.display', 'streaming.manage', 'archive.read', 'ai.use'))
      or (roles.key = 'pastor' and permissions.key in ('workspace.view', 'services.manage', 'presentations.manage', 'scriptures.display', 'archive.read', 'ai.use'))
      or (roles.key = 'media_director' and permissions.key in ('workspace.view', 'services.manage', 'presentations.manage', 'scriptures.display', 'lyrics.display', 'streaming.manage', 'archive.read', 'ai.use'))
      or (roles.key = 'operator' and permissions.key in ('workspace.view', 'scriptures.display', 'lyrics.display', 'streaming.manage', 'ai.use'))
      or (roles.key = 'worship_leader' and permissions.key in ('workspace.view', 'lyrics.display', 'presentations.manage', 'ai.use'))
      or (roles.key = 'viewer' and permissions.key in ('workspace.view', 'archive.read'))
    )
  on conflict do nothing;
end;
$$;

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
    join public.role_permissions role_permissions on role_permissions.role_id = assignments.role_id
    join public.permissions permissions on permissions.id = role_permissions.permission_id
    where assignments.profile_id = auth.uid()
      and assignments.organization_id = target_organization_id
      and role_permissions.organization_id = target_organization_id
      and permissions.key = required_permission_key
  )
$$;

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
  if target_organization_id <> (select public.current_organization_id()) then
    raise exception 'Organization scope mismatch';
  end if;

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id, metadata)
  values (target_organization_id, auth.uid(), new_event_type, new_entity_type, new_entity_id, coalesce(new_metadata, '{}'::jsonb))
  returning id into audit_id;

  return audit_id;
end;
$$;

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
  invite public.invitations%rowtype;
  invitation_token text;
begin
  invitation_token := nullif(new.raw_user_meta_data ->> 'invitation_token', '');

  if invitation_token is not null then
    select * into invite
    from public.invitations
    where token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
      and status = 'pending'
      and expires_at > timezone('utc', now())
      and lower(email) = lower(new.email)
    for update;

    if not found then
      raise exception 'Invitation is invalid, expired or does not match this email address';
    end if;

    insert into public.profiles (id, organization_id, email, full_name)
    values (new.id, invite.organization_id, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));

    insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
    values (invite.organization_id, new.id, invite.role_id, invite.invited_by_profile_id);

    insert into public.team_memberships (organization_id, team_id, profile_id, added_by_profile_id)
    select invite.organization_id, invitation_teams.team_id, new.id, invite.invited_by_profile_id
    from public.invitation_teams
    where invitation_teams.invitation_id = invite.id;

    update public.invitations
    set status = 'accepted', accepted_at = timezone('utc', now())
    where id = invite.id;

    insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id, metadata)
    values (invite.organization_id, new.id, 'workspace.invitation_accepted', 'invitation', invite.id, jsonb_build_object('email', new.email));

    return new;
  end if;

  organization_name := nullif(trim(new.raw_user_meta_data ->> 'church_name'), '');
  if organization_name is null then
    raise exception 'church_name is required to create a workspace';
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

create or replace function public.audit_invitation_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id, metadata)
  values (new.organization_id, auth.uid(), 'workspace.invitation_created', 'invitation', new.id, jsonb_build_object('email', new.email));
  return new;
end;
$$;

create trigger invitations_audit_created
after insert on public.invitations
for each row execute procedure public.audit_invitation_created();

create trigger roles_set_updated_at
before update on public.roles
for each row execute procedure public.set_updated_at();

create trigger teams_set_updated_at
before update on public.teams
for each row execute procedure public.set_updated_at();

alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organization_role_assignments enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.invitation_teams enable row level security;

create policy "authenticated users can read permission definitions"
on public.permissions for select to authenticated using (true);

create policy "members can read organization roles"
on public.roles for select to authenticated
using (organization_id = (select public.current_organization_id()));

create policy "members can read organization role permissions"
on public.role_permissions for select to authenticated
using (organization_id = (select public.current_organization_id()));

create policy "members can read role assignments"
on public.organization_role_assignments for select to authenticated
using (organization_id = (select public.current_organization_id()));

create policy "role managers can assign roles"
on public.organization_role_assignments for insert to authenticated
with check (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'roles.manage')
);

create policy "role managers can remove roles"
on public.organization_role_assignments for delete to authenticated
using (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'roles.manage')
);

create policy "members can read organization teams"
on public.teams for select to authenticated
using (organization_id = (select public.current_organization_id()));

create policy "team managers can create teams"
on public.teams for insert to authenticated
with check (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'teams.manage')
);

create policy "team managers can update teams"
on public.teams for update to authenticated
using (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'teams.manage')
)
with check (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'teams.manage')
);

create policy "team managers can delete teams"
on public.teams for delete to authenticated
using (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'teams.manage')
);

create policy "members can read team memberships"
on public.team_memberships for select to authenticated
using (organization_id = (select public.current_organization_id()));

create policy "team managers can manage team memberships"
on public.team_memberships for all to authenticated
using (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'teams.manage')
)
with check (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'teams.manage')
);

create policy "members can read organization invitations"
on public.invitations for select to authenticated
using (organization_id = (select public.current_organization_id()));

create policy "member managers can create invitations"
on public.invitations for insert to authenticated
with check (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'members.manage')
);

create policy "member managers can update invitations"
on public.invitations for update to authenticated
using (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'members.manage')
)
with check (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'members.manage')
);

create policy "member managers can delete invitations"
on public.invitations for delete to authenticated
using (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'members.manage')
);

create policy "members can read invitation team assignments"
on public.invitation_teams for select to authenticated
using (organization_id = (select public.current_organization_id()));

create policy "member managers can manage invitation team assignments"
on public.invitation_teams for all to authenticated
using (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'members.manage')
)
with check (
  organization_id = (select public.current_organization_id())
  and public.has_organization_permission(organization_id, 'members.manage')
);

drop policy if exists "members can update their own profile" on public.profiles;
create policy "members can update authorized profiles"
on public.profiles for update to authenticated
using (
  (id = auth.uid() and organization_id = (select public.current_organization_id()))
  or public.has_organization_permission(organization_id, 'members.manage')
)
with check (
  organization_id = (select public.current_organization_id())
  and (
    id = auth.uid()
    or public.has_organization_permission(organization_id, 'members.manage')
  )
);

create policy "organization managers can update their organization"
on public.organizations for update to authenticated
using (
  id = (select public.current_organization_id())
  and public.has_organization_permission(id, 'organization.manage')
)
with check (
  id = (select public.current_organization_id())
  and public.has_organization_permission(id, 'organization.manage')
);

revoke all on function public.provision_organization_roles(uuid) from public;
revoke all on function public.has_organization_permission(uuid, text) from public;
revoke all on function public.record_audit_event(uuid, text, text, uuid, jsonb) from public;
grant execute on function public.has_organization_permission(uuid, text) to authenticated;
grant execute on function public.record_audit_event(uuid, text, text, uuid, jsonb) to authenticated;

alter publication supabase_realtime add table public.invitations;
alter publication supabase_realtime add table public.organization_role_assignments;

alter table public.invitations drop constraint if exists invitations_organization_id_email_status_key;
create unique index invitations_one_pending_email_per_organization_idx
on public.invitations (organization_id, lower(email))
where status = 'pending';

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
    select organization_id into expected_organization_id from public.profiles where id = new.profile_id;
    if expected_organization_id is distinct from new.organization_id then raise exception 'Profile does not belong to this organization'; end if;
    select organization_id, key into expected_organization_id, target_role_key from public.roles where id = new.role_id;
    if expected_organization_id is distinct from new.organization_id then raise exception 'Role does not belong to this organization'; end if;
    if target_role_key = 'owner' and not exists (
      select 1 from public.organization_role_assignments assignments
      join public.roles roles on roles.id = assignments.role_id
      where assignments.profile_id = auth.uid() and roles.key = 'owner' and assignments.organization_id = new.organization_id
    ) then raise exception 'Only a workspace owner can assign the Owner role'; end if;
  elsif tg_table_name = 'team_memberships' then
    select organization_id into expected_organization_id from public.profiles where id = new.profile_id;
    if expected_organization_id is distinct from new.organization_id then raise exception 'Profile does not belong to this organization'; end if;
    select organization_id into expected_organization_id from public.teams where id = new.team_id;
    if expected_organization_id is distinct from new.organization_id then raise exception 'Team does not belong to this organization'; end if;
  elsif tg_table_name = 'invitations' then
    select organization_id into expected_organization_id from public.roles where id = new.role_id;
    if expected_organization_id is distinct from new.organization_id then raise exception 'Role does not belong to this organization'; end if;
  elsif tg_table_name = 'invitation_teams' then
    select organization_id into expected_organization_id from public.invitations where id = new.invitation_id;
    if expected_organization_id is distinct from new.organization_id then raise exception 'Invitation does not belong to this organization'; end if;
    select organization_id into expected_organization_id from public.teams where id = new.team_id;
    if expected_organization_id is distinct from new.organization_id then raise exception 'Team does not belong to this organization'; end if;
  end if;
  return new;
end;
$$;

create trigger organization_role_assignments_tenant_integrity
before insert or update on public.organization_role_assignments
for each row execute procedure public.ensure_workspace_tenant_integrity();

create trigger team_memberships_tenant_integrity
before insert or update on public.team_memberships
for each row execute procedure public.ensure_workspace_tenant_integrity();

create trigger invitations_tenant_integrity
before insert or update on public.invitations
for each row execute procedure public.ensure_workspace_tenant_integrity();

create trigger invitation_teams_tenant_integrity
before insert or update on public.invitation_teams
for each row execute procedure public.ensure_workspace_tenant_integrity();

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id <> old.organization_id then raise exception 'Organization cannot be changed'; end if;
  if lower(new.email) <> lower(old.email) then raise exception 'Email cannot be changed here'; end if;
  if new.status <> old.status and not public.has_organization_permission(old.organization_id, 'members.manage') then
    raise exception 'You do not have permission to change member status';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
before update on public.profiles
for each row execute procedure public.protect_profile_fields();

create or replace function public.create_workspace_invitation(
  invitee_email text,
  target_role_id uuid,
  target_team_id uuid,
  token_digest text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_uuid uuid := public.current_organization_id();
  invitation_uuid uuid;
begin
  if organization_uuid is null or not public.has_organization_permission(organization_uuid, 'members.manage') then
    raise exception 'You do not have permission to invite members';
  end if;
  if not exists (select 1 from public.roles where id = target_role_id and organization_id = organization_uuid) then
    raise exception 'Selected role is not available in this workspace';
  end if;
  if target_team_id is not null and not exists (select 1 from public.teams where id = target_team_id and organization_id = organization_uuid) then
    raise exception 'Selected team is not available in this workspace';
  end if;

  update public.invitations
  set status = 'revoked', revoked_at = timezone('utc', now())
  where organization_id = organization_uuid and lower(email) = lower(invitee_email) and status = 'pending';

  insert into public.invitations (organization_id, email, role_id, invited_by_profile_id, token_hash)
  values (organization_uuid, lower(invitee_email), target_role_id, auth.uid(), token_digest)
  returning id into invitation_uuid;

  if target_team_id is not null then
    insert into public.invitation_teams (invitation_id, organization_id, team_id)
    values (invitation_uuid, organization_uuid, target_team_id);
  end if;

  return invitation_uuid;
end;
$$;

create or replace function public.assign_workspace_role(target_profile_id uuid, target_role_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_uuid uuid := public.current_organization_id();
begin
  if organization_uuid is null or not public.has_organization_permission(organization_uuid, 'roles.manage') then
    raise exception 'You do not have permission to manage roles';
  end if;
  if not exists (select 1 from public.profiles where id = target_profile_id and organization_id = organization_uuid) then
    raise exception 'Selected member is not available in this workspace';
  end if;
  if not exists (select 1 from public.roles where id = target_role_id and organization_id = organization_uuid) then
    raise exception 'Selected role is not available in this workspace';
  end if;

  insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
  values (organization_uuid, target_profile_id, target_role_id, auth.uid())
  on conflict do nothing;

  perform public.record_audit_event(organization_uuid, 'workspace.role_assigned', 'profile', target_profile_id, jsonb_build_object('role_id', target_role_id));
end;
$$;

revoke all on function public.create_workspace_invitation(text, uuid, uuid, text) from public;
revoke all on function public.assign_workspace_role(uuid, uuid) from public;
grant execute on function public.create_workspace_invitation(text, uuid, uuid, text) to authenticated;
grant execute on function public.assign_workspace_role(uuid, uuid) to authenticated;
