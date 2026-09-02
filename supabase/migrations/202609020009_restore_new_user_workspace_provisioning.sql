-- Corrective migration for environments where the original auth.users trigger was
-- installed before the role-provisioning trigger implementation existed. Email/password
-- signup must provision exactly the same owner-capable workspace foundation as OAuth.

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
    raise exception 'church_name is required to create a workspace';
  end if;

  insert into public.organizations (name)
  values (organization_name)
  returning id into organization_uuid;

  perform public.provision_organization_roles(organization_uuid);

  insert into public.profiles (id, organization_id, email, full_name)
  values (
    new.id,
    organization_uuid,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  );

  select id into owner_role_uuid
  from public.roles
  where organization_id = organization_uuid
    and key = 'owner';

  if owner_role_uuid is null then
    raise exception 'Workspace owner role could not be provisioned';
  end if;

  insert into public.organization_role_assignments (
    organization_id,
    profile_id,
    role_id,
    assigned_by_profile_id
  )
  values (organization_uuid, new.id, owner_role_uuid, new.id);

  insert into public.audit_logs (organization_id, actor_id, event_type, entity_type, entity_id)
  values (organization_uuid, new.id, 'auth.user_registered', 'profile', new.id);

  return new;
end;
$$;
