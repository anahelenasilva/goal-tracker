import { IsDateString, IsOptional } from 'class-validator';

export class CreateGoalEntryDto {
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
