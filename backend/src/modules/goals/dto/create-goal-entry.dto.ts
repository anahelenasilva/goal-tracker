import { IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateGoalEntryDto {
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  value?: number;
}

export class GoalIdParamDto {
  @IsUUID()
  id: string;
}
