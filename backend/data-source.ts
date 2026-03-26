import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Exercise } from './src/entities/exercise.entity';
import { GoalEntry } from './src/entities/goal-entry.entity';
import { Goal } from './src/entities/goal.entity';
import { TrainingPlanExercise } from './src/entities/training-plan-exercise.entity';
import { TrainingPlan } from './src/entities/training-plan.entity';
import { User } from './src/entities/user.entity';
import { WorkoutSession } from './src/entities/workout-session.entity';
import { WorkoutSet } from './src/entities/workout-set.entity';

// Load environment variables from .env file
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'goal_tracker',
  entities: [
    User,
    Goal,
    GoalEntry,
    Exercise,
    WorkoutSession,
    WorkoutSet,
    TrainingPlan,
    TrainingPlanExercise,
  ],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: false, // Never use synchronize in production
});
