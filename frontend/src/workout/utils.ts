import type { Exercise } from './types';

export function getExerciseDisplayName(exercise: Exercise): string {
  return exercise.namePt || exercise.name;
}