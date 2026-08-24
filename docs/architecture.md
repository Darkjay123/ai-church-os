# AI Church OS — Foundation Architecture

## Authority

This codebase implements the PRD, SAS, DSPS, DMB, ABS, Lovable Build Bible, and Engineering Roadmap. If requirements conflict, retain human operator authority, organisation isolation, and the roadmap’s delivery order; record the decision before implementation.

## Sprint 0 boundaries

- Next.js App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui.
- Supabase Auth, PostgreSQL, Realtime and Storage integration boundaries.
- Centralised global state only: organisation, active service, stream, current presentation/scripture/song, and AI status.
- Feature-local state remains inside `src/features/<feature>/`.
- React Query provides server-state caching. Zustand is not a database cache.
- `src/proxy.ts` refreshes Supabase sessions and blocks unauthenticated access to protected workspace routes. Every data access must still validate the authenticated user and organisation context server-side.

## Tenant isolation

Every church-owned table must have `organization_id`, a foreign key to `organizations`, RLS enabled, and policies scoped through `public.current_organization_id()`. Do not use a client-supplied organisation ID as authority. Global Bible/catalogue records are the exception and must be deliberately modelled as global.

## AI Brain and events

No feature owns its own AI provider or decision engine. All future AI requests enter a central AI Brain service. AI outputs must carry `confidence_score`, be auditable, and preserve operator approval, rejection, pin, lock, edit, and disable-automation controls.

Use events to decouple modules and plugins. Canonical event names will be finalised before the first live feature. Plugins are adapters; core modules must not depend on OBS, vMix, or any other streaming integration.

## Security

Never commit secrets. Public Supabase URL and publishable key go in `.env.local`; server-only credentials, streaming credentials, and AI keys remain server-only. Use Zod validation at every server boundary. Permissions are enforced in database policies and server code, not in the UI alone.
