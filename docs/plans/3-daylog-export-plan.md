# Plan: Export Workout Session to Daylog Commands

## Goal

Add a "Daylog" button on completed workout sessions in goal-tracker that generates ready-to-run terminal commands for the [daylog](~/Desktop/dev/daylog-with-markdown-files/) project.

## Output Format

**Workout session** with Supino Reto (80kg x5, 85kg x3) and Agachamento (100kg x5, sets=3):

```bash
pnpm run log exercise supino_reto 80x5,85x3
pnpm run log exercise agachamento 100x5,100x5,100x5
pnpm run log type lifting
```

**Treadmill goal entry** with 30 minutes:

```bash
pnpm run log treadmill 30
```

## Architecture

**Frontend-only** — no backend changes. The HistoryPage already loads full session data including exercises with `namePt` and sets with weight/reps/sets.

## Implementation

### 1. Utility function: `generateDaylogCommands`

**File:** `frontend/src/workout/utils.ts`

```ts
function toDaylogName(exercise: Exercise): string {
  const name = exercise.namePt || exercise.name;
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .replace(/_{2,}/g, '_')
    || 'unknown';
}

function formatSetNotation(set: WorkoutSet): string {
  const entry = set.weight != null ? `${set.weight}x${set.reps}` : `0x${set.reps}`;
  if (set.sets > 1) {
    return Array(set.sets).fill(entry).join(',');
  }
  return entry;
}

function generateDaylogCommands(sets: WorkoutSet[]): string {
  const grouped = new Map<string, { exercise: Exercise; sets: WorkoutSet[] }>();

  for (const set of sets) {
    if (!set.exercise) continue;
    if (!grouped.has(set.exerciseId)) {
      grouped.set(set.exerciseId, { exercise: set.exercise, sets: [] });
    }
    grouped.get(set.exerciseId)!.sets.push(set);
  }

  const lines: string[] = [];

  for (const { exercise, sets } of grouped.values()) {
    const name = toDaylogName(exercise);
    const notation = sets.map(formatSetNotation).join(',');
    lines.push(`pnpm run log exercise ${name} ${notation}`);
  }

  lines.push('pnpm run log type lifting');

  return lines.join('\n');
}
```

**Key decisions:**
- Uses `namePt` (Portuguese name), falls back to `name` (English)
- Lowercased + spaces→underscores
- Multi-set entries (sets > 1) expand: `sets=3, 80kg, 5reps` → `80x5,80x5,80x5`
- Bodyweight exercises use `0x<reps>` (e.g., `0x8`) — compatible with daylog's `estimateOneRM` regex
- `pnpm run log type lifting` always appended (workout sessions = lifting)
- Treadmill export is a separate flow, triggered from goal entry UI (see section below)

**Canonical contract (goal-tracker → daylog):**

| Concern | Rule | Rationale |
|---------|------|-----------|
| **Name slugging** | NFD-normalize → strip diacritics → lowercase → replace `[^a-z0-9]+` with `_` → trim/collapse `_` → fallback `'unknown'`. e.g., "Supino Reto" → `supino_reto`, "Haltéres (Incl.)" → `halteres_incl` | Shell-safe (`[a-z0-9_]+` only), deterministic, no lookup table needed; daylog accepts any string as YAML key |
| **Ordering** | Exercises appear in session order (`Map` preserves insertion order) | daylog appends in command execution order; no reordering needed |
| **Bodyweight notation** | `0x<reps>` (e.g., `0x8`) | daylog's `estimateOneRM` regex `/(\d+)x(\d+)/` requires numeric weight; `BW` prefix would silently produce 0 |
| **Set expansion** | `sets=3` expands to `80x5,80x5,80x5` | daylog has no shorthand for repeated sets; comma-separated string is parsed correctly |

### 2. Utility function: `generateTreadmillDaylogCommand`

**File:** `frontend/src/workout/utils.ts`

**Prerequisite:** `Goal.type` and `GoalEntry.value` from `goal-entry-value-plan.md`.

```ts
function generateTreadmillDaylogCommand(entry: GoalEntry): string | null {
  if (entry.value == null) return null;
  return `pnpm run log treadmill ${entry.value}`;
}
```

### 3. UI: DaylogExportButton component

**File:** `frontend/src/workout/components/DaylogExportButton.tsx`

A button + modal that:
- Renders a "Daylog" button (small, secondary style, next to the "Edit" button)
- On click: opens a modal/panel showing the generated commands in a `<pre style={{ userSelect: 'all' }}>` block
- "Copy" button that copies all commands to clipboard via try/catch around `navigator.clipboard.writeText`
- Three copy states: `idle` → "Copy", `copied` → "Copied!" (resets after 2s), `error` → hide Copy button and show "Clipboard unavailable — click text to select"
- The `user-select: all` on `<pre>` ensures one click selects all text as fallback when clipboard API is denied or unavailable (insecure context, permissions policy)

