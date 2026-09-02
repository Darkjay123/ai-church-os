# AI Church OS — Visual Direction Lab

**Status:** research and prototype brief — no production interface changes in this phase  
**Date:** 2 September 2026  
**Scope:** visual identity and interaction system only. Product roadmap, authentication, Supabase/RLS, AI Brain boundaries, plugin architecture and Sprint 2 Live Service behaviour are unchanged.

## Executive position

AI Church OS should feel like **a composed production instrument**, not a cheerful church app and not a generic SaaS dashboard. The winning system should carry the calm, tactile confidence of an audio console or live switcher: the operator sees the present state immediately, understands what can change, and acts without hunting.

The recommended direction is **B — Signal Room**: a contemporary broadcast-control language built from near-black graphite, blue signal light, restrained amber timing cues and a refined operational type system. It honours the DSPS dark-first, electric-blue, three-column mandate while making the UI recognisable by its “signal path” geometry rather than decoration.

## Current UI audit

### What is working

- The dark-first three-column structure, persistent navigation and Live Service controls already align to the DSPS.
- Status is legible: blue identifies active navigation and primary action; green identifies live/system health.
- The authenticated Live Service screen has an appropriate operational hierarchy: create service, current selection, timeline, audio and AI state.
- Forms are accessible, keyboard-native HTML controls with clear labels and focus states.

### What makes it feel generic today

| Before                                                    | Proposed direction                                                                                         | Why                                                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Geist/Inter-like neutral sans everywhere                  | A deliberate humanist grotesk for UI plus compact mono telemetry                                           | The current type is technically clean but has no ownable sonic or broadcast character. |
| Soft, rounded, outlined cards as the main grouping device | Flush work surfaces separated by a stable rail, with only active/critical modules elevated                 | Card stacks signal SaaS. A control room needs a room plan.                             |
| Uniform blue-filled primary buttons                       | Blue is treated as a “take action” signal; destructive/live actions have singular high-contrast treatments | Colour should mean a system state, not be a default decoration.                        |
| Repeated 12–16px rounded rectangles                       | 4px/8px geometry, square telemetry and restrained 12px only for transient overlays                         | Repetition of soft corners removes operational precision.                              |
| Sidebar looks like common dashboard navigation            | A labelled channel strip with section dividers, active signal line, and keyboard affordances               | Navigation should read as equipment routing, not a website menu.                       |
| “AI Brain ready” resembles any status pill                | AI is a quiet assisted system: labelled confidence/readiness with a pulse only when state changes          | AI should support an operator, never compete with the service.                         |
| Broad empty dark areas around separate cards              | Deliberate density and a predictable 8px spatial rhythm                                                    | Live service work requires comfortable scanning, not marketing whitespace.             |
| Status colour occasionally carries the whole meaning      | Status colour + shape + explicit label + timestamp/metric where useful                                     | Dim booths and colour-vision differences make colour-only states unsafe.               |

### Current interface details observed

- **Typography:** a neutral geometric sans, bold display headings and tracked all-caps overlines. Legible but familiar.
- **Colour/material:** blue-on-black, slate panels, thin outlines, conventional success green. Calm, but visually interchangeable with developer tooling.
- **Shape/depth:** rounded cards and inputs, low-contrast borders, flat panes. Consistent but lacks a distinct material rule.
- **Layout:** correctly desktop-first; the sidebar is stable, the header dense enough, and the Live Service page starts with the right task. The centre work area still reads as a set of conventional dashboard panels.
- **Motion/feedback:** functional states exist, but the system does not yet have a documented motion grammar. The design must not add movement merely to look current.

## Reference analysis

### Design and interaction references

- **Fonts In Use** is useful as a comparative archive: it exposes a broader vocabulary than default product type, especially in institutional, music, editorial and software use. The lesson is not “use a novelty font”; it is to choose a typeface with a recognisable voice and use it with restraint.
- **CARI Aesthetics** supports the opposite discipline: name a coherent visual family rather than assembling fashionable fragments. For AI Church OS, the useful family is _contemporary technical pastoral_ — precision, low light, typography and measured signal.
- **Emil Kowalski**: motion must communicate state, preserve spatial continuity and respond instantly. Use specific property transitions, not `transition: all`; reserve spring physics for direct manipulation; make press feedback tactile; obey reduced motion. Typical interface motion should remain under 250ms, with no repeated animation on high-frequency controls.
- **Linear** is an important density reference: visual weight is earned by task importance, navigation recedes, and structure should be felt rather than outlined everywhere.
- **Raycast/Superhuman** demonstrate keyboard discoverability and low-friction, immediate response. The lesson is operational pace, not copying their black rounded command-palette aesthetic.

