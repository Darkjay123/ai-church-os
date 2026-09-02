# Sprint 0 — Project Foundation

**Status:** Complete

## Goal

Establish a production-safe foundation without pre-building roadmap features.

## Delivered

- Next.js App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui, ESLint and Prettier.
- Feature-based source structure and documentation.
- Supabase browser/server/proxy clients, environment contract, authentication screens and protected route policy.
- Initial organisation/profile/audit schema migration with RLS for church-owned records.
- Zustand global context boundary, React Query provider and Realtime-ready Supabase client.
- Desktop-first dark production shell: persistent navigation, top status bar, contextual panel, skeleton loading state, dashboard shell.
- Validation tests for sign-in and registration rules.

## Requires configuration before integration testing

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set the project URL and publishable key.
3. Apply `supabase/migrations/202608250001_foundation.sql` using the Supabase CLI or SQL Editor.
4. In Supabase Auth, set the site URL and redirect URL for `/auth/callback`.

## Deliberately deferred

Church profile editing, invitations, roles, permission catalogue, presentation creation, service creation, AI calls, streaming, transcription, Bible content, storage workflows and billing remain in their specified sprints.

## Open product decisions

- Canonical event taxonomy between SAS/LBB and ABS names.
- Formal role/permission matrix and membership model.
- Final AI auto-execution thresholds and eligible action list.
