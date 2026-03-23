/* eslint-disable @typescript-eslint/no-unused-vars */
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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function now(): string {
  return new Date().toISOString();
}

const mockExercises: Exercise[] = [
  { id: 'ex-1', name: 'Bench Press', category: 'chest', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-2', name: 'Squat', category: 'legs', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-3', name: 'Deadlift', category: 'back', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-4', name: 'Overhead Press', category: 'shoulders', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-5', name: 'Barbell Row', category: 'back', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-6', name: 'Pull-ups', category: 'back', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-7', name: 'Bicep Curls', category: 'biceps', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-8', name: 'Tricep Pushdown', category: 'triceps', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-9', name: 'Leg Press', category: 'legs', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-10', name: 'Plank', category: 'core', isCustom: false, createdAt: now(), updatedAt: now() },
];

class MockExerciseProvider implements ExerciseProvider {
  private exercises: Exercise[] = [...mockExercises];

  async getAll(): Promise<Exercise[]> {
    return [...this.exercises];
  }

  async getById(id: string): Promise<Exercise | null> {
    return this.exercises.find((e) => e.id === id) || null;
  }

  async search(query: string): Promise<Exercise[]> {
    const lower = query.toLowerCase();
    return this.exercises.filter((e) => e.name.toLowerCase().includes(lower));
  }

  async create(data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exercise> {
    const exercise: Exercise = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    this.exercises.push(exercise);
    return exercise;
  }

  async update(id: string, data: Partial<Exercise>): Promise<Exercise> {
    const index = this.exercises.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Exercise not found');
    this.exercises[index] = { ...this.exercises[index], ...data, updatedAt: now() };
    return this.exercises[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.exercises.findIndex((e) => e.id === id);
    if (index !== -1) this.exercises.splice(index, 1);
  }
}

class MockWorkoutSessionProvider implements WorkoutSessionProvider {
  private sessions: WorkoutSession[] = [];
  private activeSession: WorkoutSession | null = null;

  async getActive(): Promise<WorkoutSession | null> {
    return this.activeSession;
  }

  async getById(id: string): Promise<WorkoutSession | null> {
    return this.sessions.find((s) => s.id === id) || this.activeSession?.id === id ? this.activeSession : null;
  }

  async getAll(): Promise<WorkoutSession[]> {
    return [...this.sessions];
  }

  async create(): Promise<WorkoutSession> {
    if (this.activeSession) {
      throw new Error('An active session already exists');
    }
    this.activeSession = {
      id: generateId(),
      status: 'active',
      startedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    };
    return this.activeSession;
  }

  async end(id: string): Promise<WorkoutSession> {
    if (!this.activeSession || this.activeSession.id !== id) {
      throw new Error('No active session to end');
    }
    this.activeSession.status = 'completed';
    this.activeSession.endedAt = now();
    this.activeSession.updatedAt = now();
    this.sessions.unshift(this.activeSession);
    const ended = this.activeSession;
    this.activeSession = null;
    return ended;
  }

  async abandon(id: string): Promise<WorkoutSession> {
    if (!this.activeSession || this.activeSession.id !== id) {
      throw new Error('No active session to abandon');
    }
    this.activeSession.status = 'abandoned';
    this.activeSession.endedAt = now();
    this.activeSession.updatedAt = now();
    this.sessions.unshift(this.activeSession);
    const abandoned = this.activeSession;
    this.activeSession = null;
    return abandoned;
  }
}

class MockWorkoutSetProvider implements WorkoutSetProvider {
  private sets: Map<string, WorkoutSet[]> = new Map();

  async getBySession(sessionId: string): Promise<WorkoutSet[]> {
    return this.sets.get(sessionId) || [];
  }

  async add(sessionId: string, data: Omit<WorkoutSet, 'id' | 'sessionId' | 'createdAt'>): Promise<WorkoutSet> {
    const set: WorkoutSet = {
      ...data,
      id: generateId(),
      sessionId,
      createdAt: now(),
    };
    const sessionSets = this.sets.get(sessionId) || [];
    sessionSets.push(set);
    this.sets.set(sessionId, sessionSets);
    return set;
  }

  async update(id: string, data: Partial<WorkoutSet>): Promise<WorkoutSet> {
    for (const [, sets] of this.sets) {
      const index = sets.findIndex((s) => s.id === id);
      if (index !== -1) {
        sets[index] = { ...sets[index], ...data };
        return sets[index];
      }
    }
    throw new Error('Set not found');
  }

  async delete(id: string): Promise<void> {
    for (const [sessionId, sets] of this.sets) {
      const index = sets.findIndex((s) => s.id === id);
      if (index !== -1) {
        sets.splice(index, 1);
        this.sets.set(sessionId, sets);
        return;
      }
    }
  }
}

class MockTrainingPlanProvider implements TrainingPlanProvider {
  private plans: TrainingPlan[] = [
    {
      id: 'plan-1',
      name: 'Push Day',
      description: 'Chest, shoulders, triceps',
      exerciseIds: ['ex-1', 'ex-4', 'ex-8'],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'plan-2',
      name: 'Pull Day',
      description: 'Back, biceps',
      exerciseIds: ['ex-3', 'ex-5', 'ex-6', 'ex-7'],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'plan-3',
      name: 'Leg Day',
      description: 'Quads, hamstrings, glutes',
      exerciseIds: ['ex-2', 'ex-9'],
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  async getAll(): Promise<TrainingPlan[]> {
    return [...this.plans];
  }

  async getById(id: string): Promise<TrainingPlan | null> {
    return this.plans.find((p) => p.id === id) || null;
  }

  async create(data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingPlan> {
    const plan: TrainingPlan = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    this.plans.push(plan);
    return plan;
  }

  async update(id: string, data: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const index = this.plans.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Plan not found');
    this.plans[index] = { ...this.plans[index], ...data, updatedAt: now() };
    return this.plans[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.plans.findIndex((p) => p.id === id);
    if (index !== -1) this.plans.splice(index, 1);
  }

  async addExercise(planId: string, exerciseId: string): Promise<TrainingPlan> {
    const plan = await this.getById(planId);
    if (!plan) throw new Error('Plan not found');
    if (!plan.exerciseIds.includes(exerciseId)) {
      plan.exerciseIds.push(exerciseId);
      plan.updatedAt = now();
    }
    return plan;
  }

  async removeExercise(planId: string, exerciseId: string): Promise<TrainingPlan> {
    const plan = await this.getById(planId);
    if (!plan) throw new Error('Plan not found');
    plan.exerciseIds = plan.exerciseIds.filter((id) => id !== exerciseId);
    plan.updatedAt = now();
    return plan;
  }

  async reorderExercises(planId: string, exerciseIds: string[]): Promise<TrainingPlan> {
    const plan = await this.getById(planId);
    if (!plan) throw new Error('Plan not found');
    plan.exerciseIds = exerciseIds;
    plan.updatedAt = now();
    return plan;
  }
}

class MockHistoryProvider implements HistoryProvider {
  async getExerciseHistory(_exerciseId: string): Promise<ExerciseHistoryEntry[]> {
    return [];
  }

  async getRecentSessions(_limit = 10): Promise<WorkoutSession[]> {
    return [];
  }
}

class MockGraphProvider implements GraphProvider {
  async getExerciseProgress(
    _exerciseId: string,
    _options?: { period?: string; limit?: number }
  ): Promise<ExerciseProgressPoint[]> {
    return [];
  }
}

export function createMockProviders(): WorkoutProviders {
  return {
    exercises: new MockExerciseProvider(),
    sessions: new MockWorkoutSessionProvider(),
    sets: new MockWorkoutSetProvider(),
    plans: new MockTrainingPlanProvider(),
    history: new MockHistoryProvider(),
    graphs: new MockGraphProvider(),
  };
}
