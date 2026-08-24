# AI Church OS — Engineering Guide

## Source of truth

Before implementing a feature, read `README.md`, `docs/architecture.md`, and `docs/sprint-0.md`. The PRD, SAS, DSPS, DMB, ABS, Lovable Build Bible, and Engineering Roadmap supplied for this project are authoritative.

## Non-negotiable rules

- Production SaaS, never a demo/prototype implementation.
- TypeScript strict mode only. Run lint, typecheck, tests, build, and formatting checks before considering work complete.
- Use the feature structure: `components`, `hooks`, `services`, `types`, `utils`, `store`, `api`, `tests` as relevant. Do not create catch-all folders.
- Each church-owned table requires `organization_id`, RLS, and server-side authorisation. Never bypass tenant isolation.
- AI belongs to the central AI Brain; no isolated feature-level AI providers or logic.
- Plugins are event-driven adapters. The core must not depend on OBS, vMix, or other streaming applications.
- Global Zustand state is limited to the organisation, active service, streaming state, current presentation/scripture/song, and AI status. Server state belongs in React Query.
- Preserve human authority over every AI action: auditability, confidence, approval and reversible manual controls.
- Match DSPS: desktop-first, dark-first, calm broadcast-software UX. Make production-critical controls clear, accessible and keyboard-conscious.

## Sprint discipline

Build in roadmap order. Do not pull later-sprint product features into earlier work without an explicit decision. Every increment needs error, loading and empty states where relevant, tests, documentation, and no console/type errors.
