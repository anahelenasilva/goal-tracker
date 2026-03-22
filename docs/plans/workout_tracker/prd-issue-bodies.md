# Workout Tracker PRD - Draft Issue Bodies

Parent PRD: `docs/plans/workout_tracker/prd.md`

Replace placeholder values before creating issues:
- `#<issue-1-number>`, `#<issue-2-number>`, etc.

## Issue 1 - Workout Module Spine + Replaceable Data Boundary (HITL)

## Parent PRD

https://linear.app/anas-org/document/product-requirements-document-workout-tracker-b3624179360f

## What to build

Create the first end-to-end workout slice by introducing the workout SPA namespace and shell-integrated navigation surfaces while routing all workout reads and writes through replaceable provider boundaries. This issue establishes stable contracts for session, set, exercise, plan, and insight read models so mocked data can be swapped to backend providers later without page-level rewrites. Reference PRD sections: Functional Requirements FR38, FR39, FR41, FR42, FR43, FR44 and Journey 3.

## Acceptance criteria

- [ ] Workout namespace routes are available from the current product shell and can be navigated consistently.
- [ ] All workout pages consume data through a single replaceable boundary instead of direct page-level mock coupling.
- [ ] Stable contracts exist for session, set, exercise, plan, and chart/history models and are used across pages.
- [ ] Existing goal-tracker flows continue to work without blocking regressions.

## Blocked by

None - can start immediately

## User stories addressed

- FR38
- FR39
- FR41
- FR42
- FR43
- FR44
- Journey 3

---

## Issue 2 - Session Lifecycle MVP (Start -> End -> History Outcome) (AFK)

## Parent PRD

https://linear.app/anas-org/document/product-requirements-document-workout-tracker-b3624179360f

## What to build

Deliver the core workout loop where users start a session, see an active session state, end the session, and then see a completed workout outcome in history with clear start and end timestamps. This issue must keep the workout outcome represented in the same product context as goals to validate unified flow value. Reference PRD sections: FR1, FR2, FR4, FR5, FR6, FR35, FR36, FR37 and Journey 1.

## Acceptance criteria

- [ ] Users can start and end a workout session with clear state transitions.
- [ ] Completed sessions show start and end timestamps in history.
- [ ] Post-session result appears in the same product context as goal tracking.
- [ ] Session lifecycle behavior remains stable across routine SPA navigation changes.

## Blocked by

- Blocked by #<issue-1-number>

## User stories addressed

- FR1
- FR2
- FR4
- FR5
- FR6
- FR35
- FR36
- FR37
- Journey 1

---

## Issue 3 - In-Session Set Logging + Validation Recovery (AFK)

## Parent PRD

https://linear.app/anas-org/document/product-requirements-document-workout-tracker-b3624179360f

## What to build

Extend the active session flow with set logging so users can select an exercise and log reps, weight, unit, and optional notes while in session. Include recoverable validation behavior for incomplete and invalid inputs so interruptions do not break completion. Reference PRD sections: FR3, FR7, FR8, FR9, FR10, FR11, FR12, FR40 and Journey 2.

## Acceptance criteria

- [ ] Users can add sets to an active session with exercise, reps, weight, unit, and optional notes.
- [ ] Invalid or incomplete set input surfaces explicit corrective feedback.
- [ ] Users can recover and continue logging without losing the session flow.
- [ ] Logging interactions remain mobile-friendly for in-gym usage.

## Blocked by

- Blocked by #<issue-2-number>

## User stories addressed

- FR3
- FR7
- FR8
- FR9
- FR10
- FR11
- FR12
- FR40
- Journey 2

---

## Issue 4 - Exercise Library CRUD + Search in Logging Flow (AFK)

## Parent PRD

https://linear.app/anas-org/document/product-requirements-document-workout-tracker-b3624179360f

## What to build

Ship the exercise management slice to browse built-in and custom exercises, create/edit/delete custom entries, and search exercises in contexts that support logging and planning workflows. This issue ensures exercise retrieval and maintenance are reliable inputs for session and plan flows. Reference PRD sections: FR13, FR14, FR15, FR16, FR17, FR40.

## Acceptance criteria

- [ ] Users can create, edit, and delete custom exercises with clear outcomes.
- [ ] Built-in and custom exercise entries are distinguishable in browsing workflows.
- [ ] Exercise search works in both selection and management contexts.
- [ ] Empty, loading, and recoverable error states are visible and non-blocking.

## Blocked by

- Blocked by #<issue-1-number>

## User stories addressed

