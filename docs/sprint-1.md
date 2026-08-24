# Sprint 1 — Church Workspace

**Status:** Implemented; awaiting Supabase configuration and migration validation.

## Delivered

- Church profile and personal profile settings.
- Organisation-scoped system roles: Owner, Administrator, Pastor, Media Director, Operator, Worship Leader, Viewer.
- Separate permissions catalogue and per-organisation role permissions, preserving a path to custom roles.
- Ministry teams and memberships.
- Secure, expiring, single-use invitation links. A workspace owner/administrator creates a link, copies it, and sends it through the church’s preferred channel. The raw token is never stored.
- Database-level permission checks, cross-tenant integrity triggers, protected profile fields, audit events, and RLS policies.
- Dynamic authenticated workspace identity in the application shell.

## Migration order

Apply `202608250001_foundation.sql` before `202608250002_workspace_access.sql`.

## Intentional scope boundary

The roadmap does not identify an email provider. Sprint 1 therefore creates secure invitation links instead of silently adding an email vendor. Transactional email delivery can be added later as a dedicated server-side adapter without changing the invitation security model.

## Role interpretation

The DMB names the seven supplied system roles but does not prescribe an exact matrix. The provided matrix is conservative and documented in the migration. The **Owner** role cannot be assigned by non-owners. Permissions are independently stored so the matrix can evolve without a schema redesign.
