# Plan: Add Numeric Value to Goal Entries + Goal Type

## Goal

1. Add a `type` field to `Goal` to distinguish goal kinds (e.g., `boolean`, `treadmill`). This determines UI behavior (value input visibility) and enables the daylog export to generate the correct command per goal type.
2. Extend `GoalEntry` to support an optional numeric `value` field, so goals like "treadmill" can store minutes (e.g., 30 min) instead of being purely boolean (logged/not logged).

This enables the daylog export to generate `pnpm run log treadmill 30` with real data (see `daylog-export-plan.md`).

## Current State

`Goal` has: `id`, `userId`, `title`, `createdAt`. No way to distinguish goal kinds.

`GoalEntry` has: `id`, `goalId`, `createdAt`. No way to store a numeric value.

```
goals
├── id (UUID PK)
├── user_id (UUID FK)
├── title (varchar)
└── created_at (timestamp)

goal_entries
├── id (UUID PK)
├── goal_id (UUID FK)
└── created_at (timestamp)
```

## Implementation

### Phase 1: Backend

#### 1. Migration: add `type` column to `goals` and `value` column to `goal_entries`

**File:** `backend/src/migrations/<timestamp>-add-goal-type-and-entry-value.ts`

```sql
ALTER TABLE goals ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'boolean';
ALTER TABLE goal_entries ADD COLUMN value DECIMAL(10,2) NULL;
```

- `type` defaults to `'boolean'` — existing goals keep working with no changes.
- `value` is nullable — existing boolean-style entries keep working with no value.

Seed existing treadmill goal:
```sql
UPDATE goals SET type = 'treadmill' WHERE LOWER(title) = 'treadmill';
```

#### 2. Update Goal entity

**File:** `backend/src/entities/goal.entity.ts`

Add:
```ts
@Column({ type: 'varchar', length: 20, default: 'boolean' })
type: GoalType;
```

With type:
```ts
export type GoalType = 'boolean' | 'treadmill';
```

#### 3. Update GoalEntry entity

**File:** `backend/src/entities/goal-entry.entity.ts`

Add:
```ts
@Column({
  type: 'decimal',
  precision: 10,
  scale: 2,
  nullable: true,
  transformer: {
    to: (value: number | null) => value,
    from: (value: string | null) => {
      if (value === null) {
        return null;
      }
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    },
  },
})
value: number | null;
```

> **Note:** TypeORM returns `decimal` columns as strings. The transformer converts them to numbers. This matches the pattern in `workout-set.entity.ts`.

#### 4. Create CreateGoalDto

**File:** `backend/src/modules/goals/dto/create-goal.dto.ts` (new file)

```ts
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GoalType } from '../../entities/goal.entity';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsIn(['boolean', 'treadmill'])
  type?: GoalType;
}
```

#### 4b. Add `createGoal` to GoalsService

**File:** `backend/src/modules/goals/goals.service.ts`

Add method:
```ts
async createGoal(userId: string, title: string, type: GoalType = 'boolean'): Promise<Goal> {
  const goal = this.goalsRepository.create({ userId, title, type });
  return this.goalsRepository.save(goal);
}
```

#### 4c. Add `POST /goals` endpoint to GoalsController

**File:** `backend/src/modules/goals/goals.controller.ts`

Add:
```ts
@Post()
@HttpCode(HttpStatus.CREATED)
async createGoal(@Body() createGoalDto: CreateGoalDto): Promise<Goal> {
  // TODO: extract userId from auth context once auth is in place
  return this.goalsService.createGoal(userId, createGoalDto.title, createGoalDto.type);
}
```

> **Note:** userId sourcing depends on how auth is wired. For now, decide whether to hardcode a seed user ID or require it in the DTO.

#### 5. Update CreateGoalEntryDto

**File:** `backend/src/modules/goals/dto/create-goal-entry.dto.ts`

Add:
```ts
@IsOptional()
@IsNumber()
value?: number;
```

#### 6. Update GoalsService

**File:** `backend/src/modules/goals/goals.service.ts`

- `createGoal`: pass `type` through (defaults to `'boolean'`).
- `createEntry`: pass `value` through when creating the entry. **Validate:** if `goal.type === 'treadmill'` and `value` is null/undefined, throw `BadRequestException('Treadmill entries require a positive value')`. Also reject `value <= 0`.

```ts
async createEntry(goalId: string, createdAt?: string, value?: number): Promise<GoalEntry> {
  const goal = await this.findOne(goalId);

  if (goal.type === 'treadmill') {
    if (value === undefined || value === null || value <= 0) {
      throw new BadRequestException('Treadmill entries require a positive value');
    }
  }

  const entryDate = createdAt ? new Date(createdAt) : new Date();
  const hasEntryForDate = await this.hasEntryForDate(goalId, entryDate);

  if (hasEntryForDate) {
    throw new ConflictException('An entry for this date already exists for this goal');
  }

  const entry = this.goalEntriesRepository.create({
    goalId: goal.id,
    createdAt: entryDate,
    ...(value !== undefined && { value }),
  });

  return this.goalEntriesRepository.save(entry);
}
```

