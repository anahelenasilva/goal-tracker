import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateWorkoutSetDto {
  @IsOptional()
  @IsUUID()
  exerciseId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number;

  @IsOptional()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
