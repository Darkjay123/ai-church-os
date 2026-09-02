# Sprint 2 — Live Service Foundation

**Status:** Implemented; apply the Sprint 2 migration before using it in each Supabase environment.

## Roadmap item

Sprint 2 is the Live Service Foundation: the operator-controlled heart of AI Church OS. It follows the completed workspace, authentication, and security foundation, and precedes the Presentation Engine.

## Delivered

- An organisation-scoped live-service record with title, type, schedule, speaker, lifecycle state, and operator attribution.
- Explicit `scheduled → live → ended` transitions. Ended services are deliberately irreversible; only one service may be live in a church workspace at a time.
- A protected Live Service control room with service creation, explicit start/end controls, operator-recorded timeline events, and calm status feedback.
- Permission separation: `services.manage` creates a service; `services.operate` starts or ends service mode. All lifecycle mutations use narrowly scoped database RPCs.
- Read-only service and timeline table grants under RLS. Direct client writes are denied; creation and transitions occur only through authorised RPCs.
- Tenant-integrity triggers bind each service to its creator’s organisation and each timeline event to its service organisation.
- Audio monitoring and microphone cue UI are deliberately local/status-only. No hardware, streaming, display, or AI automation action is implied or triggered.
- AI Brain status is informational only; it states that future suggestions require operator review.

## Migration

Apply `202609020006_live_service_foundation.sql` after migrations `001`–`005`. It creates the service tables, indexes, RLS policies, permission, protected RPCs, audit events, and deterministic permission backfill for existing workspaces.

## Verification

- `src/features/live-service/services/validation.test.ts` covers input and scheduling validation.
- `supabase/tests/database/002_live_service_security_test.sql` covers permission grants, lifecycle transitions, single-live-service enforcement, cross-organisation reads/mutations, and viewer denial.
- Run database tests with a local Supabase stack or explicitly linked non-production project: `npx supabase start && npx supabase test db`.

## Scope boundary

This sprint does not start streaming, capture audio, control a microphone, publish slides, invoke the AI Brain, or integrate OBS/vMix. Those modules arrive in their assigned roadmap sprints. The service mode remains an accountable operator-owned record until then.
