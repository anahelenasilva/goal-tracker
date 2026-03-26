import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrainingPlan } from './training-plan.entity';
import { WorkoutSet } from './workout-set.entity';

export type WorkoutSessionStatus = 'active' | 'completed' | 'abandoned';

@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  status: WorkoutSessionStatus;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  planId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => TrainingPlan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan: TrainingPlan | null;

  @OneToMany(() => WorkoutSet, (set) => set.session)
  sets: WorkoutSet[];
}