### Open-source product references

- **OpenBeam** is strongest where it makes the live signal visible: transcription, detection confidence, output labels, audio meter, overlay and queue are separate live modules. Borrow its explicit data/state language and per-output independence — not its general Tailwind/shadcn visual treatment.
- **FreeShow** earns its desktop-software character through stage/output separation, dense editing surfaces and functional theming. Borrow its orientation around _current/next/output_ rather than generic document cards. Avoid importing its legacy desktop complexity or visual density without hierarchy.
- **OpenLP** is a valuable warning and a useful architectural reference: it makes the operational model explicit (service, media, display) but its classic desktop widgets reinforce why AI Church OS needs clearer hierarchy and modern feedback.

### Commercial product references

- **Pewbeam** sells confidence and flow: speak, detect, display. Its documentation’s preview/live pairing and manual/auto distinction are valuable principles for human authority. Its public marketing leans into glow and feature presentation; AI Church OS should be quieter, more infrastructural and less “AI magic”.
- **Loghema** positions around a unified worship-service workflow. The relevant lesson is to sell the operational environment, not an isolated presentation tool. Its public material does not provide enough inspectable product UI to use as a detailed interaction reference.

## Do not look like this

These are guardrails, not blanket bans.

1. **Card grid as page architecture.** A card may contain a bounded, changing operational unit; it must not substitute for layout.
2. **Default shadcn visual language.** We may retain accessible primitives, but no default radius, slate hierarchy or button treatment should define the product.
3. **Generic Inter/Geist everywhere.** Neutral fonts remain fallbacks, not the identity.
4. **Purple AI gradients, sparkle icons and anthropomorphic AI.** AI is a named operational system with confidence and approval state.
5. **Glass for its own sake.** Transparency belongs only where it materially indicates an overlay, a preview or a transient control.
6. **Border soup.** Use rails, tonal separation and disciplined elevation before adding a line.
7. **Oversized dashboard headlines.** Headings orient; live state and controls take priority.
8. **Excessively pill-shaped UI.** Pills are reserved for compact, transient state labels; the application should not become soft and toy-like.
9. **Nested cards and gratuitous whitespace.** Production tasks deserve density and scanability.
10. **Decorative animation.** High-frequency actions, navigation and timers should not drift, bounce or shimmer.
11. **Generic “sidebar + topbar + KPI cards” dashboard composition.** Preserve the three-column DSPS pattern but make it read as a console: channel strip, working stage, context/monitoring bay.
12. **Marketing language inside operational controls.** A command should say what it does: _Start service_, not _Let’s go live_.

## Visual DNA — Signal Room

### Identity statement

**Signal Room** is a low-light operating environment: graphite equipment, paper-white type, calibrated electric-blue routing light, amber timecode and restrained green confirmation. It is exact without being cold, and reverent without borrowing religious ornament.

### Typography

**Recommendation:**

- **UI / interface:** **Figtree** — open-source (SIL Open Font License), variable, warm enough for an organisation serving people, compact enough for dense control surfaces.
- **Telemetry / timecode / keyboard hints:** **IBM Plex Mono** — open-source (SIL Open Font License), distinctive but not theatrical; used sparingly for timestamps, decibel values, shortcuts, IDs and system labels.
- **Fallback:** `ui-sans-serif, system-ui, sans-serif` and `ui-monospace, SFMono-Regular, Menlo, monospace`.

Rules:

- Sentence case for all task labels and controls.
- All-caps only for micro-labels, with IBM Plex Mono, 0.12em tracking and low emphasis.
- Main page heading: 30–34px / 1.05 at desktop; avoid billboard scale.
- Core operational labels: 13px medium; body: 14px / 1.5; telemetry: 11–12px mono.
- No decorative serif, worship-script or “churchy” display font. The product earns warmth through clarity.

### Colour and material

