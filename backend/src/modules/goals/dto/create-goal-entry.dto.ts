import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateGoalEntryDto {
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}

export class GoalIdParamDto {
  @IsUUID()
  id: string;
}
