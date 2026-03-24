import { IsUUID } from 'class-validator';

export class AddPlanExerciseDto {
  @IsUUID()
  exerciseId: string;
}
