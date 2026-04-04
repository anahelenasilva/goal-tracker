import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exercise } from './exercise.entity';
import { WorkoutSession } from './workout-session.entity';

export type WeightUnit = 'kg' | 'lb';

@Entity('workout_sets')
export class WorkoutSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @Column({ type: 'int' })
  reps: number;

  @Column({ type: 'int', default: 1 })
  sets: number;

  @Column({
    type: 'decimal',
    precision: 10,
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
  weight: number | null;

  @Column({ name: 'weight_unit', type: 'varchar' })
  weightUnit: WeightUnit;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => WorkoutSession, (session) => session.sets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: WorkoutSession;

  @ManyToOne(() => Exercise, (exercise) => exercise.sets, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;
}
