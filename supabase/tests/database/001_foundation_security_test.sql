begin;

select plan(26);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-0000000000c1', 'viewer-a@example.test'),
  ('00000000-0000-0000-0000-0000000000d1', 'invitee@example.test');

insert into public.organizations (id, name)
values
  ('10000000-0000-0000-0000-0000000000a1', 'Organisation A'),
  ('10000000-0000-0000-0000-0000000000b1', 'Organisation B');

insert into public.profiles (id, organization_id, email, full_name)
values
  ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', 'owner-a@example.test', 'Owner A'),
  ('00000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-0000000000b1', 'owner-b@example.test', 'Owner B'),
  ('00000000-0000-0000-0000-0000000000c1', '10000000-0000-0000-0000-0000000000a1', 'viewer-a@example.test', 'Viewer A');

select public.provision_organization_roles('10000000-0000-0000-0000-0000000000a1');
select public.provision_organization_roles('10000000-0000-0000-0000-0000000000b1');

insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
select '10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', id, '00000000-0000-0000-0000-0000000000a1'
from public.roles where organization_id = '10000000-0000-0000-0000-0000000000a1' and key = 'owner';

insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
select '10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', id, '00000000-0000-0000-0000-0000000000a1'
from public.roles where organization_id = '10000000-0000-0000-0000-0000000000a1' and key = 'viewer';

insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
select '10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', id, '00000000-0000-0000-0000-0000000000b1'
from public.roles where organization_id = '10000000-0000-0000-0000-0000000000b1' and key = 'owner';

insert into public.audit_logs (organization_id, actor_id, event_type)
values
  ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', 'test.audit_a'),
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'test.audit_b');

select ok(
  has_table_privilege('authenticated', 'public.organizations', 'SELECT'),
  'authenticated can read organizations when RLS permits'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE'),
  'authenticated has scoped profile update privilege'
);
select ok(
  has_table_privilege('authenticated', 'public.teams', 'INSERT'),
  'authenticated can create permitted teams'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'SELECT'),
  'anon cannot read profiles'
);
select ok(
  not has_table_privilege('anon', 'public.invitations', 'SELECT'),
  'anon cannot read invitations'
);select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
  'audit history is writeable only through the constrained audit RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.organization_role_assignments', 'INSERT'),
  'role assignment is RPC-only'
);
select ok(
  not has_table_privilege('authenticated', 'public.team_memberships', 'INSERT'),
  'team membership is RPC-only'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

select results_eq(
  'select count(*) from public.organizations',
  array[1::bigint],
  'Org A owner reads only Organization A'
);
select results_eq(
  'select count(*) from public.profiles',
  array[2::bigint],
  'Org A owner reads only Org A profiles'
);
select results_eq(
  'select count(*) from public.roles',
  array[7::bigint],
  'Org A owner reads only Org A roles'
);
select results_eq(
  'select count(*) from public.role_permissions',
  array[(select count(*) from public.role_permissions where organization_id = '10000000-0000-0000-0000-0000000000a1')::bigint],
  'Org A owner cannot read Org B role permissions'
);
select ok(
  public.has_organization_permission('10000000-0000-0000-0000-0000000000a1', 'teams.manage'),
  'Org A owner has Org A permission'
);
select ok(
  not public.has_organization_permission('10000000-0000-0000-0000-0000000000b1', 'teams.manage'),
  'Org A owner cannot obtain Org B permission by supplying Org B ID'
);
select lives_ok(
  $$insert into public.teams (organization_id, name) values ('10000000-0000-0000-0000-0000000000a1', 'Media')$$,
  'Org A owner can create an Org A team'
);
select throws_ok(
  $$insert into public.teams (organization_id, name) values ('10000000-0000-0000-0000-0000000000b1', 'Cross tenant')$$,
  '42501',
  '%row-level security%',
  'Org A owner cannot create Org B data'
);
select results_eq(
  'select count(*) from public.audit_logs',
  array[1::bigint],
  'Audit reader sees only its organization audit history'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
select results_eq(
  'select count(*) from public.audit_logs',
  array[0::bigint],
  'Viewer cannot read audit history'
);
select results_eq(
  'select count(*) from public.invitations',
  array[0::bigint],
  'Viewer cannot read workspace invitations'
);
select results_eq(
  $$update public.profiles set status = 'suspended' where id = '00000000-0000-0000-0000-0000000000a1' returning status::text$$,
  array[]::text[],
  'Viewer cannot change another member status'
);
select throws_ok(
  $$update public.profiles set organization_id = '10000000-0000-0000-0000-0000000000b1' where id = '00000000-0000-0000-0000-0000000000c1'$$,
  '42501',
  '%permission denied%',
  'Member cannot change its organization column'
);
select throws_ok(
  $$select public.set_workspace_member_status('00000000-0000-0000-0000-0000000000a1', 'suspended')$$,
  'P0001',
  'You do not have permission to manage members',
  'Viewer cannot invoke privileged member-management action'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select lives_ok(
  $$select public.set_workspace_member_status('00000000-0000-0000-0000-0000000000c1', 'suspended')$$,
  'Owner can change another member status through the scoped RPC'
);
select results_eq(
  $$select status::text from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'$$,
  array['suspended'::text],
  'Scoped member-management RPC changed only the intended status'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select results_eq(
  'select count(*) from public.profiles',
  array[1::bigint],
  'Org B owner cannot read Org A profiles'
);
select ok(
  not public.has_organization_permission('10000000-0000-0000-0000-0000000000a1', 'roles.manage'),
  'Org B owner cannot obtain Org A permission'
);

select * from finish();
rollback;