| Token              | Value     | Intended use                                               |
| ------------------ | --------- | ---------------------------------------------------------- |
| `--canvas`         | `#080A0D` | application field / surrounding dark                       |
| `--rail`           | `#0E1218` | sidebar and top control rail                               |
| `--surface`        | `#121821` | standard working surface                                   |
| `--surface-raised` | `#171F2A` | selected/active module                                     |
| `--surface-inset`  | `#0B1016` | inputs, preview wells, telemetry bays                      |
| `--line`           | `#263141` | structural separation                                      |
| `--line-strong`    | `#34435A` | selected boundary / focus context                          |
| `--ink`            | `#F3F6FB` | primary text                                               |
| `--ink-muted`      | `#98A7BB` | supporting text                                            |
| `--signal`         | `#2E7DFF` | primary route/action and active navigation                 |
| `--signal-bright`  | `#76A7FF` | focus/hover edge                                           |
| `--live`           | `#EF4444` | only active live/on-air state or consequential stop action |
| `--ready`          | `#24D6A2` | connected/healthy/confirmed                                |
| `--cue`            | `#F1B84B` | timing, review, scheduled/attention                        |
| `--fault`          | `#FF6B6B` | error/failure                                              |
| `--ai`             | `#A6B4FF` | AI-assisted state; never gradient                          |

Material rules:

- Matte surfaces, no glossy gradient fill.
- A 1px structural rail is preferable to a box border around everything.
- Elevation is tonal first; use a soft near-black shadow only for flyouts and dialogs.
- Blue is a routing/action light. Red means live or stop. Green means a confirmed healthy outcome. Amber means attention/time.

### Shape and depth

- **Default radius:** 6px.
- **Compact controls:** 4px.
- **Panels/modules:** 8px only when they are independently movable or conceptually distinct.
- **Pills:** 999px reserved for compact status, never for standard buttons or cards.
- **Border:** one quiet structural line; use tonal inset backgrounds for fields.
- **Shadow:** `0 18px 48px rgba(0,0,0,.32)` only on popovers/modals; normal panels do not float.

### Layout and density

- Keep the DSPS three-column geometry: **channel strip (240px) → working stage (fluid) → monitor/context bay (320px)**. The right bay may collapse below a deliberate breakpoint, but it should not disappear on the desktop flow.
- Establish a strict 8px rhythm: 4, 8, 12, 16, 24, 32, 48.
- Page content begins with a 24px service/status rail, then a concise 30–34px heading and direct action cluster.
- Every live page has a consistent scan order: **on-air state → current/next output → primary operator action → timeline → supporting monitors**.
- Use tables/lists as tables/lists. Do not convert operational rows into visual cards.
- The primary action sits in one predictable location; contextual secondary actions belong beside the object they affect.

### Component grammar

- **Buttons:** 36px standard / 40px primary. Filled signal blue only for the current positive commitment. Ghost controls use tonal hover, not outlined boxes. The only full red action is live stop/end.
- **Inputs:** inset field, 40px height, 6px radius, no bright box until keyboard focus. Use labelled controls and explicit helper/error copy.
- **Panels:** header row carries module name, state and one action; avoid chunky “card title + paragraph + button” SaaS pattern.
- **Status:** dot + label + optional metric/timestamp. Never dot alone.
- **Timeline:** a left timecode rail with state mark, actor/source and outcome. Persistent history reads like an operational log rather than chat bubbles.
- **AI cards:** quiet indigo marker, confidence percentage/band, source, and explicit _Review / Apply / Dismiss_ controls. No autonomous-feeling animation.
- **Empty state:** plain language, operational next step, single direct action. No illustration unless it teaches an unfamiliar control.

### Motion principles

1. **Movement has a job:** state transition, spatial relationship, feedback or performance masking. Otherwise it does not move.
2. **Fast and interruptible:** hover/press 120–160ms; panels/popovers 160–220ms; a single state-transition acknowledgement up to 260ms. Use CSS transitions for ordinary UI; never `transition: all`.
3. **Immediate press:** buttons scale to `0.98` on press and recover with `cubic-bezier(.2,.8,.2,1)`. No bounce for critical controls.
4. **Spatial continuity:** context bay opens from the right; command palette originates at the command trigger; toast enters and exits from one consistent corner.
5. **Live state:** an on-air marker changes colour/label immediately; one restrained ring or line sweep may acknowledge the transition once. No continuous pulsing except a very low-amplitude readiness indicator, and never for a critical alert.
6. **Lists/timelines:** new log rows fade/translate 4px once; manual reordering uses spring motion later only when drag exists.
7. **Reduced motion:** all transform animations are removed/reduced to instant opacity/state changes. Timecode and live status remain legible without motion.
8. **No page choreography:** route changes are instant; service work benefits from continuity, not theatrical transitions.

## Four prototype directions

### A. Editorial / Swiss — “Service Index”

