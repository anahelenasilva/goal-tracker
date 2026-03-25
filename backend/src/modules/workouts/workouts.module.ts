import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from '../../entities/exercise.entity';
import { TrainingPlanExercise } from '../../entities/training-plan-exercise.entity';
import { TrainingPlan } from '../../entities/training-plan.entity';
import { WorkoutSession } from '../../entities/workout-session.entity';
import { WorkoutSet } from '../../entities/workout-set.entity';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exercise,
      WorkoutSession,
      WorkoutSet,
      TrainingPlan,
      TrainingPlanExercise,
    ]),
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}