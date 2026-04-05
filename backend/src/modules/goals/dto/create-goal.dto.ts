import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGoalDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsIn(['exercise', 'treadmill'])
  type?: 'exercise' | 'treadmill';
}
