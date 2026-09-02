-- Corrective migration for environments where an earlier permission-function
-- signature was retained. PostgREST resolves RPCs by named arguments, so the
-- canonical names below are part of the application/database contract.

-- Do not drop the legacy (text, uuid) overload: earlier policies may depend
-- on it. The canonical (uuid, text) overload is additive and serves all new
-- policies, database routines, and PostgREST named RPC calls.
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

revoke all on function public.has_organization_permission(uuid, text) from public;
grant execute on function public.has_organization_permission(uuid, text) to authenticated;

-- Ask PostgREST to reload the exposed RPC definition immediately.
notify pgrst, 'reload schema';
