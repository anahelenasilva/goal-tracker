# Training Plans to Workout Sessions Integration

## Problem

Training Plans currently exist as standalone templates with no connection to workout sessions. Users can create and manage plans, but when starting a workout, they get a blank session with no guidance from their predefined plans.

## Current State

### Training Plans
- Name, description, assigned days (e.g., Monday, Wednesday, Friday)
- List of exercise IDs
- Full CRUD operations available
- UI at `/workout/plans`

### Workout Sessions
- Created via "Start Workout" button
- Blank slate - no exercises pre-loaded
- Users manually select exercises while logging sets
- UI at `/workout/sessions`

### The Gap
Plans are not used during workout sessions. They're purely reference material.

## Proposed Solution

### Phase 1: Plan Selection on Session Start

When no active session exists, allow users to optionally select a plan before starting:

1. Add "Start from Plan" option on the session page
2. Show list of available plans with their assigned days
3. Optionally highlight plans matching the current day of week
4. Create session with plan context attached

**Backend Changes:**
- Add `planId` (nullable foreign key) to `WorkoutSession` entity
- Add migration for the new column
- Update session creation endpoint to accept optional `planId`

**Frontend Changes:**
- Update `SessionPage.tsx` to show plan selection UI
- Add `startFromPlan(planId)` method to session provider
- Display selected plan name during active workout

### Phase 2: Plan-Guided Workout Experience

During a workout with a selected plan:

1. Show planned exercises as a checklist/guide
2. Allow logging sets against any exercise (planned or not)
3. Track progress through planned exercises
4. Show completion status for each planned exercise

**Backend Changes:**
- Add endpoint to fetch plan details with full exercise data
- Consider storing which planned exercises were "completed" during session

**Frontend Changes:**
- Add "Planned Exercises" panel to active session view
- Show exercise name, target sets/reps (if defined), completion status
- Allow quick-add of sets for planned exercises
- Visual indication of progress through the plan

### Phase 3: Smart Defaults and History

Enhance the experience with contextual features:

1. Suggest plan based on day of week (`assignedDays` field)
2. Show previous session performance for same plan
3. Carry over weights/reps from last session as starting point
4. Post-workout summary comparing to plan targets

## Technical Considerations

### Database Schema

```sql
-- Add plan reference to sessions
ALTER TABLE workout_sessions ADD COLUMN plan_id UUID REFERENCES training_plans(id);

-- Optional: Track planned vs actual sets
CREATE TABLE plan_exercise_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id),
  plan_exercise_id UUID REFERENCES training_plan_exercises(id),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

```
POST /workouts/sessions                    # body: { planId?: string }
GET  /training-plans/:id/full              # returns plan with populated exercises
```

### Type Updates

```typescript
interface WorkoutSession {
  id: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  endedAt?: string;
  planId?: string;           // NEW
  plan?: TrainingPlan;       // NEW - when populated
  sets?: WorkoutSet[];
  createdAt: string;
  updatedAt: string;
}
```

## Implementation Order

1. **Backend**: Add `planId` to session entity + migration
2. **Backend**: Update session creation to accept `planId`
3. **Frontend**: Add plan selection UI to session start page
4. **Frontend**: Display selected plan during active workout
5. **Frontend**: Add planned exercises panel
6. **Frontend**: Quick-add sets for planned exercises
7. **Enhancement**: Day-of-week suggestions
8. **Enhancement**: Previous session comparison

## Out of Scope

- Target sets/reps per exercise in plans (would require schema changes to `TrainingPlanExercise`)
- Workout templates with progressive overload
- Plan sharing between users