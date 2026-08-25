create or replace function public.ensure_workspace_tenant_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_organization_id uuid;
  target_role_key text;
  has_existing_owner boolean;
  has_existing_assignment boolean;
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

    if target_role_key = 'owner' then
      select exists (
        select 1
        from public.organization_role_assignments assignments
        join public.roles roles on roles.id = assignments.role_id
        where assignments.organization_id = new.organization_id
          and roles.key = 'owner'
      ) into has_existing_owner;

      if not has_existing_owner then
        select exists (
          select 1
          from public.organization_role_assignments
          where organization_id = new.organization_id
        ) into has_existing_assignment;

        if has_existing_assignment
          or new.profile_id is distinct from new.assigned_by_profile_id then
          raise exception 'Initial workspace owner must be self-assigned during provisioning';
        end if;
      elsif not exists (
        select 1
        from public.organization_role_assignments assignments
        join public.roles roles on roles.id = assignments.role_id
        where assignments.profile_id = auth.uid()
          and assignments.organization_id = new.organization_id
          and roles.key = 'owner'
      ) then
        raise exception 'Only a workspace owner can assign the Owner role';
      end if;
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