- FR13
- FR14
- FR15
- FR16
- FR17
- FR40

---

## Issue 5 - Training Plans End-to-End (List/Detail/Edit/Reorder/Delete) (AFK)

## Parent PRD

https://linear.app/anas-org/document/product-requirements-document-workout-tracker-b3624179360f

## What to build

Deliver complete training plan management including plan creation, listing, detail inspection, exercise add/remove/reorder, metadata updates, and deletion. The slice should remain coherent with overall workout navigation and support operational planning before execution. Reference PRD sections: FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR39.

## Acceptance criteria

- [ ] Users can create and list plans with assigned-day metadata.
- [ ] Plan detail supports exercise add/remove/reorder with immediate visible outcomes.
- [ ] Plan metadata updates and plan deletion flows are supported with clear confirmations.
- [ ] Navigation between plan surfaces and other workout pages remains predictable.

## Blocked by

- Blocked by #<issue-1-number>
- Blocked by #<issue-4-number>

## User stories addressed

- FR18
- FR19
- FR20
- FR21
- FR22
- FR23
- FR24
- FR25
- FR39

---

## Issue 6 - History + Graph Insights Vertical Slice (HITL)

## Parent PRD

https://linear.app/anas-org/document/product-requirements-document-workout-tracker-b3624179360f

## What to build

Implement an end-to-end insight flow where users browse and filter exercise history, open per-exercise graph views, switch metrics/units, and apply period/date/record constraints. Ensure graphs and history remain consistent with session outcomes produced by lifecycle and logging slices. Reference PRD sections: FR26, FR27, FR28, FR29, FR30, FR31, FR39.

## Acceptance criteria

- [ ] History view supports exercise-centric browsing and filtering.
- [ ] Graph view supports per-exercise progression across selectable periods.
- [ ] Users can switch metric and unit interpretation and apply data constraints.
- [ ] Displayed insights align with logged session outcomes.

## Blocked by

- Blocked by #<issue-2-number>
- Blocked by #<issue-3-number>

## User stories addressed

- FR26
- FR27
- FR28
- FR29
- FR30
- FR31
- FR39

---

## Issue 7 - Rest Timer Integrated with Workout Navigation (HITL)

## Parent PRD

https://linear.app/anas-org/document/product-requirements-document-workout-tracker-b3624179360f

## What to build

Add a dedicated rest timer utility with start, pause, reset, and duration adjustment while keeping it integrated into workout navigation and overall session continuity. The timer must support gym-time transitions between timer and logging flows without workflow fragmentation. Reference PRD sections: FR32, FR33, FR34, FR12, FR39.

## Acceptance criteria

- [ ] Timer supports start, pause, reset, and duration adjustments.
- [ ] Timer is reachable through the same workout navigation model as other pages.
- [ ] Users can move between timer and logging contexts without losing workflow continuity.
- [ ] Mobile interaction quality remains acceptable in timer-critical interactions.

## Blocked by

- Blocked by #<issue-1-number>

## User stories addressed

- FR32
- FR33
- FR34
- FR12
- FR39

---

## Issue 8 - Release Hardening (Parity, A11y baseline, Troubleshooting Readiness) (HITL)

## Parent PRD

https://linear.app/anas-org/document/product-requirements-document-workout-tracker-b3624179360f

## What to build

Harden the integrated module for release readiness by validating reproducible critical journeys, cross-browser parity, accessibility baseline blockers, and provider-replacement confidence. This issue serves as the operational quality gate before MVP release. Reference PRD sections: FR45, FR46, FR47, FR48, Journey 3, Journey 4, and MVP NFR baselines.

## Acceptance criteria

- [ ] Core workflows (session lifecycle and logging, plans, history/graphs, timer) are reproducible end-to-end with mocked data.
- [ ] MVP-critical workflows are behaviorally consistent on latest Arc (Chromium), Chrome, Safari, and Firefox.
- [ ] Accessibility blockers in primary workout journeys are resolved.
- [ ] Data-provider replacement readiness is validated without page-level contract rewrites.
- [ ] No blocking lint or type errors are introduced by workout integration scope.

## Blocked by

- Blocked by #<issue-2-number>
- Blocked by #<issue-3-number>
- Blocked by #<issue-4-number>
- Blocked by #<issue-5-number>
- Blocked by #<issue-6-number>
- Blocked by #<issue-7-number>

## User stories addressed

- FR45
- FR46
- FR47
- FR48
- Journey 3
- Journey 4
- MVP NFR baselines
