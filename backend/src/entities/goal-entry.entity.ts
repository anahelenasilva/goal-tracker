import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Goal } from './goal.entity';

@Entity('goal_entries')
@Index('idx_goal_entry_date', ['goalId', 'createdAt'], { unique: true })
export class GoalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id' })
  goalId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Goal, (goal) => goal.entries)
  @JoinColumn({ name: 'goal_id' })
  goal: Goal;
}
