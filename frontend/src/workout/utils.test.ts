import { describe, expect, it } from 'vitest';
import {
  toDaylogName,
  formatSetNotation,
  generateDaylogCommands,
  generateTreadmillDaylogCommand,
} from './utils';
import type { Exercise, WorkoutSet } from './types';
import type { GoalEntry } from '../services/api';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    name: 'Bench Press',
    namePt: 'Supino Reto',
    category: 'chest',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set-1',
    sessionId: 'sess-1',
    exerciseId: 'ex-1',
    reps: 5,
    sets: 1,
    weight: 80,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('toDaylogName', () => {
  it('converts "Supino Reto" to supino_reto', () => {
    expect(toDaylogName(makeExercise({ namePt: 'Supino Reto' }))).toBe('supino_reto');
  });

  it('strips diacritics: "Haltéres (Incl.)" → halteres_incl', () => {
    expect(toDaylogName(makeExercise({ namePt: 'Haltéres (Incl.)' }))).toBe('halteres_incl');
  });

  it('handles degree symbol: "Leg Press 45°" → leg_press_45', () => {
    expect(toDaylogName(makeExercise({ namePt: 'Leg Press 45°' }))).toBe('leg_press_45');
  });

  it('trims surrounding whitespace: "  Rosca Direta  " → rosca_direta', () => {
    expect(toDaylogName(makeExercise({ namePt: '  Rosca Direta  ' }))).toBe('rosca_direta');
  });

  it('sanitizes shell-dangerous chars: "; rm -rf /" → rm_rf', () => {
    expect(toDaylogName(makeExercise({ namePt: '; rm -rf /' }))).toBe('rm_rf');
  });

  it('strips dollar sign: "$HOME" → home', () => {
    expect(toDaylogName(makeExercise({ namePt: '$HOME' }))).toBe('home');
  });

  it('returns "unknown" for non-alphanumeric only input: "????"', () => {
    expect(toDaylogName(makeExercise({ namePt: '????' }))).toBe('unknown');
  });

  it('returns "unknown" when both names are empty', () => {
    expect(toDaylogName(makeExercise({ namePt: '', name: '' }))).toBe('unknown');
  });

  it('falls back to English name when namePt is empty', () => {
    expect(toDaylogName(makeExercise({ namePt: '', name: 'Deadlift' }))).toBe('deadlift');
  });
});

describe('formatSetNotation', () => {
  it('single set with weight: 80x5', () => {
    expect(formatSetNotation(makeSet({ weight: 80, reps: 5, sets: 1 }))).toBe('80x5');
  });

  it('multiple sets expand: 80x5,80x5,80x5', () => {
    expect(formatSetNotation(makeSet({ weight: 80, reps: 5, sets: 3 }))).toBe('80x5,80x5,80x5');
  });

  it('bodyweight (null weight) uses 0: 0x8', () => {
    expect(formatSetNotation(makeSet({ weight: null, reps: 8, sets: 1 }))).toBe('0x8');
  });
});

describe('generateDaylogCommands', () => {
  const benchPress = makeExercise({ id: 'ex-1', namePt: 'Supino Reto' });
  const squat = makeExercise({ id: 'ex-2', namePt: 'Agachamento', name: 'Squat' });

  it('groups two exercises with multiple sets', () => {
    const sets = [
      makeSet({ id: 's1', exerciseId: 'ex-1', exercise: benchPress, weight: 80, reps: 5 }),
      makeSet({ id: 's2', exerciseId: 'ex-1', exercise: benchPress, weight: 85, reps: 3 }),
      makeSet({ id: 's3', exerciseId: 'ex-2', exercise: squat, weight: 100, reps: 5, sets: 3 }),
    ];

    expect(generateDaylogCommands(sets)).toBe(
      'pnpm run log exercise supino_reto 80x5,85x3\n' +
      'pnpm run log exercise agachamento 100x5,100x5,100x5'
    );
  });

  it('returns empty string for empty sets array', () => {
    expect(generateDaylogCommands([])).toBe('');
  });

  it('falls back to English name when namePt is missing', () => {
    const exercise = makeExercise({ id: 'ex-3', namePt: '', name: 'Pull Up' });
    const sets = [
      makeSet({ exerciseId: 'ex-3', exercise, weight: null, reps: 8 }),
    ];

    expect(generateDaylogCommands(sets)).toBe('pnpm run log exercise pull_up 0x8');
  });

  it('preserves exercise order from sets array (Map insertion order)', () => {
    const sets = [
      makeSet({ id: 's1', exerciseId: 'ex-2', exercise: squat, weight: 100, reps: 5 }),
      makeSet({ id: 's2', exerciseId: 'ex-1', exercise: benchPress, weight: 80, reps: 5 }),
    ];

    const lines = generateDaylogCommands(sets).split('\n');
    expect(lines[0]).toContain('agachamento');
    expect(lines[1]).toContain('supino_reto');
  });

  it('skips sets without exercise', () => {
    const sets = [
      makeSet({ id: 's1', exerciseId: 'ex-1', exercise: undefined }),
      makeSet({ id: 's2', exerciseId: 'ex-1', exercise: benchPress, weight: 80, reps: 5 }),
    ];

    expect(generateDaylogCommands(sets)).toBe('pnpm run log exercise supino_reto 80x5');
  });
});

describe('generateTreadmillDaylogCommand', () => {
  it('generates command for entry with value', () => {
    const entry: GoalEntry = { id: 'e1', goalId: 'g1', value: 30, createdAt: '2026-01-01T00:00:00Z' };
    expect(generateTreadmillDaylogCommand(entry)).toBe('pnpm run log treadmill 30');
  });

  it('returns null for entry with null value', () => {
    const entry: GoalEntry = { id: 'e1', goalId: 'g1', value: null, createdAt: '2026-01-01T00:00:00Z' };
    expect(generateTreadmillDaylogCommand(entry)).toBeNull();
  });
});
