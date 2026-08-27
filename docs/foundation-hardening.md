# Foundation Hardening Sprint

**Status:** Implemented in code; database migration must be applied to each Supabase environment before release.

## Scope

This corrective, additive migration hardens the Sprint 0/1 foundation without changing product architecture or adding roadmap features. It does not rewrite the already-versioned `202608250001` or `202608250002` migrations.

## Verified findings and corrections

### Table privileges and RLS

The original migrations enabled RLS and defined policies, but did not explicitly grant application-table access to `authenticated`. On current Supabase projects, table privileges and RLS are separate checks: a valid RLS policy cannot compensate for a missing table privilege.

`202608250003_foundation_hardening.sql` now revokes all direct table privileges from `anon` and `authenticated`, then grants only the operations used by the application:

| Table                                                                       | Authenticated privileges                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `organizations`                                                             | `SELECT`; limited `UPDATE` on editable organisation fields    |
| `profiles`                                                                  | `SELECT`; limited `UPDATE` on personal display/contact fields |
| `audit_logs`                                                                | `SELECT`; writes only through the constrained audit RPC       |
| `permissions`, `roles`, `role_permissions`, `organization_role_assignments` | `SELECT`                                                      |
| `teams`                                                                     | `SELECT`, `INSERT`, `UPDATE`, `DELETE` under RLS              |
| `team_memberships`, `invitations`, `invitation_teams`                       | `SELECT`; writes only through privileged RPCs                 |

`anon` receives no direct table privileges. `service_role` retains administrative access for trusted operations, but the unused application `src/lib/supabase/admin.ts` client has been removed; the app no longer requires a service-role environment variable.

### Member management

The original `profiles` update policy combined self-updates and manager updates, while the field guard was intended to protect privileged fields. This made authorization difficult to reason about and depended on a broad table update grant.

The final model is intentionally narrow:

- Members can update only their own `full_name`, `avatar_url`, and `phone`.
- The profile trigger prevents changes to `organization_id`, `email`, or `status` outside the dedicated path.
- `set_workspace_member_status(profile_id, status)` is the only member-status mutation path. It requires `members.manage`, requires the target to be in the caller’s organisation, blocks self-status changes, and writes an audit event.
- Role assignment remains the guarded `assign_workspace_role` RPC; tenant-integrity and owner-role guards validate target profile, target role, and organisation consistency.

### Permission isolation and owner protection

`has_organization_permission(target_organization_id, permission)` now explicitly joins the caller’s profile, role assignment, role, role-permission mapping, and target organisation. Passing a foreign organisation ID cannot grant access.

The tenant-integrity trigger allows the initial owner assignment performed by the trusted `auth.users` trigger, where no authenticated request exists. Client-facing owner assignment still requires an existing owner in that same organisation. No normal member or administrator can self-assign Owner.

### Audit security and realtime

Audit history now requires the `audit.read` permission. That permission is granted only to the existing Owner and Administrator system roles. `audit_logs`, `invitations`, and `organization_role_assignments` were removed from the Realtime publication because the current application has no verified need for client streaming of those security-sensitive records.

### Invitation and signup flow

The original `handle_new_user` trigger attempted invitation validation and acceptance during `auth.users` insertion. An invalid, expired, reused, or mismatched token could abort account creation and surface as a generic auth database error.

The corrected flow is:

```text
Signup → Auth account → email confirmation → callback → explicit accept_workspace_invitation(token)
```

- The sign-up server action hashes and validates the invitation token before calling Auth, without logging the raw token.
- `handle_new_user` provisions a new owner workspace only when `church_name` is present. Invitation recipients are created as Auth users without a tenant profile.
- `accept_workspace_invitation(token)` runs only after authentication. It validates the token hash, pending status, expiry, recipient email, target role/organisation, and single-use transition before creating the profile, role assignment, optional team memberships, and audit event.
- The callback performs invitation acceptance and redirects to the dashboard only after it succeeds. It redirects to a safe sign-up error state on a failure.

## Multi-organisation decision

**MULTI-ORG: DEFERRED WITH MIGRATION PLAN.**

The current schema has one `profiles` row per `auth.users` row and a required `profiles.organization_id`; `current_organization_id()`, the dashboard scope loader, existing RLS policies, role assignments, invitations, and feature data all rely on this relationship. It therefore supports exactly one organisation per user today.

The correct future migration is:

1. Introduce `organization_memberships (id, organization_id, user_id, status, joined_at, ...)` and move member status there.
2. Move role and team references from `profile_id` to membership/user-aware references where appropriate.
3. Add `active_organization_id` to an authenticated user preference table or verified JWT/session claim, never a client-trusted parameter.
4. Rewrite `current_organization_id()` and every RLS policy to resolve the active membership.
5. Backfill one membership per existing profile, retain a compatibility view during transition, then remove `profiles.organization_id` only after all policies and queries migrate.
6. Add cross-organisation RLS tests for active-org switching before cutover.

This is not a safe small patch while all current tenant tables and policies depend on a single profile organisation. The hardening migration removes an implicit invitation-trigger dependency without pretending multi-org is solved.

## Migration hygiene

`202608250001` defined baseline tables, `handle_new_user`, session scope, and audit Realtime. `202608250002` redefined `handle_new_user`, tenant-integrity, profile protection, and several privileged functions. `202608250003` is the canonical corrective layer for the final deployed behaviour of:

- `provision_organization_roles`
- `has_organization_permission`
- `record_audit_event`
- `ensure_workspace_tenant_integrity`
- `protect_profile_fields`
- `handle_new_user`
- invitation validation and acceptance
- table/function privileges, RLS policies, and Realtime publication

Do not edit the historical migrations after deployment. Apply `202608250003_foundation_hardening.sql` as the next migration. The project includes `supabase/config.toml` and pgTAP tests in `supabase/tests/database/`; run them against a local Supabase stack or an explicitly linked non-production project.

## Tests

- TypeScript/Vitest covers Supabase URL normalisation, production fail-closed configuration, invitation token hashing, and existing input validation.
- `supabase/tests/database/001_foundation_security_test.sql` is the database-level regression suite for explicit grants, RLS, cross-organisation read/write isolation, member-status authorization, role/owner escalation, audit access, invitation validation, and direct table-write denial.
- The Supabase CLI database suite requires Docker/Podman for a local stack or an explicitly linked test project. This Zo environment has neither a local container runtime nor a linked project, so the suite is committed and syntactically reviewed but cannot be executed here.

## Known low-priority debt

- `src/app/(app)/[workspace-area]/page.tsx` deliberately displays named roadmap placeholders but does return a generic protected placeholder for unknown single-segment workspace URLs. It does not expose data or bypass auth. Replace it with explicit routes as features ship.
- Logging now uses small structured server events with timestamp, operation, request ID, safe user ID, category, and safe database error metadata. It intentionally does not attempt to become a full observability platform.

## Google OAuth workspace provisioning

Supabase OAuth does not accept arbitrary sign-up metadata for a new social account. A first-time Google user is therefore authenticated and redirected to `/complete-workspace`, where the authenticated user supplies the church or ministry name. `202608250005_google_oauth_workspace_provisioning.sql` adds the narrowly scoped `provision_oauth_workspace(text)` RPC. It creates the same organisation, system roles, owner profile, owner-role assignment, and audit record as the existing email/password `handle_new_user` trigger. Existing Google users with a profile are redirected directly to the dashboard. Google setup and callback allow-listing are documented in `docs/google-oauth-setup.md`.
