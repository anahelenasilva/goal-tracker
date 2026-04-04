import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from '../../entities/exercise.entity';
import { TrainingPlanExercise } from '../../entities/training-plan-exercise.entity';
import { TrainingPlan } from '../../entities/training-plan.entity';
import { WorkoutSession } from '../../entities/workout-session.entity';
import { WorkoutSet } from '../../entities/workout-set.entity';
import { AddPlanExerciseDto } from './dto/add-plan-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { CreateWorkoutSetDto } from './dto/create-workout-set.dto';
import { ReorderPlanExercisesDto } from './dto/reorder-plan-exercises.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { UpdateTrainingPlanDto } from './dto/update-training-plan.dto';
import { UpdateWorkoutSetDto } from './dto/update-workout-set.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Exercise)
    private exercisesRepository: Repository<Exercise>,
    @InjectRepository(WorkoutSession)
    private workoutSessionsRepository: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet)
    private workoutSetsRepository: Repository<WorkoutSet>,
    @InjectRepository(TrainingPlan)
    private trainingPlansRepository: Repository<TrainingPlan>,
    @InjectRepository(TrainingPlanExercise)
    private trainingPlanExercisesRepository: Repository<TrainingPlanExercise>,
  ) { }

  async getExercises(query?: string): Promise<Exercise[]> {
    if (query) {
      return this.exercisesRepository
        .createQueryBuilder('exercise')
        .where('LOWER(exercise.name) LIKE LOWER(:query)', { query: `%${query}%` })
        .orderBy('exercise.name', 'ASC')
        .getMany();
    }

    return this.exercisesRepository.find({ order: { name: 'ASC' } });
  }

  async getExerciseById(id: string): Promise<Exercise> {
    if (!this.isValidUUID(id)) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    const exercise = await this.exercisesRepository.findOne({ where: { id } });
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return exercise;
  }

  async createExercise(data: CreateExerciseDto): Promise<Exercise> {
    const exercise = this.exercisesRepository.create(data);
    return this.exercisesRepository.save(exercise);
  }

  async updateExercise(id: string, data: UpdateExerciseDto): Promise<Exercise> {
    const exercise = await this.getExerciseById(id);
    const updated = this.exercisesRepository.merge(exercise, data);
    return this.exercisesRepository.save(updated);
  }

  async deleteExercise(id: string): Promise<void> {
    const exercise = await this.getExerciseById(id);
    await this.exercisesRepository.remove(exercise);
  }

  async getActiveSession(): Promise<WorkoutSession | null> {
    const session = await this.workoutSessionsRepository.findOne({
      where: { status: 'active' },
      relations: ['plan', 'plan.planExercises', 'plan.planExercises.exercise'],
      order: { startedAt: 'DESC' },
    });
    if (session?.plan) {
      session.plan = this.toPlanView(session.plan);
    }
    return session;
  }

  async getSessions(): Promise<WorkoutSession[]> {
    return this.workoutSessionsRepository.find({
      order: { startedAt: 'DESC' },
    });
  }

  async getSessionById(id: string): Promise<WorkoutSession> {
    if (!this.isValidUUID(id)) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    const session = await this.workoutSessionsRepository.findOne({
      where: { id },
      relations: ['plan', 'plan.planExercises', 'plan.planExercises.exercise'],
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    if (session.plan) {
      session.plan = this.toPlanView(session.plan);
    }
    return session;
  }

  async createSession(data?: CreateSessionDto): Promise<WorkoutSession> {
    const activeSession = await this.getActiveSession();
    if (activeSession) {
      throw new ConflictException('An active session already exists');
    }

    if (data?.planId) {
      const plan = await this.trainingPlansRepository.findOne({
        where: { id: data.planId },
      });
      if (!plan) {
        throw new NotFoundException(`Plan with ID ${data.planId} not found`);
      }
    }

    const session = this.workoutSessionsRepository.create({
      status: 'active',
      startedAt: new Date(),
      endedAt: null,
      planId: data?.planId ?? null,
    });

    const saved = await this.workoutSessionsRepository.save(session);

    if (saved.planId) {
      return this.getSessionById(saved.id);
    }

    return saved;
  }

  async endSession(id: string): Promise<WorkoutSession> {
    const session = await this.getSessionById(id);
    if (session.status !== 'active') {
      throw new ConflictException('Only an active session can be ended');
    }
    session.status = 'completed';
    session.endedAt = new Date();
    return this.workoutSessionsRepository.save(session);
  }

  async abandonSession(id: string): Promise<WorkoutSession> {
    const session = await this.getSessionById(id);
    if (session.status !== 'active') {
      throw new ConflictException('Only an active session can be abandoned');
    }
    session.status = 'abandoned';
    session.endedAt = new Date();
    return this.workoutSessionsRepository.save(session);
  }

  async getSetsBySession(sessionId: string): Promise<WorkoutSet[]> {
    await this.getSessionById(sessionId);
    return this.workoutSetsRepository.find({
      where: { sessionId },
      relations: ['exercise'],
      order: { createdAt: 'ASC' },
    });
  }

  async addSet(sessionId: string, data: CreateWorkoutSetDto): Promise<WorkoutSet> {
    const session = await this.getSessionById(sessionId);
    if (session.status !== 'active') {
      throw new ConflictException('Cannot add set to a non-active session');
    }
    await this.getExerciseById(data.exerciseId);
    const set = this.workoutSetsRepository.create({
      ...data,
      sessionId,
      notes: data.notes ?? null,
    });
    const saved = await this.workoutSetsRepository.save(set);
    return this.workoutSetsRepository.findOne({
      where: { id: saved.id },
      relations: ['exercise'],
    }) as Promise<WorkoutSet>;
  }

  async updateSet(id: string, data: UpdateWorkoutSetDto): Promise<WorkoutSet> {
    const set = await this.workoutSetsRepository.findOne({
      where: { id },
      relations: ['exercise'],
    });
    if (!set) {
      throw new NotFoundException(`Set with ID ${id} not found`);
    }
    if (data.exerciseId) {
      await this.getExerciseById(data.exerciseId);
    }
    const updated = this.workoutSetsRepository.merge(set, {
      ...data,
      notes: data.notes ?? set.notes,
    });
    return this.workoutSetsRepository.save(updated);
  }

  async deleteSet(id: string): Promise<void> {
    const set = await this.workoutSetsRepository.findOne({
      where: { id },
      relations: ['session']
    });

    if (!set || !set.session) {
      throw new NotFoundException(`Set with ID ${id} not found`);
    }

    if (set.session.status === 'abandoned') {
      throw new ConflictException('Cannot delete set from an abandoned session');
    }
    await this.workoutSetsRepository.remove(set);
  }

  async getPlans(): Promise<TrainingPlan[]> {
    const plans = await this.trainingPlansRepository.find({
      relations: ['planExercises', 'planExercises.exercise'],
      order: { createdAt: 'DESC' },
    });
    return plans.map((plan) => this.toPlanView(plan));
  }

  async getPlanById(id: string): Promise<TrainingPlan> {
    if (!this.isValidUUID(id)) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    const plan = await this.trainingPlansRepository.findOne({
      where: { id },
      relations: ['planExercises', 'planExercises.exercise'],
    });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return this.toPlanView(plan);
  }

  async createPlan(data: CreateTrainingPlanDto): Promise<TrainingPlan> {
    const plan = this.trainingPlansRepository.create({
      name: data.name,
      description: data.description ?? null,
      assignedDays: data.assignedDays ?? null,
    });
    const savedPlan = await this.trainingPlansRepository.save(plan);
    await this.persistPlanExercises(savedPlan.id, data.exerciseIds);
    return this.getPlanById(savedPlan.id);
  }

  async updatePlan(id: string, data: UpdateTrainingPlanDto): Promise<TrainingPlan> {
    const plan = await this.trainingPlansRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const updated = this.trainingPlansRepository.merge(plan, {
      name: data.name ?? plan.name,
      description: data.description ?? plan.description,
      assignedDays: data.assignedDays ?? plan.assignedDays,
    });
    await this.trainingPlansRepository.save(updated);

    if (data.exerciseIds) {
      await this.replacePlanExercises(id, data.exerciseIds);
    }

    return this.getPlanById(id);
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.trainingPlansRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    await this.trainingPlansRepository.remove(plan);
  }

  async addPlanExercise(id: string, data: AddPlanExerciseDto): Promise<TrainingPlan> {
    await this.getPlanById(id);
    await this.getExerciseById(data.exerciseId);
    const existing = await this.trainingPlanExercisesRepository.findOne({
      where: { planId: id, exerciseId: data.exerciseId },
    });
    if (!existing) {
      const lastEntry = await this.trainingPlanExercisesRepository.findOne({
        where: { planId: id },
        order: { orderIndex: 'DESC' },
      });
      const orderIndex = lastEntry ? lastEntry.orderIndex + 1 : 0;
      const entry = this.trainingPlanExercisesRepository.create({
        planId: id,
        exerciseId: data.exerciseId,
        orderIndex,
      });
      await this.trainingPlanExercisesRepository.save(entry);
    }
    return this.getPlanById(id);
  }

  async removePlanExercise(id: string, exerciseId: string): Promise<TrainingPlan> {
    await this.getPlanById(id);
    const entry = await this.trainingPlanExercisesRepository.findOne({
      where: { planId: id, exerciseId },
    });
    if (entry) {
      await this.trainingPlanExercisesRepository.remove(entry);
      await this.reindexPlanExercises(id);
    }
    return this.getPlanById(id);
  }

  async reorderPlanExercises(id: string, data: ReorderPlanExercisesDto): Promise<TrainingPlan> {
    await this.getPlanById(id);
    const existingEntries = await this.trainingPlanExercisesRepository.find({
      where: { planId: id },
    });
    const existingIds = new Set(existingEntries.map((entry) => entry.exerciseId));
    const requestedIds = new Set(data.exerciseIds);

    if (existingIds.size !== requestedIds.size) {
      throw new ConflictException('Reorder payload must include all current plan exercises');
    }
    for (const exerciseId of requestedIds) {
      if (!existingIds.has(exerciseId)) {
        throw new ConflictException(`Exercise ${exerciseId} does not belong to this plan`);
      }
    }

    const updates = existingEntries.map((entry) => {
      const orderIndex = data.exerciseIds.indexOf(entry.exerciseId);
      return this.trainingPlanExercisesRepository.merge(entry, { orderIndex });
    });
    await this.trainingPlanExercisesRepository.save(updates);
    return this.getPlanById(id);
  }

  async getExerciseHistory(exerciseId: string): Promise<
    Array<{
      id: string;
      sessionId: string;
      sessionStartedAt: Date;
      exerciseId: string;
      exercise: Exercise;
      sets: WorkoutSet[];
    }>
  > {
    const exercise = await this.getExerciseById(exerciseId);
    const sets = await this.workoutSetsRepository.find({
      where: { exerciseId },
      relations: ['session', 'exercise'],
      order: { createdAt: 'DESC' },
    });

    const groupedBySession = new Map<string, WorkoutSet[]>();
    for (const set of sets) {
      if (set.session.status !== 'completed') {
        continue;
      }
      const current = groupedBySession.get(set.sessionId);
      if (current) {
        current.push(set);
      } else {
        groupedBySession.set(set.sessionId, [set]);
      }
    }

    return Array.from(groupedBySession.entries())
      .map(([sessionId, sessionSets]) => ({
        id: `${sessionId}-${exerciseId}`,
        sessionId,
        sessionStartedAt: sessionSets[0].session.startedAt,
        exerciseId,
        exercise,
        sets: sessionSets.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        ),
      }))
      .sort(
        (a, b) => b.sessionStartedAt.getTime() - a.sessionStartedAt.getTime(),
      );
  }

  async getRecentSessions(limit = 10): Promise<WorkoutSession[]> {
    return this.workoutSessionsRepository.find({
      where: { status: 'completed' },
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  async getExerciseProgress(
    exerciseId: string,
    period = 90,
    limit = 365,
  ): Promise<Array<{ date: Date; weight: number; reps: number; volume: number }>> {
    await this.getExerciseById(exerciseId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);
    const sets = await this.workoutSetsRepository.find({
      where: { exerciseId },
      relations: ['session'],
      order: { createdAt: 'ASC' },
    });
    const groupedBySession = new Map<
      string,
      { startedAt: Date; points: WorkoutSet[] }
    >();
    for (const set of sets) {
      if (set.session.status !== 'completed') {
        continue;
      }
      if (set.session.startedAt < cutoffDate) {
        continue;
      }
      const current = groupedBySession.get(set.sessionId);
      if (current) {
        current.points.push(set);
      } else {
        groupedBySession.set(set.sessionId, {
          startedAt: set.session.startedAt,
          points: [set],
        });
      }
    }
    return Array.from(groupedBySession.values())
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
      .slice(0, limit)
      .map((entry) => ({
        date: entry.startedAt,
        weight: Math.max(...entry.points.map((point) => Number(point.weight))),
        reps: Math.max(...entry.points.map((point) => point.reps)),
        volume: entry.points.reduce(
          (accumulator, point) =>
            accumulator +
            Number(point.weight ?? 0) * point.reps * point.sets,
          0,
        ),
      }));
  }

  private async persistPlanExercises(
    planId: string,
    exerciseIds: string[],
  ): Promise<void> {
    const uniqueExerciseIds = Array.from(new Set(exerciseIds));
    for (const exerciseId of uniqueExerciseIds) {
      await this.getExerciseById(exerciseId);
    }
    const entities = uniqueExerciseIds.map((exerciseId, index) =>
      this.trainingPlanExercisesRepository.create({
        planId,
        exerciseId,
        orderIndex: index,
      }),
    );
    await this.trainingPlanExercisesRepository.save(entities);
  }

  private async replacePlanExercises(
    planId: string,
    exerciseIds: string[],
  ): Promise<void> {
    const existing = await this.trainingPlanExercisesRepository.find({
      where: { planId },
    });
    if (existing.length > 0) {
      await this.trainingPlanExercisesRepository.remove(existing);
    }
    await this.persistPlanExercises(planId, exerciseIds);
  }

  private async reindexPlanExercises(planId: string): Promise<void> {
    const entries = await this.trainingPlanExercisesRepository.find({
      where: { planId },
      order: { orderIndex: 'ASC' },
    });
    const reindexed = entries.map((entry, index) =>
      this.trainingPlanExercisesRepository.merge(entry, { orderIndex: index }),
    );
    if (reindexed.length > 0) {
      await this.trainingPlanExercisesRepository.save(reindexed);
    }
  }

  private isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  private toPlanView(plan: TrainingPlan): TrainingPlan {
    const sortedExercises = [...plan.planExercises].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    const exerciseIds = sortedExercises.map((entry) => entry.exerciseId);
    const exercises = sortedExercises.map((entry) => entry.exercise);
    return {
      ...plan,
      exerciseIds,
      exercises,
    } as TrainingPlan & { exerciseIds: string[]; exercises: Exercise[] };
  }
}