#### 7. Update GoalsController responses

No change needed — TypeORM will include `type` and `value` in serialized responses automatically once the entities have the columns.

### Phase 2: Frontend — Dashboard

#### 8. Update Goal and GoalEntry types

**File:** `frontend/src/services/api.ts`

```ts
export type GoalType = 'boolean' | 'treadmill';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  type: GoalType;  // <-- add
  createdAt: string;
  entries?: GoalEntry[];
}

export interface GoalEntry {
  id: string;
  goalId: string;
  value?: number | null;  // <-- add
  createdAt: string;
  goal?: { id: string; title: string };
}
```

#### 9. Update addGoalEntry API call

**File:** `frontend/src/services/api.ts`

```ts
async addGoalEntry(goalId: string, date?: Date, value?: number): Promise<GoalEntry> {
  const body: Record<string, unknown> = {};
  if (date) body.createdAt = date.toISOString();
  if (value !== undefined) body.value = value;
  // ...
}
```

#### 10. Update GoalColumn component

**File:** `frontend/src/components/GoalColumn.tsx`

Add `value` state and thread it through both entry handlers:

```ts
const [value, setValue] = useState<number | undefined>(undefined);

const handleAddEntry = async () => {
  // ...existing logic...
  await api.addGoalEntry(goal.id, undefined, goal.type === 'treadmill' ? value : undefined);
  setValue(undefined); // reset after submit
  // ...
};

const handleAddYesterdayEntry = async () => {
  // ...existing logic...
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await api.addGoalEntry(goal.id, yesterday, goal.type === 'treadmill' ? value : undefined);
  setValue(undefined); // reset after submit
  // ...
};
```

For goals with `type === 'treadmill'`:
- Render a number input above the button row (placeholder: "min")
- Bind to `value` / `setValue`
- Disable both "Add Entry" and "Yesterday" buttons when `value` is empty or <= 0
- On submit, pass value to `addGoalEntry`, then reset input

For goals with `type === 'boolean'`:
- No change — current toggle behavior. `value` state is unused.

#### 11. Update EntryList display

Show value next to entries when present:
- "Apr 4" → "Apr 4 — 30 min" (for treadmill)
- "Apr 4" → "Apr 4" (for exercise, no value)

### Phase 3: Daylog Export Integration

See `daylog-export-plan.md` for full details. Once `Goal.type` and `GoalEntry.value` are in place, the daylog export plan's treadmill integration is unblocked.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/migrations/<ts>-add-goal-type-and-entry-value.ts` | New migration: add `type` to goals, `value` to goal_entries |
| `backend/src/entities/goal.entity.ts` | Add `type` field |
| `backend/src/entities/goal-entry.entity.ts` | Add `value` field |
| `backend/src/modules/goals/dto/create-goal.dto.ts` | **New file:** CreateGoalDto with `title` and optional `type` |
| `backend/src/modules/goals/goals.controller.ts` | Add `POST /goals` endpoint |
| `backend/src/modules/goals/dto/create-goal-entry.dto.ts` | Add `value` to DTO |
| `backend/src/modules/goals/goals.service.ts` | Pass `type` and `value` through on create |
| `frontend/src/services/api.ts` | Update `Goal` type (add `type`), `GoalEntry` type (add `value`), `addGoalEntry` signature |
| `frontend/src/components/GoalColumn.tsx` | Show value input for `treadmill` type goals |
| `frontend/src/components/EntryList.tsx` | Show value when present |

## Migration Safety

- `goals.type` defaults to `'boolean'` → existing goals keep working
- `goal_entries.value` is nullable → existing entries get `NULL`, no data loss
- API is backward compatible: both `type` and `value` are optional in DTOs

## Open Questions

1. **Unit display:** Hardcode unit label per `type` (e.g., `treadmill` → "min") or add a `unit` column for flexibility?
2. ~~**Validation:** Should `treadmill` type enforce that `value` is required on entry creation?~~ **Resolved:** Yes — service-layer validation throws `BadRequestException` when `treadmill` entries lack a positive value.
3. **Historical entries:** Allow editing value on past entries?
4. ~~**Existing treadmill goal:** Need a data migration or manual update to set `type = 'treadmill'` on the existing goal?~~ **Resolved:** Migration includes `UPDATE goals SET type = 'treadmill' WHERE LOWER(title) = 'treadmill'`.
