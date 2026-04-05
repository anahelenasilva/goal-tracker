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

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => {
        if (value === null) {
          return null;
        }
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
      },
    },
  })
  value: number | null;

  @ManyToOne(() => Goal, (goal) => goal.entries)
  @JoinColumn({ name: 'goal_id' })
  goal: Goal;
}
