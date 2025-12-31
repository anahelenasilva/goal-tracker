import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateGoalEntryDto {
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : new Date())
  createdAt?: Date;
}

export class GoalIdParamDto {
  @IsUUID()
  id: string;
}
