export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'full_body'
  | 'other';

export type WorkoutSessionStatus = 'active' | 'completed' | 'abandoned';

export interface Exercise {
  id: string;
  name: string;
  namePt: string;
  category: ExerciseCategory;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  exercise?: Exercise;
  reps: number;
  sets: number;
  weight: number | null;
  notes?: string;
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  endedAt?: string;
  planId?: string;
  plan?: TrainingPlan;
  sets?: WorkoutSet[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlan {
  id: string;
  name: string;
  description?: string;
  assignedDays?: string[];
  exerciseIds: string[];
  exercises?: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseHistoryEntry {
  id: string;
  sessionId: string;
  sessionStartedAt: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface ExerciseProgressPoint {
  date: string;
  weight: number | null;
  reps: number;
  volume: number;
}
