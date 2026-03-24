import { IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateTrainingPlanDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedDays?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  exerciseIds: string[];
}
