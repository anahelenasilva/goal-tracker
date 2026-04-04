import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { Exercise } from '../../entities/exercise.entity';
import { TrainingPlanExercise } from '../../entities/training-plan-exercise.entity';
import { TrainingPlan } from '../../entities/training-plan.entity';
import { WorkoutSession } from '../../entities/workout-session.entity';
import { WorkoutSet } from '../../entities/workout-set.entity';
import { WorkoutsService } from './workouts.service';

const EXERCISE_ID = '11111111-1111-1111-1111-111111111111';
const EXERCISE_ID_2 = '22222222-2222-2222-2222-222222222222';
const SESSION_ID = '33333333-3333-3333-3333-333333333333';
const PLAN_ID = '55555555-5555-5555-5555-555555555555';
const PLAN_EXERCISE_ID = '66666666-6666-6666-6666-666666666666';
const PLAN_EXERCISE_ID_2 = '77777777-7777-7777-7777-777777777777';

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: EXERCISE_ID,
  name: 'Bench Press',
  namePt: 'Supino',
  category: 'chest',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  sets: [],
  planExercises: [],
  ...overrides,
});

const makeSession = (
  overrides: Partial<WorkoutSession> = {},
): WorkoutSession => ({
  id: SESSION_ID,
  status: 'active',
  startedAt: new Date(),
  endedAt: null,
  planId: null,
  plan: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  sets: [],
  ...overrides,
});

const makeSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 'set-1',
  sessionId: SESSION_ID,
  exerciseId: EXERCISE_ID,
  reps: 10,
  sets: 1,
  weight: 100,
  weightUnit: 'kg',
  notes: null,
  createdAt: new Date(),
  session: makeSession(),
  exercise: makeExercise(),
  ...overrides,
});

const makePlan = (overrides: Partial<TrainingPlan> = {}): TrainingPlan => ({
  id: PLAN_ID,
  name: 'Push Day',
  description: null,
  assignedDays: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  planExercises: [],
  ...overrides,
});

describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let exercisesRepository: MockProxy<Repository<Exercise>>;
  let workoutSessionsRepository: MockProxy<Repository<WorkoutSession>>;
  let workoutSetsRepository: MockProxy<Repository<WorkoutSet>>;
  let trainingPlansRepository: MockProxy<Repository<TrainingPlan>>;
  let trainingPlanExercisesRepository: MockProxy<Repository<TrainingPlanExercise>>;

  beforeEach(async () => {
    exercisesRepository = mock<Repository<Exercise>>();
    workoutSessionsRepository = mock<Repository<WorkoutSession>>();
    workoutSetsRepository = mock<Repository<WorkoutSet>>();
    trainingPlansRepository = mock<Repository<TrainingPlan>>();
    trainingPlanExercisesRepository = mock<Repository<TrainingPlanExercise>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        {
          provide: getRepositoryToken(Exercise),
          useValue: exercisesRepository,
        },
        {
          provide: getRepositoryToken(WorkoutSession),
          useValue: workoutSessionsRepository,
        },
        {
          provide: getRepositoryToken(WorkoutSet),
          useValue: workoutSetsRepository,
        },
        {
          provide: getRepositoryToken(TrainingPlan),
          useValue: trainingPlansRepository,
        },
        {
          provide: getRepositoryToken(TrainingPlanExercise),
          useValue: trainingPlanExercisesRepository,
        },
      ],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Session Lifecycle', () => {
    describe('createSession', () => {
      it('should create a new active session when no active session exists', async () => {
        workoutSessionsRepository.findOne.mockResolvedValue(null);
        const newSession = makeSession();
        workoutSessionsRepository.create.mockReturnValue(newSession);
        workoutSessionsRepository.save.mockResolvedValue(newSession);

        const result = await service.createSession();

        expect(result.status).toBe('active');
        expect(result.endedAt).toBeNull();
        expect(workoutSessionsRepository.findOne).toHaveBeenCalledWith({
          where: { status: 'active' },
          relations: ['plan', 'plan.planExercises', 'plan.planExercises.exercise'],
          order: { startedAt: 'DESC' },
        });
      });

      it('should create a session with a planId', async () => {
        workoutSessionsRepository.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(makeSession({ planId: PLAN_ID }));
        const plan = makePlan();
        trainingPlansRepository.findOne.mockResolvedValue(plan);
        const newSession = makeSession({ planId: PLAN_ID });
        workoutSessionsRepository.create.mockReturnValue(newSession);
        workoutSessionsRepository.save.mockResolvedValue(newSession);

        const result = await service.createSession({ planId: PLAN_ID });

        expect(result.planId).toBe(PLAN_ID);
      });

      it('should throw NotFoundException when planId does not exist', async () => {
        workoutSessionsRepository.findOne.mockResolvedValue(null);
        trainingPlansRepository.findOne.mockResolvedValue(null);

        await expect(
          service.createSession({ planId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ConflictException when an active session already exists', async () => {
        const existingSession = makeSession({ status: 'active' });
        workoutSessionsRepository.findOne.mockResolvedValue(existingSession);

        await expect(service.createSession()).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('endSession', () => {
      it('should end an active session', async () => {
        const session = makeSession({ status: 'active' });
        workoutSessionsRepository.findOne.mockResolvedValue(session);
        workoutSessionsRepository.save.mockResolvedValue({
          ...session,
          status: 'completed',
          endedAt: new Date(),
        });

        const result = await service.endSession(SESSION_ID);

        expect(result.status).toBe('completed');
        expect(result.endedAt).not.toBeNull();
      });

      it('should throw NotFoundException when session does not exist', async () => {
        workoutSessionsRepository.findOne.mockResolvedValue(null);

        await expect(service.endSession('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw ConflictException when trying to end a completed session', async () => {
        const session = makeSession({ status: 'completed', endedAt: new Date() });
        workoutSessionsRepository.findOne.mockResolvedValue(session);

        await expect(service.endSession(SESSION_ID)).rejects.toThrow(
          ConflictException,
        );
      });

      it('should throw ConflictException when trying to end an abandoned session', async () => {
        const session = makeSession({ status: 'abandoned', endedAt: new Date() });
        workoutSessionsRepository.findOne.mockResolvedValue(session);

        await expect(service.endSession(SESSION_ID)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('abandonSession', () => {
      it('should abandon an active session', async () => {
        const session = makeSession({ status: 'active' });
        workoutSessionsRepository.findOne.mockResolvedValue(session);
        workoutSessionsRepository.save.mockResolvedValue({
          ...session,
          status: 'abandoned',
          endedAt: new Date(),
        });

        const result = await service.abandonSession(SESSION_ID);

        expect(result.status).toBe('abandoned');
        expect(result.endedAt).not.toBeNull();
      });

      it('should throw ConflictException when trying to abandon a completed session', async () => {
        const session = makeSession({ status: 'completed', endedAt: new Date() });
        workoutSessionsRepository.findOne.mockResolvedValue(session);

        await expect(service.abandonSession(SESSION_ID)).rejects.toThrow(
          ConflictException,
        );
      });
    });
  });

  describe('Set Logging', () => {
    describe('addSet', () => {
      it('should add a set to an active session', async () => {
        const session = makeSession({ status: 'active' });
        const exercise = makeExercise();
        workoutSessionsRepository.findOne.mockResolvedValue(session);
        exercisesRepository.findOne.mockResolvedValue(exercise);

        const newSet = makeSet();
        const setWithExercise = { ...newSet, exercise };
        workoutSetsRepository.create.mockReturnValue(newSet);
        workoutSetsRepository.save.mockResolvedValue(newSet);
        workoutSetsRepository.findOne.mockResolvedValue(setWithExercise);

        const result = await service.addSet(SESSION_ID, {
          exerciseId: EXERCISE_ID,
          reps: 10,
          weight: 100,
          weightUnit: 'kg',
        });

        expect(result).toEqual(setWithExercise);
        expect(workoutSetsRepository.findOne).toHaveBeenCalledWith({
          where: { id: newSet.id },
          relations: ['exercise'],
        });
      });

      it('should add a set with null weight', async () => {
        const session = makeSession({ status: 'active' });
        const exercise = makeExercise();
        workoutSessionsRepository.findOne.mockResolvedValue(session);
        exercisesRepository.findOne.mockResolvedValue(exercise);

        const newSet = makeSet({ weight: null });
        const setWithExercise = { ...newSet, exercise };
        workoutSetsRepository.create.mockReturnValue(newSet);
        workoutSetsRepository.save.mockResolvedValue(newSet);
        workoutSetsRepository.findOne.mockResolvedValue(setWithExercise);

        const result = await service.addSet(SESSION_ID, {
          exerciseId: EXERCISE_ID,
          reps: 12,
          weight: null,
          weightUnit: 'kg',
        });

        expect(result.weight).toBeNull();
        expect(workoutSetsRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            exerciseId: EXERCISE_ID,
            reps: 12,
            weight: null,
            weightUnit: 'kg',
          }),
        );
      });

      it('should throw NotFoundException when session does not exist', async () => {
        workoutSessionsRepository.findOne.mockResolvedValue(null);

        await expect(
          service.addSet('non-existent', {
            exerciseId: EXERCISE_ID,
            reps: 10,
            weight: 100,
            weightUnit: 'kg',
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ConflictException when adding set to an abandoned session', async () => {
        const session = makeSession({ status: 'abandoned', endedAt: new Date() });
        workoutSessionsRepository.findOne.mockResolvedValue(session);
        exercisesRepository.findOne.mockResolvedValue(makeExercise());

        await expect(
          service.addSet(SESSION_ID, {
            exerciseId: EXERCISE_ID,
            reps: 10,
            weight: 100,
            weightUnit: 'kg',
          }),
        ).rejects.toThrow(ConflictException);
      });

      it('should throw ConflictException when adding set to a completed session', async () => {
        const session = makeSession({ status: 'completed', endedAt: new Date() });
        const exercise = makeExercise();
        workoutSessionsRepository.findOne.mockResolvedValue(session);
        exercisesRepository.findOne.mockResolvedValue(exercise);

        await expect(
          service.addSet(SESSION_ID, {
            exerciseId: EXERCISE_ID,
            reps: 10,
            weight: 100,
            weightUnit: 'kg',
          }),
        ).rejects.toThrow(ConflictException);
      });

      it('should throw NotFoundException when exercise does not exist', async () => {
        const session = makeSession({ status: 'active' });
        workoutSessionsRepository.findOne.mockResolvedValue(session);
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(
          service.addSet(SESSION_ID, {
            exerciseId: 'non-existent',
            reps: 10,
            weight: 100,
            weightUnit: 'kg',
          }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateSet', () => {
      it('should update an existing set', async () => {
        const existingSet = makeSet();
        workoutSetsRepository.findOne.mockResolvedValue(existingSet);
        exercisesRepository.findOne.mockResolvedValue(existingSet.exercise);
        workoutSetsRepository.merge.mockReturnValue({
          ...existingSet,
          reps: 12,
        });
        workoutSetsRepository.save.mockResolvedValue({
          ...existingSet,
          reps: 12,
        });

        await service.updateSet('set-1', { reps: 12 });

        expect(workoutSetsRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'set-1' },
          relations: ['exercise'],
        });
      });

      it('should throw NotFoundException when set does not exist', async () => {
        workoutSetsRepository.findOne.mockResolvedValue(null);

        await expect(
          service.updateSet('non-existent', { reps: 12 }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when new exerciseId does not exist', async () => {
        const existingSet = makeSet();
        workoutSetsRepository.findOne.mockResolvedValue(existingSet);
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(
          service.updateSet('set-1', { exerciseId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteSet', () => {
      it('should delete an existing set', async () => {
        const session = makeSession({ status: 'active' });
        const existingSet = makeSet({ session });
        workoutSetsRepository.findOne.mockResolvedValue(existingSet);
        workoutSetsRepository.remove.mockResolvedValue(existingSet);

        await service.deleteSet('set-1');

        expect(workoutSetsRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'set-1' },
          relations: ['session'],
        });
        expect(workoutSetsRepository.remove).toHaveBeenCalledWith(existingSet);
      });

      it('should throw NotFoundException when set does not exist', async () => {
        workoutSetsRepository.findOne.mockResolvedValue(null);

        await expect(service.deleteSet('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw ConflictException when deleting set from an abandoned session', async () => {
        const session = makeSession({ status: 'abandoned', endedAt: new Date() });
        const existingSet = makeSet({ session });
        workoutSetsRepository.findOne.mockResolvedValue(existingSet);

        await expect(service.deleteSet('set-1')).rejects.toThrow(
          ConflictException,
        );
      });
    });
  });

  describe('Exercise CRUD', () => {
    describe('getExercises', () => {
      it('should return all exercises ordered by name', async () => {
        const exercises = [
          makeExercise({ id: '1', name: 'Bench Press' }),
          makeExercise({ id: '2', name: 'Deadlift' }),
        ];
        exercisesRepository.find.mockResolvedValue(exercises);

        const result = await service.getExercises();

        expect(exercisesRepository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
        expect(result).toEqual(exercises);
      });

      it('should search exercises case-insensitively', async () => {
        const exercises = [makeExercise({ name: 'BENCH PRESS' })];
        exercisesRepository.createQueryBuilder.mockReturnValue({
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(exercises),
        } as unknown as ReturnType<typeof exercisesRepository.createQueryBuilder>);

        const result = await service.getExercises('bench');

        expect(exercisesRepository.createQueryBuilder).toHaveBeenCalledWith('exercise');
        expect(result).toEqual(exercises);
      });
    });

    describe('getExerciseById', () => {
      it('should return an exercise by id', async () => {
        const exercise = makeExercise();
        exercisesRepository.findOne.mockResolvedValue(exercise);

        const result = await service.getExerciseById(EXERCISE_ID);

        expect(result).toEqual(exercise);
      });

      it('should throw NotFoundException when exercise does not exist', async () => {
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(service.getExerciseById('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('createExercise', () => {
      it('should create and return a new exercise', async () => {
        const dto = { name: 'New Exercise', namePt: 'Nova Exercício', category: 'chest' as const, isCustom: true };
        const exercise = makeExercise(dto);
        exercisesRepository.create.mockReturnValue(exercise);
        exercisesRepository.save.mockResolvedValue(exercise);

        const result = await service.createExercise(dto);

        expect(exercisesRepository.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual(exercise);
      });
    });

    describe('updateExercise', () => {
      it('should update and return the exercise', async () => {
        const exercise = makeExercise();
        const updated = { ...exercise, name: 'Updated Name' };
        exercisesRepository.findOne.mockResolvedValue(exercise);
        exercisesRepository.merge.mockReturnValue(updated);
        exercisesRepository.save.mockResolvedValue(updated);

        const result = await service.updateExercise(EXERCISE_ID, { name: 'Updated Name' });

        expect(result.name).toBe('Updated Name');
      });

      it('should throw NotFoundException when exercise does not exist', async () => {
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(
          service.updateExercise('non-existent', { name: 'Updated' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteExercise', () => {
      it('should delete an existing exercise', async () => {
        const exercise = makeExercise();
        exercisesRepository.findOne.mockResolvedValue(exercise);
        exercisesRepository.remove.mockResolvedValue(exercise);

        await service.deleteExercise(EXERCISE_ID);

        expect(exercisesRepository.remove).toHaveBeenCalledWith(exercise);
      });

      it('should throw NotFoundException when exercise does not exist', async () => {
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(service.deleteExercise('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('Training Plans', () => {
    type PlanView = TrainingPlan & { exerciseIds: string[]; exercises: Exercise[] };

    describe('getPlans', () => {
      it('should return all plans with exerciseIds and exercises arrays', async () => {
        const plan = makePlan({ planExercises: [] });
        trainingPlansRepository.find.mockResolvedValue([plan]);

        const result = await service.getPlans() as PlanView[];

        expect(result[0].exerciseIds).toEqual([]);
        expect(result[0].exercises).toEqual([]);
      });
    });

    describe('getPlanById', () => {
      it('should return a plan by id with exerciseIds and exercises arrays', async () => {
        const plan = makePlan();
        trainingPlansRepository.findOne.mockResolvedValue(plan);

        const result = await service.getPlanById(PLAN_ID) as PlanView;

        expect(result.id).toBe(PLAN_ID);
        expect(result.name).toBe('Push Day');
        expect(result.exerciseIds).toEqual([]);
        expect(result.exercises).toEqual([]);
      });

      it('should throw NotFoundException when plan does not exist', async () => {
        trainingPlansRepository.findOne.mockResolvedValue(null);

        await expect(service.getPlanById('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('createPlan', () => {
      it('should create a plan with exercises', async () => {
        const plan = makePlan();
        const exercise = makeExercise();
        trainingPlansRepository.create.mockReturnValue(plan);
        trainingPlansRepository.save.mockResolvedValue(plan);
        trainingPlansRepository.findOne.mockResolvedValue({ ...plan, planExercises: [] });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        const planExerciseEntry = {
          id: PLAN_EXERCISE_ID,
          planId: PLAN_ID,
          exerciseId: EXERCISE_ID,
          orderIndex: 0,
          plan: plan,
          exercise: exercise,
        } as TrainingPlanExercise;
        trainingPlanExercisesRepository.create.mockReturnValue(planExerciseEntry);
        (trainingPlanExercisesRepository.save as jest.Mock).mockResolvedValue([planExerciseEntry]);

        const result = await service.createPlan({
          name: 'Push Day',
          exerciseIds: [EXERCISE_ID],
        }) as PlanView;

        expect(result.name).toBe('Push Day');
      });

      it('should throw NotFoundException when exercise does not exist during create', async () => {
        const plan = makePlan();
        trainingPlansRepository.create.mockReturnValue(plan);
        trainingPlansRepository.save.mockResolvedValue(plan);
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(
          service.createPlan({ name: 'Push Day', exerciseIds: ['non-existent'] }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('updatePlan', () => {
      it('should update plan properties', async () => {
        const plan = makePlan();
        const updatedPlan = { ...plan, name: 'Updated', planExercises: [] };
        trainingPlansRepository.findOne
          .mockResolvedValueOnce(plan)
          .mockResolvedValueOnce(updatedPlan);
        trainingPlansRepository.merge.mockReturnValue(updatedPlan);
        trainingPlansRepository.save.mockResolvedValue(updatedPlan);

        const result = await service.updatePlan(PLAN_ID, { name: 'Updated' }) as PlanView;

        expect(result.name).toBe('Updated');
      });

      it('should throw NotFoundException when plan does not exist', async () => {
        trainingPlansRepository.findOne.mockResolvedValue(null);

        await expect(
          service.updatePlan('non-existent', { name: 'Updated' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('deletePlan', () => {
      it('should delete an existing plan', async () => {
        const plan = makePlan();
        trainingPlansRepository.findOne.mockResolvedValue(plan);
        trainingPlansRepository.remove.mockResolvedValue(plan);

        await service.deletePlan(PLAN_ID);

        expect(trainingPlansRepository.remove).toHaveBeenCalledWith(plan);
      });

      it('should throw NotFoundException when plan does not exist', async () => {
        trainingPlansRepository.findOne.mockResolvedValue(null);

        await expect(service.deletePlan('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('addPlanExercise', () => {
      it('should add an exercise to a plan', async () => {
        const plan = makePlan();
        const exercise = makeExercise();
        trainingPlansRepository.findOne.mockResolvedValue({ ...plan, planExercises: [] });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        trainingPlanExercisesRepository.findOne.mockResolvedValue(null);
        const planExerciseEntry = {
          id: PLAN_EXERCISE_ID,
          planId: PLAN_ID,
          exerciseId: EXERCISE_ID,
          orderIndex: 0,
          plan: plan,
          exercise: exercise,
        } as TrainingPlanExercise;
        trainingPlanExercisesRepository.create.mockReturnValue(planExerciseEntry);
        trainingPlanExercisesRepository.save.mockResolvedValue(planExerciseEntry);

        await service.addPlanExercise(PLAN_ID, { exerciseId: EXERCISE_ID });

        expect(trainingPlanExercisesRepository.save).toHaveBeenCalled();
      });

      it('should throw NotFoundException when plan does not exist', async () => {
        trainingPlansRepository.findOne.mockResolvedValue(null);

        await expect(
          service.addPlanExercise('non-existent', { exerciseId: EXERCISE_ID }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when exercise does not exist', async () => {
        const plan = makePlan();
        trainingPlansRepository.findOne.mockResolvedValue({ ...plan, planExercises: [] });
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(
          service.addPlanExercise(PLAN_ID, { exerciseId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('removePlanExercise', () => {
      it('should remove an exercise from a plan and reindex', async () => {
        const plan = makePlan();
        const exercise = makeExercise();
        const entry = {
          id: PLAN_EXERCISE_ID,
          planId: PLAN_ID,
          exerciseId: EXERCISE_ID,
          orderIndex: 0,
          plan: plan,
          exercise: exercise,
        } as TrainingPlanExercise;
        trainingPlansRepository.findOne.mockResolvedValue({ ...plan, planExercises: [] });
        trainingPlanExercisesRepository.findOne.mockResolvedValue(entry);
        trainingPlanExercisesRepository.remove.mockResolvedValue(entry);
        trainingPlanExercisesRepository.find.mockResolvedValue([]);
        (trainingPlanExercisesRepository.save as jest.Mock).mockResolvedValue([]);

        await service.removePlanExercise(PLAN_ID, EXERCISE_ID);

        expect(trainingPlanExercisesRepository.remove).toHaveBeenCalledWith(entry);
      });
    });

    describe('reorderPlanExercises', () => {
      it('should reorder exercises in a plan', async () => {
        const plan = makePlan();
        const exercise1 = makeExercise({ id: EXERCISE_ID });
        const exercise2 = makeExercise({ id: EXERCISE_ID_2 });
        const entries = [
          { id: PLAN_EXERCISE_ID, planId: PLAN_ID, exerciseId: EXERCISE_ID, orderIndex: 0, plan, exercise: exercise1 },
          { id: PLAN_EXERCISE_ID_2, planId: PLAN_ID, exerciseId: EXERCISE_ID_2, orderIndex: 1, plan, exercise: exercise2 },
        ] as TrainingPlanExercise[];
        trainingPlansRepository.findOne.mockResolvedValue({ ...plan, planExercises: [] });
        trainingPlanExercisesRepository.find.mockResolvedValue(entries);
        trainingPlanExercisesRepository.merge.mockImplementation((entry, data) => ({
          ...entry,
          ...data,
        }) as TrainingPlanExercise);
        (trainingPlanExercisesRepository.save as jest.Mock).mockResolvedValue(entries);

        await service.reorderPlanExercises(PLAN_ID, {
          exerciseIds: [EXERCISE_ID_2, EXERCISE_ID],
        });

        expect(trainingPlanExercisesRepository.save).toHaveBeenCalled();
      });

      it('should throw ConflictException when exerciseIds count mismatches', async () => {
        const plan = makePlan();
        const exercise = makeExercise();
        const entries = [{ id: PLAN_EXERCISE_ID, planId: PLAN_ID, exerciseId: EXERCISE_ID, orderIndex: 0, plan, exercise }] as TrainingPlanExercise[];
        trainingPlansRepository.findOne.mockResolvedValue({ ...plan, planExercises: [] });
        trainingPlanExercisesRepository.find.mockResolvedValue(entries);

        await expect(
          service.reorderPlanExercises(PLAN_ID, {
            exerciseIds: [EXERCISE_ID, EXERCISE_ID_2],
          }),
        ).rejects.toThrow(ConflictException);
      });

      it('should throw ConflictException when exerciseId not in plan', async () => {
        const plan = makePlan();
        const exercise = makeExercise();
        const entries = [{ id: PLAN_EXERCISE_ID, planId: PLAN_ID, exerciseId: EXERCISE_ID, orderIndex: 0, plan, exercise }] as TrainingPlanExercise[];
        trainingPlansRepository.findOne.mockResolvedValue({ ...plan, planExercises: [] });
        trainingPlanExercisesRepository.find.mockResolvedValue(entries);

        await expect(
          service.reorderPlanExercises(PLAN_ID, { exerciseIds: ['non-existent'] }),
        ).rejects.toThrow(ConflictException);
      });
    });
  });

  describe('History and Graphs', () => {
    describe('getExerciseHistory', () => {
      it('should return exercise history grouped by session', async () => {
        const exercise = makeExercise();
        const session = makeSession({ status: 'completed' });
        const set = makeSet({ session, exercise });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        workoutSetsRepository.find.mockResolvedValue([set]);

        const result = await service.getExerciseHistory(EXERCISE_ID);

        expect(result).toHaveLength(1);
        expect(result[0].exerciseId).toBe(EXERCISE_ID);
        expect(result[0].sets).toHaveLength(1);
      });

      it('should only include sets from completed sessions', async () => {
        const exercise = makeExercise();
        const activeSession = makeSession({ status: 'active' });
        const completedSession = makeSession({ status: 'completed' });
        const setActive = makeSet({ session: activeSession, exercise });
        const setCompleted = makeSet({ session: completedSession, exercise, sessionId: 'session-2' });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        workoutSetsRepository.find.mockResolvedValue([setActive, setCompleted]);

        const result = await service.getExerciseHistory(EXERCISE_ID);

        expect(result).toHaveLength(1);
        expect(result[0].sessionId).toBe('session-2');
      });

      it('should throw NotFoundException when exercise does not exist', async () => {
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(service.getExerciseHistory('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('getRecentSessions', () => {
      it('should return recent completed sessions', async () => {
        const sessions = [makeSession({ status: 'completed' })];
        workoutSessionsRepository.find.mockResolvedValue(sessions);

        const result = await service.getRecentSessions(10);

        expect(workoutSessionsRepository.find).toHaveBeenCalledWith({
          where: { status: 'completed' },
          order: { startedAt: 'DESC' },
          take: 10,
        });
        expect(result).toEqual(sessions);
      });

      it('should use default limit of 10', async () => {
        workoutSessionsRepository.find.mockResolvedValue([]);

        await service.getRecentSessions();

        expect(workoutSessionsRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({ take: 10 }),
        );
      });
    });

    describe('getExerciseProgress', () => {
      it('should compute progress points for graph', async () => {
        const exercise = makeExercise();
        const session = makeSession({ status: 'completed', startedAt: new Date() });
        const set = makeSet({ session, exercise, weight: 100, reps: 10 });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        workoutSetsRepository.find.mockResolvedValue([set]);

        const result = await service.getExerciseProgress(EXERCISE_ID);

        expect(result).toHaveLength(1);
        expect(result[0].weight).toBe(100);
        expect(result[0].reps).toBe(10);
        expect(result[0].volume).toBe(1000);
      });

      it('should apply sets multiplier to volume calculation', async () => {
        const exercise = makeExercise();
        const session = makeSession({ status: 'completed', startedAt: new Date() });
        const workoutSet = makeSet({
          session,
          exercise,
          weight: 100,
          reps: 10,
          sets: 3,
        });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        workoutSetsRepository.find.mockResolvedValue([workoutSet]);

        const result = await service.getExerciseProgress(exercise.id);

        expect(workoutSetsRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({ where: { exerciseId: exercise.id } }),
        );
        expect(result).toHaveLength(1);
        expect(result[0].volume).toBe(100 * 10 * 3);
      });

      it('should produce different volumes for different sets counts', async () => {
        const exercise = makeExercise();
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        const sessionA = makeSession({ id: 'session-a', status: 'completed', startedAt: twoDaysAgo });
        const sessionB = makeSession({ id: 'session-b', status: 'completed', startedAt: oneDayAgo });
        const singleSet = makeSet({ id: 'set-a', session: sessionA, exercise, sessionId: 'session-a', weight: 100, reps: 10, sets: 1 });
        const tripleSet = makeSet({ id: 'set-b', session: sessionB, exercise, sessionId: 'session-b', weight: 100, reps: 10, sets: 3 });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        workoutSetsRepository.find.mockResolvedValue([singleSet, tripleSet]);

        const result = await service.getExerciseProgress(exercise.id);

        expect(result).toHaveLength(2);
        expect(result[0].volume).toBe(100 * 10 * 1);
        expect(result[1].volume).toBe(100 * 10 * 3);
      });

      it('should treat null weight as zero in progress calculations', async () => {
        const exercise = makeExercise();
        const session = makeSession({ status: 'completed', startedAt: new Date() });
        const bodyweightSet = makeSet({
          id: 'set-1',
          session,
          exercise,
          sessionId: session.id,
          reps: 15,
          weight: null,
        });
        const weightedSet = makeSet({
          id: 'set-2',
          session,
          exercise,
          sessionId: session.id,
          reps: 8,
          weight: 80,
        });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        workoutSetsRepository.find.mockResolvedValue([bodyweightSet, weightedSet]);

        const result = await service.getExerciseProgress(EXERCISE_ID);

        expect(result).toHaveLength(1);
        expect(result[0].weight).toBe(80);
        expect(result[0].reps).toBe(15);
        expect(result[0].volume).toBe(640);
      });

      it('should only include sets from completed sessions within period', async () => {
        const exercise = makeExercise();
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 200);
        const oldSession = makeSession({ status: 'completed', startedAt: oldDate });
        const recentSession = makeSession({ status: 'completed' });
        const oldSet = makeSet({ session: oldSession, exercise, sessionId: 'old-session' });
        const recentSet = makeSet({ session: recentSession, exercise, sessionId: 'recent-session' });
        exercisesRepository.findOne.mockResolvedValue(exercise);
        workoutSetsRepository.find.mockResolvedValue([oldSet, recentSet]);

        const result = await service.getExerciseProgress(EXERCISE_ID, 90);

        expect(result).toHaveLength(1);
        expect(result[0].date).toEqual(recentSession.startedAt);
      });

      it('should throw NotFoundException when exercise does not exist', async () => {
        exercisesRepository.findOne.mockResolvedValue(null);

        await expect(service.getExerciseProgress('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
