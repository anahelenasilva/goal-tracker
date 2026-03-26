# Plan: Add `name_pt` Column to Exercises

## Context
Add Portuguese translation support for exercise names via a new `name_pt` column. Built-in exercises will have Portuguese translations seeded. The `name_pt` field is required for all exercises. The frontend will always display the Portuguese name.

## Files to Modify

### Backend
1. **`backend/src/entities/exercise.entity.ts`** - Add `name_pt` column
2. **`backend/src/migrations/1742856000000-WorkoutSchema.ts`** - Add column to schema and update seed data with Portuguese names
3. **`backend/src/modules/workouts/dto/create-exercise.dto.ts`** - Add required `name_pt` field
4. **`backend/src/modules/workouts/dto/update-exercise.dto.ts`** - Add optional `name_pt` field

### Frontend
5. **`frontend/src/workout/types.ts`** - Add `name_pt: string` to Exercise interface
6. **`frontend/src/workout/utils.ts`** (new) - Add `getExerciseDisplayName(exercise: Exercise): string` helper that returns `name_pt`
7. **`frontend/src/workout/components/ExerciseFormModal.tsx`** - Add required Portuguese name input field
8. **Update exercise name display** in these files to use `getExerciseDisplayName(exercise)`:
   - `frontend/src/workout/pages/PlansPage.tsx` (line 165)
   - `frontend/src/workout/pages/HistoryPage.tsx` (lines 171, 200, 458)
   - `frontend/src/workout/pages/PlanDetailPage.tsx` (lines 287, 428)
   - `frontend/src/workout/pages/ExercisesPage.tsx` (line 247)
   - `frontend/src/workout/pages/GraphsPage.tsx` (line 254)
   - `frontend/src/workout/components/ExercisePicker.tsx` (line 166)

## Implementation Steps

### 1. Update Exercise Entity
Add required `name_pt` column:
```typescript
@Column({ name: 'name_pt' })
namePt: string;
```

### 2. Update Migration
- Add `name_pt` column to exercises table schema (NOT NULL)
- Update seed data INSERT statement with Portuguese translations:

```sql
INSERT INTO "exercises" ("name", "name_pt", "category", "is_custom")
VALUES
  ('Bench Press', 'Supino Reto', 'chest', false),
  ('Incline Dumbbell Press', 'Supino Inclinado com Halteres', 'chest', false),
  ('Cable Flyes', 'Crucifixo no Cabo', 'chest', false),
  ('Push-ups', 'Flexão de Braços', 'chest', false),
  ('Deadlift', 'Levantamento Terra', 'back', false),
  ('Barbell Row', 'Remada com Barra', 'back', false),
  ('Lat Pulldown', 'Puxada na Polia Alta', 'back', false),
  ('Seated Cable Row', 'Remada Sentada no Cabo', 'back', false),
  ('Pull-ups', 'Barra Fixa', 'back', false),
  ('Overhead Press', 'Desenvolvimento', 'shoulders', false),
  ('Lateral Raises', 'Elevação Lateral', 'shoulders', false),
  ('Face Pulls', 'Puxada para o Rosto', 'shoulders', false),
  ('Rear Delt Flyes', 'Crucifixo Inverso', 'shoulders', false),
  ('Barbell Curl', 'Rosca Direta com Barra', 'biceps', false),
  ('Dumbbell Curl', 'Rosca Direta com Halteres', 'biceps', false),
  ('Hammer Curl', 'Rosca Martelo', 'biceps', false),
  ('Preacher Curl', 'Rosca Scott', 'biceps', false),
  ('Tricep Pushdown', 'Tríceps na Polia', 'triceps', false),
  ('Skull Crushers', 'Tríceps Testa', 'triceps', false),
  ('Dips', 'Mergulho', 'triceps', false),
  ('Overhead Tricep Extension', 'Tríceps Francês', 'triceps', false),
  ('Squat', 'Agachamento', 'legs', false),
  ('Leg Press', 'Leg Press', 'legs', false),
  ('Lunges', 'Avanço', 'legs', false),
  ('Romanian Deadlift', 'Levantamento Terra Romeno', 'legs', false),
  ('Leg Curl', 'Mesa Flexora', 'legs', false),
  ('Leg Extension', 'Cadeira Extensora', 'legs', false),
  ('Calf Raises', 'Elevação de Panturrilha', 'legs', false),
  ('Plank', 'Prancha', 'core', false),
  ('Crunches', 'Abdominal', 'core', false),
  ('Russian Twists', 'Rotação Russa', 'core', false),
  ('Leg Raises', 'Elevação de Pernas', 'core', false),
  ('Running', 'Corrida', 'cardio', false),
  ('Cycling', 'Ciclismo', 'cardio', false),
  ('Rowing', 'Remo', 'cardio', false),
  ('Jump Rope', 'Pular Corda', 'cardio', false),
  ('Burpees', 'Burpees', 'full_body', false),
  ('Clean and Press', 'Arremesso e Desenvolvimento', 'full_body', false),
  ('Kettlebell Swing', 'Swing com Kettlebell', 'full_body', false)
ON CONFLICT DO NOTHING
```

### 3. Update DTOs
- Add required `name_pt` field to CreateExerciseDto with validation
- Add optional `name_pt` field to UpdateExerciseDto

### 4. Update Frontend Types
Add required `namePt: string` field to Exercise interface

### 5. Update ExerciseFormModal
Add a required "Portuguese Name" input field for custom exercises

## Verification
1. Run migrations: `pnpm --filter backend migration:run`
2. Verify column exists: `\d exercises` in psql
3. Verify seed data has Portuguese names: `SELECT name, name_pt FROM exercises LIMIT 5;`
4. Test API: GET `/workouts/exercises` should return exercises with `name_pt`
5. Test creating custom exercise (both name and name_pt required)
6. Frontend: Verify exercises display Portuguese names (e.g., "Supino Reto" instead of "Bench Press")