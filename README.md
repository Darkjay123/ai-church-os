# AI Church OS

**The Operating System for Modern Churches.**

AI Church OS is a production-grade, AI-native SaaS platform for church presentations, live-service production, scripture, worship lyrics, real-time transcription, sermon intelligence, archives, and streaming integrations—unified by one central AI Brain.

## Current delivery

Sprint 0 establishes the production foundation: strict TypeScript, Next.js App Router, Tailwind CSS, shadcn/ui, Supabase boundaries, authentication, organisation-aware RLS migration, global state boundaries, React Query, realtime readiness, protected routes, test tooling, and the desktop-first dashboard shell.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set the Supabase variables in `.env.local`, then apply the migration in `supabase/migrations/` before testing sign-up or sign-in.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
```

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
