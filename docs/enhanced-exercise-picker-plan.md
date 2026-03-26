# Enhanced Exercise Picker with Plan Priority

## Problem

When starting a session from a plan, users want to see plan exercises first in the dropdown, but still have the flexibility to add other exercises if needed. Currently, the dropdown only shows plan exercises, which limits flexibility.

## Proposed Solution

Show plan exercises at the top of the dropdown in a dedicated "From Plan" section, followed by all other exercises organized by category. This provides guidance while maintaining flexibility.

## UI Design

```
┌─────────────────────────────────────────────┐
│ [Search exercises...]                       │
├─────────────────────────────────────────────┤
│ FROM PLAN                                   │
│   ✓ Bench Press                    [ chest ]│
│   ✓ Incline Dumbbell Press         [ chest ]│
│   ○ Tricep Pushdown               [triceps] │
├─────────────────────────────────────────────┤
│ ALL EXERCISES                               │
│   Back                                      │
│     Lat Pulldown                            │
│     Barbell Row                             │
│   Biceps                                    │
│     Bicep Curl                              │
│   ...                                       │
└─────────────────────────────────────────────┘
```

Checkmarks (✓) indicate exercises already logged in the current session.

## Implementation

### 1. Update `ExercisePicker` Component

**File:** `frontend/src/workout/components/ExercisePicker.tsx`

- Rename `allowedExerciseIds` to `planExerciseIds` (no longer restricting, just prioritizing)
- Add `sessionExerciseIds?: string[]` prop to show completion status
- Modify grouping logic:
  - Extract plan exercises into separate "From Plan" group
  - Keep remaining exercises grouped by category
- Add visual indicator (checkmark) for exercises already logged
- Add separator between "From Plan" and "All Exercises" sections

### 2. Update `SetLoggingForm` Component

**File:** `frontend/src/workout/components/SetLoggingForm.tsx`

- Rename `allowedExerciseIds` to `planExerciseIds`
- Add `sessionExerciseIds?: string[]` prop
- Pass both props to `ExercisePicker`

### 3. Update `SessionPage` Component

**File:** `frontend/src/workout/pages/SessionPage.tsx`

- Pass `planExerciseIds={activeSession.plan?.exerciseIds}`
- Pass `sessionExerciseIds={sessionSets.map(s => s.exerciseId)}`
- Remove the filter logic that restricts to only plan exercises

## Technical Details

### Type Updates

```typescript
interface ExercisePickerProps {
  value: Exercise | null;
  onChange: (exercise: Exercise) => void;
  placeholder?: string;
  planExerciseIds?: string[];
  sessionExerciseIds?: string[];
}
```

### Grouping Logic

```typescript
const planExercises = planExerciseIds
  ? baseExercises.filter((e) => planExerciseIds.includes(e.id))
  : [];

const otherExercises = planExerciseIds
  ? baseExercises.filter((e) => !planExerciseIds.includes(e.id))
  : baseExercises;

const otherGroupedByCategory = otherExercises.reduce(...);
```

## Benefits

1. **Guidance** - Plan exercises are immediately visible at the top
2. **Flexibility** - Users can still access all exercises if needed
3. **Progress tracking** - Visual checkmarks show which plan exercises are done
4. **No behavior change for non-plan sessions** - Dropdown works as before when no plan is active