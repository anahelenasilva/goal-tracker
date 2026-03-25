# Backend Implementation Plan - Workout Tracker

Parent docs:
- `docs/plans/workout_tracker/prd.md`
- `docs/plans/workout_tracker/implementation-plan.md`
- `docs/plans/workout_tracker/prd-issue-bodies.md`

## Objective

Deliver backend support for workout tracking with stable API contracts that allow frontend providers to switch from mocks to API incrementally, without page-level rewrites.

## Guiding Decisions

- Keep existing goals endpoints unchanged.
- Add a dedicated `workouts` module with explicit boundaries.
- Enforce stable contract shapes aligned with frontend workout types.
- Implement in thin vertical slices mapped to existing issue bodies.
- Preserve Functional Core, Imperative Shell: pure domain rules in service helpers, IO in controller/repository layer.

## Contract Baseline

These shapes must remain stable across slices:

- `Exercise`: `id`, `name`, `category`, `isCustom`, `createdAt`, `updatedAt`
- `WorkoutSession`: `id`, `status`, `startedAt`, `endedAt?`, `createdAt`, `updatedAt`
- `WorkoutSet`: `id`, `sessionId`, `exerciseId`, `exercise?`, `reps`, `weight`, `weightUnit`, `notes?`, `createdAt`
- `TrainingPlan`: `id`, `name`, `description?`, `assignedDays?`, `exerciseIds`, `exercises?`, `createdAt`, `updatedAt`

## Work Breakdown (Mapped to Issue Bodies)

### 1) Issue 1 - Workout Module Spine + Replaceable Data Boundary

Status: planned first

Tasks:
- [ ] Create `workouts` Nest module (`controller`, `service`, `module`).
- [ ] Add TypeORM entities:
  - [ ] `exercise.entity.ts`
  - [ ] `workout-session.entity.ts`
  - [ ] `workout-set.entity.ts`
  - [ ] `training-plan.entity.ts`
  - [ ] `training-plan-exercise.entity.ts` (ordered relation)
- [ ] Register entities in `TypeOrmModule.forRoot` and `workouts.module`.
- [ ] Add migration for all workout tables, indexes, and foreign keys.
- [ ] Add read-only endpoints with stable response shapes:
  - [ ] `GET /workouts/exercises`
  - [ ] `GET /workouts/exercises/:id`
  - [ ] `GET /workouts/sessions`
  - [ ] `GET /workouts/sessions/active`
  - [ ] `GET /workouts/sessions/:id`
  - [ ] `GET /workouts/plans`
  - [ ] `GET /workouts/plans/:id`
- [ ] Add basic built-in exercise seed records.

Acceptance checks:
- [ ] No direct coupling of controller/page concerns to persistence internals.
- [ ] Empty datasets still return valid contract shapes.
- [ ] Existing `/goals` flows still pass.

---

### 2) Issue 2 - Session Lifecycle MVP (Start -> End -> History Outcome)

Status: planned second

Tasks:
- [ ] Add lifecycle write endpoints:
  - [ ] `POST /workouts/sessions` (start)
  - [ ] `POST /workouts/sessions/:id/end` (complete)
  - [ ] `POST /workouts/sessions/:id/abandon` (abandon)
- [ ] Enforce domain rules:
  - [ ] Only one active session at a time.
  - [ ] Only active session can be ended/abandoned.
  - [ ] End/abandon writes `endedAt`.
- [ ] Add predictable errors:
  - [ ] `404` unknown session
  - [ ] `409` invalid state transitions / duplicate active session
- [ ] Add session listing behavior needed by history consumers:
  - [ ] Completed sessions ordered by `startedAt DESC`

Acceptance checks:
- [ ] Session lifecycle is deterministic and idempotency-safe for invalid repeats.
- [ ] Frontend can swap mock session provider for API in start/end flow.

---

### 3) Issue 3 - In-Session Set Logging + Validation Recovery

Status: planned third

Tasks:
- [ ] Add set endpoints:
  - [ ] `GET /workouts/sessions/:sessionId/sets`
  - [ ] `POST /workouts/sessions/:sessionId/sets`
  - [ ] `PATCH /workouts/sets/:id`
  - [ ] `DELETE /workouts/sets/:id`
