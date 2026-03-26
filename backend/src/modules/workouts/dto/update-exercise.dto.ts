import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
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

export class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  namePt?: string;

  @IsOptional()
  @IsIn(EXERCISE_CATEGORIES)
  category?: ExerciseCategory;

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;
}
