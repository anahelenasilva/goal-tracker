import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { Exercise } from './entities/exercise.entity';
import { GoalEntry } from './entities/goal-entry.entity';
import { Goal } from './entities/goal.entity';
import { TrainingPlanExercise } from './entities/training-plan-exercise.entity';
import { TrainingPlan } from './entities/training-plan.entity';
import { User } from './entities/user.entity';
import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutSet } from './entities/workout-set.entity';
import { GoalsModule } from './modules/goals/goals.module';
import { HealthModule } from './modules/health/health.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'goal_tracker',
      entities: [User, Goal, GoalEntry, Exercise, WorkoutSession, WorkoutSet, TrainingPlan, TrainingPlanExercise],
      migrations: ['dist/src/migrations/*.js'],
      synchronize: process.env.NODE_ENV !== 'production',
      migrationsRun: process.env.NODE_ENV === 'production',
    }),
    GoalsModule,
    HealthModule,
    DatabaseModule,
    WorkoutsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
