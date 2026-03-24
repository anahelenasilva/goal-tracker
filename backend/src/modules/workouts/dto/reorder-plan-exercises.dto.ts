import { IsArray, IsUUID } from 'class-validator';

export class ReorderPlanExercisesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  exerciseIds: string[];
}
