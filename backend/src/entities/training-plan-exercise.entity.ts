import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exercise } from './exercise.entity';
import { TrainingPlan } from './training-plan.entity';

@Entity('training_plan_exercises')
export class TrainingPlanExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;

  @ManyToOne(() => TrainingPlan, (plan) => plan.planExercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: TrainingPlan;

  @ManyToOne(() => Exercise, (exercise) => exercise.planExercises, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;
}
