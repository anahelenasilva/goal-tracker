import type { Exercise } from './types';

export function getExerciseDisplayName(exercise: Exercise): string {
  return exercise.namePt || exercise.name;
}

export function getExerciseEnglishName(exercise: Exercise): string | null {
  if (exercise.namePt && exercise.namePt !== exercise.name) {
    return exercise.name;
  }
  return null;
}