### 4. Integration into SessionDetail

**File:** `frontend/src/workout/pages/HistoryPage.tsx`

Add the `DaylogExportButton` into `SessionDetail` component, next to the existing "Edit" button (line 146-156). Only shown for `completed` sessions.

```tsx
{session.status === 'completed' && (
  <div className="flex gap-2">
    {sets.some(s => s.exercise) && <DaylogExportButton sets={sets} />}
    <button onClick={() => setIsEditing(!isEditing)} ...>
      {isEditing ? 'Done' : 'Edit'}
    </button>
  </div>
)}
```

### 5. Integration into GoalColumn (treadmill)

**File:** `frontend/src/components/GoalColumn.tsx`

For goals with `type === 'treadmill'`, show a `DaylogExportButton` next to entries that have a `value`. The button generates a single command via `generateTreadmillDaylogCommand`.

```tsx
{goal.type === 'treadmill' && entry.value != null && (
  <DaylogExportButton treadmillEntry={entry} />
)}
```

The `DaylogExportButton` component accepts either `sets` (workout session) or `treadmillEntry` (goal entry) — one or the other.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/workout/utils.ts` | Add `toDaylogName`, `formatSetNotation`, `generateDaylogCommands`, `generateTreadmillDaylogCommand` |
| `frontend/src/workout/components/DaylogExportButton.tsx` | New component (button + modal + copy), accepts `sets` or `treadmillEntry` |
| `frontend/src/workout/components/index.ts` | Export new component |
| `frontend/src/workout/pages/HistoryPage.tsx` | Import and render `DaylogExportButton` in `SessionDetail` |
| `frontend/src/components/GoalColumn.tsx` | Import and render `DaylogExportButton` for treadmill entries with value |

## Edge Cases

- **No sets in session:** Button hidden when `sets` is empty or no set has a populated `exercise`
- **Bodyweight exercises (weight=null):** Use `0x<reps>` notation (daylog's 1RM regex requires numeric weight)
- **Exercise without namePt:** Falls back to English name
- **Special characters in exercise names:** `toDaylogName` strips accents (NFD), replaces non-`[a-z0-9]` runs with `_`, collapses/trims underscores, and rejects empty results — output is always shell-safe
- **Treadmill entry without value:** `generateTreadmillDaylogCommand` returns `null` — button hidden or disabled

## Test Plan

### Unit tests — `toDaylogName`

| Input | Expected |
|-------|----------|
| `"Supino Reto"` | `supino_reto` |
| `"Haltéres (Incl.)"` | `halteres_incl` |
| `"Leg Press 45°"` | `leg_press_45` |
| `"  Rosca Direta  "` | `rosca_direta` |
| `"; rm -rf /"` | `rm_rf` |
| `"$HOME"` | `home` |
| `"????"` | `unknown` |
| `""` | `unknown` |

### Unit tests — `formatSetNotation`

- `{ weight: 80, reps: 5, sets: 1 }` → `"80x5"`
- `{ weight: 80, reps: 5, sets: 3 }` → `"80x5,80x5,80x5"`
- `{ weight: null, reps: 8, sets: 1 }` → `"0x8"`

### Unit tests — `generateDaylogCommands`

- Two exercises, multiple sets → correct grouped output ending with `type lifting`
- Empty sets array → returns only `type lifting` line
- Exercise without `namePt` → uses English `name`
- Preserves exercise order from sets array (Map insertion order)

### Unit tests — `generateTreadmillDaylogCommand`

- `{ value: 30 }` → `"pnpm run log treadmill 30"`
- `{ value: null }` → `null`

### Integration tests — `DaylogExportButton`

- Button only renders for `completed` sessions
- Click opens modal with `<pre>` block containing generated commands
- "Copy" writes to clipboard and shows "Copied!" feedback
- When clipboard API rejects, hides Copy button and shows fallback hint
- `<pre>` block has `user-select: all` so clicking selects full text
- Modal closes on dismiss

## Dependencies

- `Goal.type` and `GoalEntry.value` must be implemented first (see `goal-entry-value-plan.md`)
- Treadmill daylog export is blocked until that plan is complete; workout session export can be built independently

## Not in Scope

- Auto-executing commands (user copies and runs manually)
- Backend changes
- Adding `Goal.type` or `GoalEntry.value` (see `goal-entry-value-plan.md`)
