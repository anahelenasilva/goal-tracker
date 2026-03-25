import { IsBoolean, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import type { ExerciseCategory } from '../../../entities/exercise.entity';

const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'cardio',
  'full_body',
  'other',
];

export class CreateExerciseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsIn(EXERCISE_CATEGORIES)
  category: ExerciseCategory;

  @IsBoolean()
  isCustom: boolean;
}
