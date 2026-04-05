import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
