# Plan: Workout Tracker Integration

> Source PRD: `docs/plans/workout_tracker/prd.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes**: Keep existing root dashboard route for current goal tracker and add SPA workout namespace routes under `/workout` (`/workout/history`, `/workout/plans`, `/workout/plans/:planId`, `/workout/graphs`, `/workout/graphs/:exerciseId`, `/workout/timer`, `/workout/exercises`).
- **Schema (Phase 1 mocked, API-ready shape)**: Introduce stable workout domain contracts for `WorkoutSession`, `WorkoutSet`, `Exercise`, and `TrainingPlan` with deterministic identifiers and timestamp fields (`startedAt`, `endedAt`, `createdAt`, `updatedAt`) and explicit unit fields.
- **Goal linkage model**: A completed `WorkoutSession` is translated into a workout entry outcome that is visible in workout history and represented in the same product context as goal tracking, while preserving stable contracts for later backend mapping.
- **Data-access boundary**: Route all workout reads/writes through replaceable provider boundaries (repository/service adapters) so mocked providers can be swapped to API-backed providers without page-level rewrites.
- **Frontend architecture**: Keep business rules in pure domain helpers (validation, transform, timeline derivation, aggregation) and keep IO/state orchestration in route/page containers.
- **API boundary strategy**: Preserve existing goal endpoints as-is; add workout endpoints only in future backend phase without requiring route contract rewrites in frontend workout pages.
- **Compatibility baseline**: MVP-critical flows must remain responsive and behaviorally consistent on latest Arc (Chromium), Chrome, Safari, and Firefox.

---

## Phase 1: Workout Module Spine + Data Contracts

**User stories**: Journey 3 (ops readiness), FR38, FR39, FR41, FR42, FR43, FR44

### What to build

Create the first end-to-end workout slice by introducing workout navigation surfaces, route scaffolding, and shared workout data contracts behind mocked provider boundaries. This slice establishes the integration seam and confirms that every workout screen can resolve data through replaceable adapters rather than direct page-level mock coupling.

### Acceptance criteria

- [ ] Workout SPA route namespace is available and navigable from the current product shell.
- [ ] All workout page surfaces resolve through a single replaceable data-access boundary.
- [ ] Mocked providers satisfy stable contracts for session, set, exercise, plan, and chart-related read models.
- [ ] Existing goal tracker flows remain functional with no regressions.

---

## Phase 2: Session Lifecycle End-to-End (Start -> End -> History Entry)

**User stories**: Journey 1, FR1, FR2, FR3, FR4, FR5, FR6, FR35, FR36, FR37

### What to build

Deliver a fully demoable core loop: start workout session, keep visible active state, end session, and render a completed workout outcome in history with start/end timestamps and goal-context continuity. This phase proves the central value hypothesis: reduced workout logging friction in one integrated flow.

### Acceptance criteria

- [ ] User can start and end a session through a clear workflow with visible active/inactive state transitions.
- [ ] Completed sessions display start and end timestamps in workout history.
- [ ] Post-session outcome is visible in the same product context as goals.
- [ ] Session lifecycle remains recoverable after normal navigation changes in SPA flow.

---

## Phase 3: In-Session Set Logging + Recovery UX

**User stories**: Journey 2, FR7, FR8, FR9, FR10, FR11, FR12, FR40

### What to build

Extend the core loop with fast in-session set logging (exercise selection, reps, weight, unit, optional notes) and robust recovery behavior for invalid/incomplete inputs. The slice should prioritize low-friction gym usage and clear feedback states so interruptions do not break completion.

### Acceptance criteria

- [ ] User can add sets to an active session with exercise, reps, weight, unit, and optional note.
- [ ] Invalid or incomplete input produces explicit corrective feedback without breaking the session flow.
- [ ] User can recover from interruptions and continue to complete the session.
- [ ] Interaction patterns remain mobile-friendly for in-gym use.

---

## Phase 4: Exercise Library Management + Selection/Search

**User stories**: FR13, FR14, FR15, FR16, FR17, FR40

### What to build

Ship an end-to-end exercise library slice where users can browse built-in/custom exercises, create/edit/delete custom entries, and use search in logging/planning contexts. This phase ensures exercise data quality and retrieval ergonomics support both session logging and plan composition.

### Acceptance criteria

- [ ] Exercise management supports create, edit, and delete operations for custom exercises.
- [ ] Exercise browsing distinguishes built-in and custom entries.
- [ ] Exercise search works in both selection and management workflows.
- [ ] Empty/loading/error states are clear and non-blocking for exercise workflows.

---

## Phase 5: Training Plans Vertical Slice

**User stories**: FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR39

### What to build

Deliver complete plan management from list to detail: create plans, inspect composition, add/remove/reorder exercises, edit metadata, and delete plans. This slice makes planning operational before gym execution and keeps continuity with session logging flows.

### Acceptance criteria

- [ ] Users can create and list plans with assigned-day metadata.
- [ ] Plan detail supports add/remove/reorder exercises with immediate visible outcomes.
- [ ] Plan metadata can be updated and plans can be deleted with clear confirmation.
- [ ] Navigation between plans and other workout surfaces remains coherent and predictable.

---

## Phase 6: History + Graph Insights Slice

**User stories**: FR26, FR27, FR28, FR29, FR30, FR31, FR39

### What to build

Implement history browsing and graph exploration as one vertical analytics slice: users search/filter exercise history, open graph views, switch metrics/units, and constrain by period/date/record limits. This provides immediate progression visibility while preserving API-ready data contracts.

### Acceptance criteria

- [ ] History view supports exercise-centric browsing and search/filter interactions.
- [ ] Graph view supports per-exercise progression across selectable periods.
- [ ] Users can change metric/unit interpretation and data constraints.
- [ ] Insights views maintain consistency with logged session outcomes.

---

## Phase 7: Rest Timer + Mobile Flow Continuity

**User stories**: FR32, FR33, FR34, FR12, FR39

### What to build

Add the rest timer as a dedicated but integrated workout utility with start/pause/reset and duration adjustment. The slice validates that users can move fluidly between timer, session logging, and other workout pages without workflow fragmentation.

### Acceptance criteria

- [ ] Timer supports start, pause, reset, and duration adjustment behaviors.
- [ ] Timer is accessible through the same workout navigation model as other pages.
- [ ] User can preserve workout workflow continuity when moving between timer and logging contexts.
- [ ] Mobile interaction quality remains acceptable in timer-critical states.

---

## Phase 8: Operational Readiness and Hardening

**User stories**: Journey 3, Journey 4, FR45, FR46, FR47, FR48 and MVP NFR baselines

### What to build

Harden the integrated workout module for release-readiness with reproducible troubleshooting paths, critical journey validation, cross-browser verification, accessibility baseline checks, and API-replacement confidence checks for the mocked provider boundaries.

### Acceptance criteria

- [ ] Core journeys (start/log/end, plans, history/graphs, timer) are reproducible end-to-end with mocked data.
- [ ] Cross-browser parity is validated on latest Arc (Chromium), Chrome, Safari, and Firefox for MVP-critical workflows.
- [ ] Accessibility blockers in primary workout flows are resolved.
- [ ] Data-provider replacement readiness is validated without page-level contract rewrites.
- [ ] No blocking lint/type issues are introduced by workout integration scope.

