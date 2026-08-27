-- Google OAuth users do not send church metadata through Supabase OAuth.
-- Provision their first workspace only after the callback has established a session.

create or replace function public.provision_oauth_workspace(
  organization_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_uuid uuid;
  owner_role_uuid uuid;
  current_email text;
  current_full_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  organization_name := nullif(trim(organization_name), '');
  if organization_name is null or char_length(organization_name) > 160 then
    raise exception 'Enter a valid church or ministry name';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This account already belongs to a workspace';
  end if;

  select email, nullif(trim(raw_user_meta_data ->> 'full_name'), '')
  into current_email, current_full_name
  from auth.users
  where id = auth.uid();

  if current_email is null then
    raise exception 'Authenticated account email is unavailable';
  end if;

  insert into public.organizations (name)
  values (organization_name)
  returning id into organization_uuid;

  perform public.provision_organization_roles(organization_uuid);

  insert into public.profiles (id, organization_id, email, full_name)
  values (auth.uid(), organization_uuid, current_email, current_full_name);

  select id into owner_role_uuid
  from public.roles
  where organization_id = organization_uuid
    and key = 'owner';

  insert into public.organization_role_assignments (
    organization_id,
    profile_id,
    role_id,
    assigned_by_profile_id
  )
  values (organization_uuid, auth.uid(), owner_role_uuid, auth.uid());

  insert into public.audit_logs (
    organization_id,
    actor_id,
    event_type,
    entity_type,
    entity_id
  )
  values (
    organization_uuid,
    auth.uid(),
    'auth.user_registered',
    'profile',
    auth.uid()
  );

  return organization_uuid;
end;
$$;

revoke all on function public.provision_oauth_workspace(text) from public;
grant execute on function public.provision_oauth_workspace(text) to authenticated;
