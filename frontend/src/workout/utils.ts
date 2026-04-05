import type { Exercise, WorkoutSet } from './types';

export const WEIGHT_UNIT_SUFFIX = 'kg';

export function getExerciseDisplayName(exercise: Exercise): string {
  return exercise.namePt || exercise.name;
}

export function getExerciseEnglishName(exercise: Exercise): string | null {
  if (exercise.namePt && exercise.namePt !== exercise.name) {
    return exercise.name;
  }
  return null;
}

export function toDaylogName(exercise: Exercise): string {
  const sourceName = exercise.namePt || exercise.name;
  const sanitizedName = sourceName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .replace(/_{2,}/g, '_');

  return sanitizedName || 'unknown';
}

export function formatSetNotation(set: WorkoutSet): string {
  const entry = set.weight != null ? `${set.weight}x${set.reps}` : `0x${set.reps}`;

  if (set.sets > 1) {
    return Array.from({ length: set.sets }, () => entry).join(',');
  }

  return entry;
}

export function generateDaylogCommands(sets: WorkoutSet[]): string {
  const grouped = new Map<string, { exercise: Exercise; sets: WorkoutSet[] }>();

  for (const set of sets) {
    if (!set.exercise) {
      continue;
    }

    const existingGroup = grouped.get(set.exerciseId);
    if (existingGroup) {
      existingGroup.sets.push(set);
      continue;
    }

    grouped.set(set.exerciseId, { exercise: set.exercise, sets: [set] });
  }

  const lines: string[] = [];

  for (const group of grouped.values()) {
    const name = toDaylogName(group.exercise);
    const notation = group.sets.map(formatSetNotation).join(',');
    lines.push(`pnpm run log exercise ${name} ${notation}`);
  }

  lines.push('pnpm run log type lifting');

  return lines.join('\n');
}