- **Idea:** a cultural-institutional operating desk: strict grid, off-white type, cobalt rule, oversized type only for service title.
- **Typography:** Space Grotesk / IBM Plex Mono.
- **Material:** almost flat, hairline rules, minimal elevation.
- **Live room:** the timeline is the visual backbone; current output is a large typographic block, not a screen-shaped card.
- **Strength:** ownable, calm, excellent information hierarchy.
- **Risk:** can feel editorial/administrative rather than immediately broadcast-native.

### B. Modern Broadcast Control Room — “Signal Room” **(recommended)**

- **Idea:** a broadcast console translated for the browser. Status rails, timecode, source labels, muted graphite and decisive signal colours.
- **Typography:** Figtree / IBM Plex Mono.
- **Material:** matte equipment surfaces, compact frames, blue routing light, amber schedule cues and singular red on-air state.
- **Live room:** current service is a state bar; output, timeline, audio and AI each read as monitors with a shared signal grammar.
- **Strength:** most compatible with DSPS, strongest operator authority, recognisable without a logo, scales to streaming/plugins/AI later.
- **Risk:** must avoid impersonating hardware or becoming visually noisy.

### C. Liquid / Material — “Living Liturgy”

- **Idea:** soft shadowed layers, subtle diffuse light and measured fluid depth that responds to the service rhythm.
- **Typography:** Manrope / JetBrains Mono.
- **Material:** dark mineral surfaces, a restrained warm light near active service, tactile segmented controls.
- **Live room:** service state appears as a material band; AI recommendations settle into the context bay.
- **Strength:** most emotionally distinctive; could carry the marketing experience well.
- **Risk:** lower control-room immediacy and easy to drift into decorative glass/gradient territory. Not recommended for the application shell.

### D. Stage Ledger — “Cue Sheet”

- **Idea:** a cue sheet and stage manager’s book reinterpreted in software: vertical time rail, high-contrast paper-like content surfaces against black equipment rails.
- **Typography:** Public Sans / IBM Plex Mono.
- **Material:** black exterior, warm-grey operational sheet, ink-blue annotation and red take marks.
- **Live room:** schedule/timeline dominates; actions are marked as cues, outputs as columns.
- **Strength:** highly original, human and service-oriented; excellent for planning/archive workflows.
- **Risk:** can underplay the live-output/technical system and needs careful dark-booth contrast.

## Prototype comparison mechanism

The prototype page should be an **isolated, non-production route** that renders the same static Live Service scenario in all four directions. A persistent direction switcher (A–D) and a split-screen comparison view let the team compare: shell, service state, AI state, primary action, timeline and a representative “display scripture” action.

Rules for the lab:

- It consumes no Supabase mutations and does not alter auth, service actions or product routes.
- The scenario is clearly labelled as a visual evaluation fixture.
- It uses a shared semantic data object so the difference is visual/systemic, not feature scope.
- It has desktop and narrow-width previews so density/responsiveness can be compared honestly.

## Recommendation

**Choose B — Signal Room.** It is the only direction that simultaneously:

1. reinforces the DSPS’s dark-first premium broadcast mandate;
2. makes human operator authority visible through explicit status, careful hierarchy and one decisive action at a time;
3. provides a coherent language for later studio, output, streaming and AI Brain surfaces; and
4. avoids being mistaken for a generic collaboration dashboard or a trendy AI product.

Implement after approval in this sequence:

1. token layer, typography and motion primitives;
2. shell/navigation/top status/context bay;
3. common controls, panels, status and timeline;
4. Live Service control room;
5. remaining product modules and marketing surface.

No product functionality or database architecture changes belong to this sequence.

## Landing-page direction

The marketing surface should frame AI Church OS as **the operating environment for the moments behind a live service**. Its visual DNA should share Signal Room’s type, graphite field, signal blue and timecode/routing motifs — but become more spacious than the app. Show a short sequence: _plan → prepare → run → archive_, led by a real-looking control-room composition, not an abstract AI orb, feature-card grid or gradient hero. Pewbeam’s focus on flow is useful; its overt “AI magic” visual language is not the target.

## Evidence and source notes

- The DSPS is the binding product design baseline: dark-first, three-column, electric-blue, premium broadcast UX, visible critical controls, keyboard control and subtle functional motion.
- Research observations are reference material only; none of the referenced product code or visuals should be copied directly.
- Font licensing must be rechecked when font files are added to the repository. Figtree and IBM Plex Mono are published under the SIL Open Font License at the time of this proposal.
