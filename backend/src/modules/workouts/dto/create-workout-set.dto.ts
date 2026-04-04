import { IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import type { WeightUnit } from '../../../entities/workout-set.entity';

const WEIGHT_UNITS: WeightUnit[] = ['kg', 'lb'];

export class CreateWorkoutSetDto {
  @IsUUID()
  exerciseId: string;

  @IsInt()
  @Min(1)
  reps: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number;

  @IsOptional()
  @Min(0)
  weight?: number | null;

  @IsIn(WEIGHT_UNITS)
  weightUnit: WeightUnit;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
