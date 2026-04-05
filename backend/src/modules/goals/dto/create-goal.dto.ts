import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { GoalType } from '../../../entities/goal.entity';

export class CreateGoalDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsIn(['boolean', 'treadmill'])
  type?: GoalType;
}
