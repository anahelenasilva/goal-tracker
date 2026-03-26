import type {
  Exercise,
  ExerciseHistoryEntry,
  ExerciseProgressPoint,
  TrainingPlan,
  WorkoutSession,
  WorkoutSet,
} from './types';

export interface ExerciseProvider {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
  search(query: string): Promise<Exercise[]>;
  create(data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exercise>;
  update(id: string, data: Partial<Exercise>): Promise<Exercise>;
  delete(id: string): Promise<void>;
}

export interface WorkoutSessionProvider {
  getActive(): Promise<WorkoutSession | null>;
  getById(id: string): Promise<WorkoutSession | null>;
  getAll(): Promise<WorkoutSession[]>;
  create(planId?: string): Promise<WorkoutSession>;
  end(id: string): Promise<WorkoutSession>;
  abandon(id: string): Promise<WorkoutSession>;
}

export interface WorkoutSetProvider {
  getBySession(sessionId: string): Promise<WorkoutSet[]>;
  add(sessionId: string, data: Omit<WorkoutSet, 'id' | 'sessionId' | 'createdAt'>): Promise<WorkoutSet>;
  update(id: string, data: Partial<WorkoutSet>): Promise<WorkoutSet>;
  delete(id: string): Promise<void>;
}

export interface TrainingPlanProvider {
  getAll(): Promise<TrainingPlan[]>;
  getById(id: string): Promise<TrainingPlan | null>;
  create(data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingPlan>;
  update(id: string, data: Partial<TrainingPlan>): Promise<TrainingPlan>;
  delete(id: string): Promise<void>;
  addExercise(planId: string, exerciseId: string): Promise<TrainingPlan>;
  removeExercise(planId: string, exerciseId: string): Promise<TrainingPlan>;
  reorderExercises(planId: string, exerciseIds: string[]): Promise<TrainingPlan>;
}

export interface HistoryProvider {
  getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]>;
  getRecentSessions(limit?: number): Promise<WorkoutSession[]>;
}

export interface GraphProvider {
  getExerciseProgress(
    exerciseId: string,
    options?: { period?: string; limit?: number }
  ): Promise<ExerciseProgressPoint[]>;
}

export interface WorkoutProviders {
  exercises: ExerciseProvider;
  sessions: WorkoutSessionProvider;
  sets: WorkoutSetProvider;
  plans: TrainingPlanProvider;
  history: HistoryProvider;
  graphs: GraphProvider;
}
