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
  { id: 'ex-1', name: 'Bench Press', namePt: 'Supino Reto', category: 'chest', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-2', name: 'Squat', namePt: 'Agachamento', category: 'legs', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-3', name: 'Deadlift', namePt: 'Levantamento Terra', category: 'back', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-4', name: 'Overhead Press', namePt: 'Desenvolvimento', category: 'shoulders', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-5', name: 'Barbell Row', namePt: 'Remada com Barra', category: 'back', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-6', name: 'Pull-ups', namePt: 'Barra Fixa', category: 'back', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-7', name: 'Bicep Curls', namePt: 'Rosca Direta', category: 'biceps', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-8', name: 'Tricep Pushdown', namePt: 'Tríceps na Polia', category: 'triceps', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-9', name: 'Leg Press', namePt: 'Leg Press', category: 'legs', isCustom: false, createdAt: now(), updatedAt: now() },
  { id: 'ex-10', name: 'Plank', namePt: 'Prancha', category: 'core', isCustom: false, createdAt: now(), updatedAt: now() },
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
    return this.exercises.filter((e) =>
      e.name.toLowerCase().includes(lower) ||
      e.namePt?.toLowerCase().includes(lower)
    );
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
  private planProvider: MockTrainingPlanProvider | null = null;

  setPlanProvider(planProvider: MockTrainingPlanProvider) {
    this.planProvider = planProvider;
  }

  async getActive(): Promise<WorkoutSession | null> {
    return this.activeSession;
  }

  async getById(id: string): Promise<WorkoutSession | null> {
    return this.sessions.find((s) => s.id === id) || this.activeSession?.id === id ? this.activeSession : null;
  }

  async getAll(): Promise<WorkoutSession[]> {
    return [...this.sessions];
  }

  async create(planId?: string): Promise<WorkoutSession> {
    if (this.activeSession) {
      throw new Error('An active session already exists');
    }
    let plan: TrainingPlan | undefined;
    if (planId && this.planProvider) {
      const found = await this.planProvider.getById(planId);
      if (found) plan = found;
    }
    this.activeSession = {
      id: generateId(),
      status: 'active',
      startedAt: now(),
      planId: planId,
      plan: plan,
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
  private exerciseProvider: ExerciseProvider;

  constructor(exerciseProvider: ExerciseProvider) {
    this.exerciseProvider = exerciseProvider;
  }

  async getBySession(sessionId: string): Promise<WorkoutSet[]> {
    const sets = this.sets.get(sessionId) || [];
    const setsWithExercises = await Promise.all(
      sets.map(async (set) => ({
        ...set,
        exercise: await this.exerciseProvider.getById(set.exerciseId) || undefined,
      }))
    );
    return setsWithExercises;
  }

  async add(sessionId: string, data: Omit<WorkoutSet, 'id' | 'sessionId' | 'createdAt'>): Promise<WorkoutSet> {
    const exercise = await this.exerciseProvider.getById(data.exerciseId);
    const set: WorkoutSet = {
      ...data,
      exercise: exercise || undefined,
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
  private sessionProvider: WorkoutSessionProvider;
  private setProvider: WorkoutSetProvider;

  constructor(sessionProvider: WorkoutSessionProvider, setProvider: WorkoutSetProvider) {
    this.sessionProvider = sessionProvider;
    this.setProvider = setProvider;
  }

  async getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]> {
    const sessions = await this.sessionProvider.getAll();
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const entries: ExerciseHistoryEntry[] = [];

    for (const session of completedSessions) {
      const sets = await this.setProvider.getBySession(session.id);
      const exerciseSets = sets.filter(s => s.exerciseId === exerciseId);

      if (exerciseSets.length > 0 && exerciseSets[0].exercise) {
        entries.push({
          id: `${session.id}-${exerciseId}`,
          sessionId: session.id,
          sessionStartedAt: session.startedAt,
          exerciseId,
          exercise: exerciseSets[0].exercise,
          sets: exerciseSets,
        });
      }
    }

    return entries.sort((a, b) =>
      new Date(b.sessionStartedAt).getTime() - new Date(a.sessionStartedAt).getTime()
    );
  }

  async getRecentSessions(limit = 10): Promise<WorkoutSession[]> {
    const sessions = await this.sessionProvider.getAll();
    return sessions
      .filter(s => s.status === 'completed')
      .slice(0, limit);
  }
}

class MockGraphProvider implements GraphProvider {
  private sessionProvider: WorkoutSessionProvider;
  private setProvider: WorkoutSetProvider;

  constructor(sessionProvider: WorkoutSessionProvider, setProvider: WorkoutSetProvider) {
    this.sessionProvider = sessionProvider;
    this.setProvider = setProvider;
  }

  async getExerciseProgress(
    exerciseId: string,
    options?: { period?: string; limit?: number }
  ): Promise<ExerciseProgressPoint[]> {
    const sessions = await this.sessionProvider.getAll();
    const completedSessions = sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    const periodDays = options?.period ? parseInt(options.period, 10) : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const points: ExerciseProgressPoint[] = [];
    const limit = options?.limit || 365;

    for (const session of completedSessions) {
      const sessionDate = new Date(session.startedAt);
      if (sessionDate < cutoffDate) continue;

      const sets = await this.setProvider.getBySession(session.id);
      const exerciseSets = sets.filter(s => s.exerciseId === exerciseId);

      if (exerciseSets.length > 0) {
        const maxWeight = Math.max(...exerciseSets.map(s => s.weight));
        const maxReps = Math.max(...exerciseSets.map(s => s.reps));
        const totalVolume = exerciseSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

        points.push({
          date: session.startedAt,
          weight: maxWeight,
          reps: maxReps,
          volume: totalVolume,
        });
      }

      if (points.length >= limit) break;
    }

    return points;
  }
}

export function createMockProviders(): WorkoutProviders {
  const exercises = new MockExerciseProvider();
  const sessions = new MockWorkoutSessionProvider();
  const sets = new MockWorkoutSetProvider(exercises);
  const plans = new MockTrainingPlanProvider();
  const history = new MockHistoryProvider(sessions, sets);
  const graphs = new MockGraphProvider(sessions, sets);

  sessions.setPlanProvider(plans);

  return {
    exercises,
    sessions,
    sets,
    plans,
    history,
    graphs,
  };
}