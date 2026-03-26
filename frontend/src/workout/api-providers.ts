import { getApiBaseUrl } from '../services/api';
import type {
  ExerciseProvider,
  GraphProvider,
  HistoryProvider,
  TrainingPlanProvider,
  WorkoutProviders,
  WorkoutSessionProvider,
  WorkoutSetProvider,
} from './providers';
import type {
  Exercise,
  ExerciseHistoryEntry,
  ExerciseProgressPoint,
  TrainingPlan,
  WorkoutSession,
  WorkoutSet,
} from './types';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    throw new Error('Empty response body');
  }
  return JSON.parse(text);
}

async function handleEmptyResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
}

function mapExercise(data: Record<string, unknown>): Exercise {
  return {
    id: data.id as string,
    name: data.name as string,
    namePt: data.namePt as string,
    category: data.category as Exercise['category'],
    isCustom: data.isCustom as boolean,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

function mapWorkoutSession(data: Record<string, unknown>): WorkoutSession {
  return {
    id: data.id as string,
    status: data.status as WorkoutSession['status'],
    startedAt: data.startedAt as string,
    endedAt: data.endedAt as string | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

function mapWorkoutSet(data: Record<string, unknown>): WorkoutSet {
  return {
    id: data.id as string,
    sessionId: data.sessionId as string,
    exerciseId: data.exerciseId as string,
    exercise: data.exercise ? mapExercise(data.exercise as Record<string, unknown>) : undefined,
    reps: data.reps as number,
    weight: Number(data.weight),
    weightUnit: data.weightUnit as WorkoutSet['weightUnit'],
    notes: data.notes as string | undefined,
    createdAt: data.createdAt as string,
  };
}

function mapTrainingPlan(data: Record<string, unknown>): TrainingPlan {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    assignedDays: data.assignedDays as string[] | undefined,
    exerciseIds: data.exerciseIds as string[],
    exercises: data.exercises
      ? (data.exercises as Record<string, unknown>[]).map(mapExercise)
      : undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

class ApiExerciseProvider implements ExerciseProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  async getAll(): Promise<Exercise[]> {
    const response = await fetch(`${this.baseUrl}/workouts/exercises`);
    const data = await handleResponse<Record<string, unknown>[]>(response);
    return data.map(mapExercise);
  }

  async getById(id: string): Promise<Exercise | null> {
    const response = await fetch(`${this.baseUrl}/workouts/exercises/${id}`);
    if (response.status === 404) return null;
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapExercise(data);
  }

  async search(query: string): Promise<Exercise[]> {
    const response = await fetch(
      `${this.baseUrl}/workouts/exercises?query=${encodeURIComponent(query)}`
    );
    const data = await handleResponse<Record<string, unknown>[]>(response);
    return data.map(mapExercise);
  }

  async create(data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exercise> {
    const response = await fetch(`${this.baseUrl}/workouts/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Record<string, unknown>>(response);
    return mapExercise(result);
  }

  async update(id: string, data: Partial<Exercise>): Promise<Exercise> {
    const response = await fetch(`${this.baseUrl}/workouts/exercises/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Record<string, unknown>>(response);
    return mapExercise(result);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workouts/exercises/${id}`, {
      method: 'DELETE',
    });
    await handleEmptyResponse(response);
  }
}

class ApiWorkoutSessionProvider implements WorkoutSessionProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  async getActive(): Promise<WorkoutSession | null> {
    const response = await fetch(`${this.baseUrl}/workouts/sessions/active`);
    if (response.status === 404) return null;
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }
    const text = await response.text();
    if (!text) return null;
    const data = JSON.parse(text);
    return data ? mapWorkoutSession(data) : null;
  }

  async getById(id: string): Promise<WorkoutSession | null> {
    const response = await fetch(`${this.baseUrl}/workouts/sessions/${id}`);
    if (response.status === 404) return null;
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapWorkoutSession(data);
  }

  async getAll(): Promise<WorkoutSession[]> {
    const response = await fetch(`${this.baseUrl}/workouts/sessions`);
    const data = await handleResponse<Record<string, unknown>[]>(response);
    return data.map(mapWorkoutSession);
  }

  async create(): Promise<WorkoutSession> {
    const response = await fetch(`${this.baseUrl}/workouts/sessions`, {
      method: 'POST',
    });
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapWorkoutSession(data);
  }

  async end(id: string): Promise<WorkoutSession> {
    const response = await fetch(`${this.baseUrl}/workouts/sessions/${id}/end`, {
      method: 'POST',
    });
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapWorkoutSession(data);
  }

  async abandon(id: string): Promise<WorkoutSession> {
    const response = await fetch(`${this.baseUrl}/workouts/sessions/${id}/abandon`, {
      method: 'POST',
    });
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapWorkoutSession(data);
  }
}

class ApiWorkoutSetProvider implements WorkoutSetProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  async getBySession(sessionId: string): Promise<WorkoutSet[]> {
    const response = await fetch(`${this.baseUrl}/workouts/sessions/${sessionId}/sets`);
    const data = await handleResponse<Record<string, unknown>[]>(response);
    return data.map(mapWorkoutSet);
  }

  async add(
    sessionId: string,
    data: Omit<WorkoutSet, 'id' | 'sessionId' | 'createdAt'>
  ): Promise<WorkoutSet> {
    const response = await fetch(`${this.baseUrl}/workouts/sessions/${sessionId}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Record<string, unknown>>(response);
    return mapWorkoutSet(result);
  }

  async update(id: string, data: Partial<WorkoutSet>): Promise<WorkoutSet> {
    const response = await fetch(`${this.baseUrl}/workouts/sets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Record<string, unknown>>(response);
    return mapWorkoutSet(result);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workouts/sets/${id}`, {
      method: 'DELETE',
    });
    await handleEmptyResponse(response);
  }
}

class ApiTrainingPlanProvider implements TrainingPlanProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  async getAll(): Promise<TrainingPlan[]> {
    const response = await fetch(`${this.baseUrl}/workouts/plans`);
    const data = await handleResponse<Record<string, unknown>[]>(response);
    return data.map(mapTrainingPlan);
  }

  async getById(id: string): Promise<TrainingPlan | null> {
    const response = await fetch(`${this.baseUrl}/workouts/plans/${id}`);
    if (response.status === 404) return null;
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapTrainingPlan(data);
  }

  async create(data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/workouts/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Record<string, unknown>>(response);
    return mapTrainingPlan(result);
  }

  async update(id: string, data: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/workouts/plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Record<string, unknown>>(response);
    return mapTrainingPlan(result);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workouts/plans/${id}`, {
      method: 'DELETE',
    });
    await handleEmptyResponse(response);
  }

  async addExercise(planId: string, exerciseId: string): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/workouts/plans/${planId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId }),
    });
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapTrainingPlan(data);
  }

  async removeExercise(planId: string, exerciseId: string): Promise<TrainingPlan> {
    const response = await fetch(
      `${this.baseUrl}/workouts/plans/${planId}/exercises/${exerciseId}`,
      { method: 'DELETE' }
    );
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapTrainingPlan(data);
  }

  async reorderExercises(planId: string, exerciseIds: string[]): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/workouts/plans/${planId}/exercises/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseIds }),
    });
    const data = await handleResponse<Record<string, unknown>>(response);
    return mapTrainingPlan(data);
  }
}

class ApiHistoryProvider implements HistoryProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  async getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]> {
    const response = await fetch(`${this.baseUrl}/workouts/history/${exerciseId}`);
    const data = await handleResponse<Record<string, unknown>[]>(response);
    return data.map((entry) => ({
      id: entry.id as string,
      sessionId: entry.sessionId as string,
      sessionStartedAt: entry.sessionStartedAt as string,
      exerciseId: entry.exerciseId as string,
      exercise: mapExercise(entry.exercise as Record<string, unknown>),
      sets: (entry.sets as Record<string, unknown>[]).map(mapWorkoutSet),
    }));
  }

  async getRecentSessions(limit = 10): Promise<WorkoutSession[]> {
    const response = await fetch(
      `${this.baseUrl}/workouts/history/recent-sessions?limit=${limit}`
    );
    const data = await handleResponse<Record<string, unknown>[]>(response);
    return data.map(mapWorkoutSession);
  }
}

class ApiGraphProvider implements GraphProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  async getExerciseProgress(
    exerciseId: string,
    options?: { period?: string; limit?: number }
  ): Promise<ExerciseProgressPoint[]> {
    const params = new URLSearchParams();
    if (options?.period) params.set('period', options.period);
    if (options?.limit) params.set('limit', String(options.limit));

    const queryString = params.toString();
    const url = `${this.baseUrl}/workouts/graphs/${exerciseId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    const data = await handleResponse<Record<string, unknown>[]>(response);
    return data.map((point) => ({
      date: point.date as string,
      weight: Number(point.weight),
      reps: point.reps as number,
      volume: point.volume as number,
    }));
  }
}

export function createApiProviders(): WorkoutProviders {
  return {
    exercises: new ApiExerciseProvider(),
    sessions: new ApiWorkoutSessionProvider(),
    sets: new ApiWorkoutSetProvider(),
    plans: new ApiTrainingPlanProvider(),
    history: new ApiHistoryProvider(),
    graphs: new ApiGraphProvider(),
  };
}