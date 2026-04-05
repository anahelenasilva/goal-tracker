import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GoalEntry } from './goal-entry.entity';
import { User } from './user.entity';

export type GoalType = 'boolean' | 'treadmill';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'varchar', length: 20, default: 'boolean' })
  type: GoalType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.goals)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => GoalEntry, (entry) => entry.goal)
  entries: GoalEntry[];
}
