begin;

select plan(17);

insert into auth.users (id, email)
values
  ('20000000-0000-0000-0000-0000000000a1', 'service-owner-a@example.test'),
  ('20000000-0000-0000-0000-0000000000b1', 'service-owner-b@example.test'),
  ('20000000-0000-0000-0000-0000000000c1', 'service-viewer-a@example.test');

insert into public.organizations (id, name)
values
  ('30000000-0000-0000-0000-0000000000a1', 'Service Organisation A'),
  ('30000000-0000-0000-0000-0000000000b1', 'Service Organisation B');

insert into public.profiles (id, organization_id, email, full_name)
values
  ('20000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1', 'service-owner-a@example.test', 'Service Owner A'),
  ('20000000-0000-0000-0000-0000000000b1', '30000000-0000-0000-0000-0000000000b1', 'service-owner-b@example.test', 'Service Owner B'),
  ('20000000-0000-0000-0000-0000000000c1', '30000000-0000-0000-0000-0000000000a1', 'service-viewer-a@example.test', 'Service Viewer A');

select public.provision_organization_roles('30000000-0000-0000-0000-0000000000a1');
select public.provision_organization_roles('30000000-0000-0000-0000-0000000000b1');

insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
select '30000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000a1', id, '20000000-0000-0000-0000-0000000000a1'
from public.roles where organization_id = '30000000-0000-0000-0000-0000000000a1' and key = 'owner';

insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
select '30000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000c1', id, '20000000-0000-0000-0000-0000000000a1'
from public.roles where organization_id = '30000000-0000-0000-0000-0000000000a1' and key = 'viewer';

insert into public.organization_role_assignments (organization_id, profile_id, role_id, assigned_by_profile_id)
select '30000000-0000-0000-0000-0000000000b1', '20000000-0000-0000-0000-0000000000b1', id, '20000000-0000-0000-0000-0000000000b1'
from public.roles where organization_id = '30000000-0000-0000-0000-0000000000b1' and key = 'owner';

select ok(
  has_table_privilege('authenticated', 'public.services', 'SELECT'),
  'authenticated can read services only when RLS permits'
);
select ok(
  not has_table_privilege('authenticated', 'public.services', 'INSERT'),
  'services can be created only through the authorised RPC'
);
select ok(
  not has_table_privilege('anon', 'public.service_timeline_events', 'SELECT'),
  'anon cannot read service timelines'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-0000000000a1', true);

select lives_ok(
  $$select public.create_live_service('Sunday Celebration', 'Sunday service', '2026-09-13T09:00:00Z', 'Pastor A')$$,
  'Org A owner can create a scoped service'
);
select results_eq(
  'select count(*) from public.services',
  array[1::bigint],
  'Org A owner sees the created Org A service'
);
select lives_ok(
  $$select public.start_live_service((select id from public.services where title = 'Sunday Celebration'))$$,
  'authorised owner can start the scheduled service'
);
select results_eq(
  $$select status::text from public.services where title = 'Sunday Celebration'$$,
  array['live'::text],
  'starting service mode records the live state'
);
select results_eq(
  'select count(*) from public.service_timeline_events',
  array[2::bigint],
  'creation and start milestones are retained in the service timeline'
);
select lives_ok(
  $$select public.create_live_service('Evening Prayer', 'Prayer meeting', null, null)$$,
  'Org A owner can schedule another service while one is live'
);
select throws_ok(
  $$select public.start_live_service((select id from public.services where title = 'Evening Prayer'))$$,
  'P0001',
  'Another service is already live',
  'only one service can enter live mode per organization'
);
select lives_ok(
  $$select public.end_live_service((select id from public.services where title = 'Sunday Celebration'))$$,
  'authorised owner can end the live service'
);
select results_eq(
  $$select status::text from public.services where title = 'Sunday Celebration'$$,
  array['ended'::text],
  'ending service mode is persisted'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-0000000000b1', true);
select lives_ok(
  $$select public.create_live_service('Org B Service', 'Sunday service', null, null)$$,
  'Org B owner can create an Org B service'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-0000000000a1', true);
select results_eq(
  'select count(*) from public.services',
  array[2::bigint],
  'Org A owner cannot read Org B service records'
);
select ok(
  not public.has_organization_permission('30000000-0000-0000-0000-0000000000b1', 'services.operate'),
  'Org A owner cannot obtain an Org B service permission'
);
select throws_ok(
  $$update public.services set status = 'live' where title = 'Org B Service'$$,
  '42501',
  '%permission denied%',
  'Org A cannot mutate an Org B service directly'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-0000000000c1', true);
select throws_ok(
  $$select public.create_live_service('Viewer service', 'Sunday service', null, null)$$,
  'P0001',
  'You do not have permission to create services',
  'Viewer cannot create a service'
);
select throws_ok(
  $$select public.start_live_service((select id from public.services where title = 'Evening Prayer'))$$,
  'P0001',
  'You do not have permission to start service mode',
  'Viewer cannot change service state'
);

select * from finish();
rollback;