- [ ] Validate reps/weight/unit and exercise/session existence.
- [ ] Restrict set creation to active sessions.
- [ ] Return set responses with optional embedded `exercise`.

Acceptance checks:
- [ ] Invalid payloads fail with explicit 4xx responses.
- [ ] Completed/abandoned sessions reject new sets.

---

### 4) Issue 4 - Exercise Library CRUD + Search

Status: planned fourth

Tasks:
- [ ] Add endpoints:
  - [ ] `POST /workouts/exercises`
  - [ ] `PATCH /workouts/exercises/:id`
  - [ ] `DELETE /workouts/exercises/:id`
  - [ ] `GET /workouts/exercises?query=...`
- [ ] Ensure case-insensitive name search.
- [ ] Keep built-in vs custom support via `isCustom`.

Acceptance checks:
- [ ] CRUD semantics align with frontend provider behavior.
- [ ] Search is deterministic across mixed built-in/custom entries.

---

### 5) Issue 5 - Training Plans End-to-End

Status: planned fifth

Tasks:
- [ ] Add plan endpoints:
  - [ ] `POST /workouts/plans`
  - [ ] `PATCH /workouts/plans/:id`
  - [ ] `DELETE /workouts/plans/:id`
  - [ ] `POST /workouts/plans/:id/exercises`
  - [ ] `DELETE /workouts/plans/:id/exercises/:exerciseId`
  - [ ] `PUT /workouts/plans/:id/exercises/reorder`
- [ ] Persist ordered exercise relation via `training_plan_exercises`.
- [ ] Expose `exerciseIds` and optional `exercises` in plan read models.

Acceptance checks:
- [ ] Exercise ordering remains stable after add/remove/reorder.
- [ ] Reorder rejects incomplete or invalid exercise lists.

---

### 6) Issue 6 - History + Graph Insights

Status: planned sixth

Tasks:
- [ ] Add history endpoints:
  - [ ] `GET /workouts/history/:exerciseId`
  - [ ] `GET /workouts/history/recent-sessions?limit=...`
- [ ] Add graph endpoint:
  - [ ] `GET /workouts/graphs/:exerciseId?period=...&limit=...`
- [ ] Compute progress points: `date`, `weight`, `reps`, `volume`.

Acceptance checks:
- [ ] History only includes completed sessions.
- [ ] Graph computations are consistent with stored sets.

---

### 7) Issue 7 - Rest Timer Integrated with Workout Navigation

Status: no backend work required now

Notes:
- Timer behavior is frontend-local in current scope.
- Backend unchanged unless timer persistence is later requested.

---

### 8) Issue 8 - Release Hardening

Status: final hardening gate

Tasks:
- [ ] Unit tests for domain invariants (sessions, sets, plans).
- [ ] Controller tests for main HTTP contracts and status codes.
- [ ] E2E smoke for start -> sets -> end -> history path.
- [ ] Migration up/down verification in local DB.
- [ ] Regression verification for existing goals endpoints.
- [ ] Lint/typecheck clean for backend changes.

Acceptance checks:
- [ ] MVP-critical backend endpoints are stable and documented.
- [ ] No blocking regressions in current backend behavior.

## Implementation Order

1. Issue 1 (module, entities, migration, reads)
2. Issue 2 (session lifecycle writes)
3. Issue 3 (set logging)
4. Issue 4 (exercise CRUD/search)
5. Issue 5 (plans + ordering)
6. Issue 6 (history/graphs)
7. Issue 8 (hardening)

## API Error Semantics

- `404 Not Found`: unknown entity IDs
- `409 Conflict`: invalid state transitions and uniqueness-style conflicts
- `400 Bad Request`: DTO validation failures

## Definition of Done (Backend Slice)

- Frontend can replace corresponding mock provider calls with API calls for implemented slices.
- Contract shape compatibility preserved for all implemented endpoints.
- Migration applied cleanly and reproducibly.
- Tests pass and lint/typecheck remain clean.
