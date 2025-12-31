import { DataSource } from 'typeorm';
import { GoalEntry } from './src/entities/goal-entry.entity';
import { Goal } from './src/entities/goal.entity';
import { User } from './src/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'goal_tracker',
  entities: [User, Goal, GoalEntry],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // Never use synchronize in production
});
