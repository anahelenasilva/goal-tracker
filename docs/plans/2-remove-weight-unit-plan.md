# Plan: Remove `weightUnit` from WorkoutSet

## Context
All workout sets are logged in kg — the `weightUnit` column and UI selector add unnecessary complexity. This plan removes the field end-to-end and hardcodes "kg" in display strings.

## Migration (new)
**New file:** `backend/src/migrations/1750200000000-DropWeightUnitColumn.ts`
- `ALTER TABLE "workout_sets" DROP COLUMN "weight_unit";`
- `down()` re-adds the column as `VARCHAR NOT NULL DEFAULT 'kg'`

## Backend changes

### Entity — `backend/src/entities/workout-set.entity.ts`
- Remove `WeightUnit` type export
- Remove `weightUnit` column + `@Column` decorator

### DTOs
- `backend/src/modules/workouts/dto/create-workout-set.dto.ts` — remove `weightUnit` field, `WeightUnit` import, `WEIGHT_UNITS` const
- `backend/src/modules/workouts/dto/update-workout-set.dto.ts` — same

### Tests
- `backend/src/modules/workouts/workouts.controller.spec.ts` — remove `weightUnit` from all fixture objects
- `backend/src/modules/workouts/workouts.service.spec.ts` — same
- `backend/test/workouts.e2e-spec.ts` — remove `weightUnit` from request payloads

## Frontend changes

### Types — `frontend/src/workout/types.ts`
- Remove `WeightUnit` type
- Remove `weightUnit` from `WorkoutSet` interface

### API mapper — `frontend/src/workout/api-providers.ts`
- Remove `weightUnit` mapping from `mapWorkoutSet`

### Components
- **`SetLoggingForm.tsx`** — remove `unit` state, unit `<select>`, remove `weightUnit` from `onSubmit` payload/props, remove from `handleQuickFill`
- **`PlannedExercisesPanel.tsx`** — same changes in `QuickAddForm`
- **`SetList.tsx`** — change display from `` `${set.weight}${set.weightUnit}` `` to `` `${set.weight}kg` ``

### Pages
- **`SessionPage.tsx`** — remove `WeightUnit` import, remove `weightUnit` from form data type and submit handler
- **`HistoryPage.tsx`** — remove `weightUnit` from inline types (~3 places), update display strings to hardcode `kg`

## Verification
1. `pnpm --filter backend run migration:run` — confirm column dropped
2. `pnpm --filter backend run test` — all unit/controller tests pass
3. `pnpm --filter backend run test:e2e` — e2e tests pass
4. `pnpm --filter frontend run build` — no TS errors
5. Manual: log a set, confirm no unit picker in UI, display shows "kg"
