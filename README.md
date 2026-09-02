# AI Church OS

**The Operating System for Modern Churches.**

AI Church OS is a production-grade, AI-native SaaS platform for church presentations, live-service production, scripture, worship lyrics, real-time transcription, sermon intelligence, archives, and streaming integrations—unified by one central AI Brain.

## Current delivery

Sprints 0–1 establish the production, authentication, secure workspace, and RLS foundation. Sprint 2 delivers the operator-owned Live Service control room: services can be created, deliberately started, and deliberately ended with tenant-scoped timeline and audit records. See `docs/sprint-2.md`.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set the Supabase variables in `.env.local`, then apply every migration in `supabase/migrations/` in order before testing sign-up, sign-in, or Live Service. `202608250003_foundation_hardening.sql` is required for the current grants, invitation acceptance, RLS, and authorization model; `202609020006_live_service_foundation.sql` adds the protected live-service lifecycle and `202609020007_restore_permission_function_contract.sql` restores the canonical permission-RPC contract for PostgREST. See `docs/foundation-hardening.md` and `docs/sprint-2.md`.

Google OAuth configuration, callback allow-listing, and migration prerequisites are documented in `docs/google-oauth-setup.md`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
```

Database-level RLS and grant tests live in `supabase/tests/database/`. Run them with `npx supabase start` followed by `npx supabase test db` (or against an explicitly linked non-production project).

## Project structure

- `src/app` — routes, layouts and route handlers
- `src/components` — reusable product UI and providers
- `src/features` — independent feature modules
- `src/lib` — cross-cutting framework, validation and integration utilities
- `src/store` — narrowly scoped global operator context
- `src/types` — shared domain and database types
- `supabase/migrations` — versioned database and RLS changes
- `docs` — architecture and sprint decisions

Read `docs/architecture.md` before adding a feature. The attached DSPS, DMB, ERSB, LBB, PRD, SAS and ABS remain the project source of truth.
