import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Exercise } from '../../entities/exercise.entity';
import { TrainingPlan } from '../../entities/training-plan.entity';
import { WorkoutSession } from '../../entities/workout-session.entity';
import { WorkoutSet } from '../../entities/workout-set.entity';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'exercise-1',
  name: 'Bench Press',
  category: 'chest',
  isCustom: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  sets: [],
  planExercises: [],
  ...overrides,
});

const makeSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
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
  sessionId: 'session-1',
  exerciseId: 'exercise-1',
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
  id: 'plan-1',
  name: 'Push Day',
  description: null,
  assignedDays: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  planExercises: [],
  ...overrides,
} as TrainingPlan);

describe('WorkoutsController', () => {
  let controller: WorkoutsController;
  let service: jest.Mocked<WorkoutsService>;

  beforeEach(async () => {
    const mockService = {
      getExercises: jest.fn(),
      getExerciseById: jest.fn(),
      createExercise: jest.fn(),
      updateExercise: jest.fn(),
      deleteExercise: jest.fn(),
      getActiveSession: jest.fn(),
      getSessions: jest.fn(),
      getSessionById: jest.fn(),
      createSession: jest.fn(),
      endSession: jest.fn(),
      abandonSession: jest.fn(),
      getSetsBySession: jest.fn(),
      addSet: jest.fn(),
      updateSet: jest.fn(),
      deleteSet: jest.fn(),
      getPlans: jest.fn(),
      getPlanById: jest.fn(),
      createPlan: jest.fn(),
      updatePlan: jest.fn(),
      deletePlan: jest.fn(),
      addPlanExercise: jest.fn(),
      removePlanExercise: jest.fn(),
      reorderPlanExercises: jest.fn(),
      getExerciseHistory: jest.fn(),
      getRecentSessions: jest.fn(),
      getExerciseProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutsController],
      providers: [
        {
          provide: WorkoutsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WorkoutsController>(WorkoutsController);
    service = module.get(WorkoutsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Exercise Endpoints', () => {
    describe('GET /workouts/exercises', () => {
      it('should return all exercises', async () => {
        const exercises = [makeExercise()];
        service.getExercises.mockResolvedValue(exercises);

        const result = await controller.getExercises();

        expect(result).toEqual(exercises);
        expect(service.getExercises).toHaveBeenCalledWith(undefined);
      });

      it('should search exercises with query', async () => {
        const exercises = [makeExercise({ name: 'Bench' })];
        service.getExercises.mockResolvedValue(exercises);

        await controller.getExercises('bench');

        expect(service.getExercises).toHaveBeenCalledWith('bench');
      });
    });

    describe('GET /workouts/exercises/:id', () => {
      it('should return an exercise by id', async () => {
        const exercise = makeExercise();
        service.getExerciseById.mockResolvedValue(exercise);

        const result = await controller.getExerciseById('exercise-1');

        expect(result).toEqual(exercise);
      });

      it('should throw NotFoundException for non-existent exercise', async () => {
        service.getExerciseById.mockRejectedValue(new NotFoundException());

        await expect(controller.getExerciseById('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('POST /workouts/exercises', () => {
      it('should create a new exercise', async () => {
        const dto = { name: 'New Exercise', category: 'chest' as const, isCustom: true };
        const exercise = makeExercise(dto);
        service.createExercise.mockResolvedValue(exercise);

        const result = await controller.createExercise(dto);

        expect(result).toEqual(exercise);
        expect(service.createExercise).toHaveBeenCalledWith(dto);
      });
    });

    describe('PATCH /workouts/exercises/:id', () => {
      it('should update an exercise', async () => {
        const dto = { name: 'Updated' };
        const exercise = makeExercise(dto);
        service.updateExercise.mockResolvedValue(exercise);

        const result = await controller.updateExercise('exercise-1', dto);

        expect(result).toEqual(exercise);
      });
    });

    describe('DELETE /workouts/exercises/:id', () => {
      it('should delete an exercise', async () => {
        service.deleteExercise.mockResolvedValue(undefined);

        await controller.deleteExercise('exercise-1');

        expect(service.deleteExercise).toHaveBeenCalledWith('exercise-1');
      });
    });
  });

  describe('Session Endpoints', () => {
    describe('GET /workouts/sessions/active', () => {
      it('should return active session', async () => {
        const session = makeSession();
        service.getActiveSession.mockResolvedValue(session);

        const result = await controller.getActiveSession();

        expect(result).toEqual(session);
      });

      it('should return null when no active session', async () => {
        service.getActiveSession.mockResolvedValue(null);

        const result = await controller.getActiveSession();

        expect(result).toBeNull();
      });
    });

    describe('GET /workouts/sessions', () => {
      it('should return all sessions', async () => {
        const sessions = [makeSession()];
        service.getSessions.mockResolvedValue(sessions);

        const result = await controller.getSessions();

        expect(result).toEqual(sessions);
      });
    });

    describe('GET /workouts/sessions/:id', () => {
      it('should return a session by id', async () => {
        const session = makeSession();
        service.getSessionById.mockResolvedValue(session);

        const result = await controller.getSessionById('session-1');

        expect(result).toEqual(session);
      });

      it('should throw NotFoundException for non-existent session', async () => {
        service.getSessionById.mockRejectedValue(new NotFoundException());

        await expect(controller.getSessionById('non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('POST /workouts/sessions', () => {
      it('should create a new session', async () => {
        const session = makeSession();
        service.createSession.mockResolvedValue(session);

        const result = await controller.createSession();

        expect(result.status).toBe('active');
      });

      it('should create a session with planId', async () => {
        const session = makeSession({ planId: 'plan-1' });
        service.createSession.mockResolvedValue(session);

        const result = await controller.createSession({ planId: 'plan-1' });

        expect(result.status).toBe('active');
        expect(result.planId).toBe('plan-1');
        expect(service.createSession).toHaveBeenCalledWith({ planId: 'plan-1' });
      });

      it('should throw ConflictException when active session exists', async () => {
        service.createSession.mockRejectedValue(new ConflictException());

        await expect(controller.createSession()).rejects.toThrow(ConflictException);
      });
    });

    describe('POST /workouts/sessions/:id/end', () => {
      it('should end a session', async () => {
        const session = makeSession({ status: 'completed', endedAt: new Date() });
        service.endSession.mockResolvedValue(session);

        const result = await controller.endSession('session-1');

        expect(result.status).toBe('completed');
        expect(result.endedAt).not.toBeNull();
      });

      it('should throw ConflictException for non-active session', async () => {
        service.endSession.mockRejectedValue(new ConflictException());

        await expect(controller.endSession('session-1')).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('POST /workouts/sessions/:id/abandon', () => {
      it('should abandon a session', async () => {
        const session = makeSession({ status: 'abandoned', endedAt: new Date() });
        service.abandonSession.mockResolvedValue(session);

        const result = await controller.abandonSession('session-1');

        expect(result.status).toBe('abandoned');
      });
    });
  });

  describe('Set Endpoints', () => {
    describe('GET /workouts/sessions/:sessionId/sets', () => {
      it('should return sets for a session', async () => {
        const sets = [makeSet()];
        service.getSetsBySession.mockResolvedValue(sets);

        const result = await controller.getSessionSets('session-1');

        expect(result).toEqual(sets);
      });
    });

    describe('POST /workouts/sessions/:sessionId/sets', () => {
      it('should add a set to a session', async () => {
        const dto = { exerciseId: 'exercise-1', reps: 10, weight: 100, weightUnit: 'kg' as const };
        const set = makeSet();
        service.addSet.mockResolvedValue(set);

        const result = await controller.addSet('session-1', dto);

        expect(result).toEqual(set);
        expect(service.addSet).toHaveBeenCalledWith('session-1', dto);
      });

      it('should add a set with null weight', async () => {
        const dto = { exerciseId: 'exercise-1', reps: 12, weight: null, weightUnit: 'kg' as const };
        const set = makeSet({ reps: 12, weight: null });
        service.addSet.mockResolvedValue(set);

        const result = await controller.addSet('session-1', dto);

        expect(result).toEqual(set);
        expect(service.addSet).toHaveBeenCalledWith('session-1', dto);
      });

      it('should throw ConflictException for non-active session', async () => {
        const dto = { exerciseId: 'exercise-1', reps: 10, weight: 100, weightUnit: 'kg' as const };
        service.addSet.mockRejectedValue(new ConflictException());

        await expect(controller.addSet('session-1', dto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('PATCH /workouts/sets/:id', () => {
      it('should update a set', async () => {
        const dto = { reps: 12 };
        const set = makeSet({ reps: 12 });
        service.updateSet.mockResolvedValue(set);

        const result = await controller.updateSet('set-1', dto);

        expect(result.reps).toBe(12);
      });
    });

    describe('DELETE /workouts/sets/:id', () => {
      it('should delete a set', async () => {
        service.deleteSet.mockResolvedValue(undefined);

        await controller.deleteSet('set-1');

        expect(service.deleteSet).toHaveBeenCalledWith('set-1');
      });
    });
  });

  describe('Plan Endpoints', () => {
    describe('GET /workouts/plans', () => {
      it('should return all plans', async () => {
        const plans = [makePlan()];
        service.getPlans.mockResolvedValue(plans);

        const result = await controller.getPlans();

        expect(result).toEqual(plans);
      });
    });

    describe('GET /workouts/plans/:id', () => {
      it('should return a plan by id', async () => {
        const plan = makePlan();
        service.getPlanById.mockResolvedValue(plan);

        const result = await controller.getPlanById('plan-1');

        expect(result).toEqual(plan);
      });
    });

    describe('POST /workouts/plans', () => {
      it('should create a new plan', async () => {
        const dto = { name: 'Push Day', exerciseIds: ['exercise-1'] };
        const plan = makePlan();
        service.createPlan.mockResolvedValue(plan);

        const result = await controller.createPlan(dto);

        expect(result).toEqual(plan);
      });
    });

    describe('PATCH /workouts/plans/:id', () => {
      it('should update a plan', async () => {
        const dto = { name: 'Updated' };
        const plan = makePlan(dto);
        service.updatePlan.mockResolvedValue(plan);

        const result = await controller.updatePlan('plan-1', dto);

        expect(result.name).toBe('Updated');
      });
    });

    describe('DELETE /workouts/plans/:id', () => {
      it('should delete a plan', async () => {
        service.deletePlan.mockResolvedValue(undefined);

        await controller.deletePlan('plan-1');

        expect(service.deletePlan).toHaveBeenCalledWith('plan-1');
      });
    });

    describe('POST /workouts/plans/:id/exercises', () => {
      it('should add an exercise to a plan', async () => {
        const dto = { exerciseId: 'exercise-1' };
        const plan = makePlan();
        service.addPlanExercise.mockResolvedValue(plan);

        const result = await controller.addPlanExercise('plan-1', dto);

        expect(result).toEqual(plan);
      });
    });

    describe('DELETE /workouts/plans/:id/exercises/:exerciseId', () => {
      it('should remove an exercise from a plan', async () => {
        const plan = makePlan();
        service.removePlanExercise.mockResolvedValue(plan);

        const result = await controller.removePlanExercise('plan-1', 'exercise-1');

        expect(result).toEqual(plan);
      });
    });

    describe('PUT /workouts/plans/:id/exercises/reorder', () => {
      it('should reorder plan exercises', async () => {
        const dto = { exerciseIds: ['exercise-2', 'exercise-1'] };
        const plan = makePlan();
        service.reorderPlanExercises.mockResolvedValue(plan);

        const result = await controller.reorderPlanExercises('plan-1', dto);

        expect(result).toEqual(plan);
      });

      it('should throw ConflictException for invalid reorder', async () => {
        const dto = { exerciseIds: ['invalid'] };
        service.reorderPlanExercises.mockRejectedValue(new ConflictException());

        await expect(
          controller.reorderPlanExercises('plan-1', dto),
        ).rejects.toThrow(ConflictException);
      });
    });
  });

  describe('History and Graph Endpoints', () => {
    describe('GET /workouts/history/:exerciseId', () => {
      it('should return exercise history', async () => {
        const history = [
          {
            id: 'session-1-exercise-1',
            sessionId: 'session-1',
            sessionStartedAt: new Date(),
            exerciseId: 'exercise-1',
            exercise: makeExercise(),
            sets: [makeSet()],
          },
        ];
        service.getExerciseHistory.mockResolvedValue(history);

        const result = await controller.getExerciseHistory('exercise-1');

        expect(result).toEqual(history);
      });
    });

    describe('GET /workouts/history/recent-sessions', () => {
      it('should return recent sessions with default limit', async () => {
        const sessions = [makeSession({ status: 'completed' })];
        service.getRecentSessions.mockResolvedValue(sessions);

        await controller.getRecentSessions();

        expect(service.getRecentSessions).toHaveBeenCalledWith(undefined);
      });

      it('should return recent sessions with custom limit', async () => {
        const sessions = [makeSession({ status: 'completed' })];
        service.getRecentSessions.mockResolvedValue(sessions);

        await controller.getRecentSessions(5);

        expect(service.getRecentSessions).toHaveBeenCalledWith(5);
      });
    });

    describe('GET /workouts/graphs/:exerciseId', () => {
      it('should return exercise progress with default params', async () => {
        const progress = [{ date: new Date(), weight: 100, reps: 10, volume: 1000 }];
        service.getExerciseProgress.mockResolvedValue(progress);

        await controller.getExerciseProgress('exercise-1');

        expect(service.getExerciseProgress).toHaveBeenCalledWith('exercise-1', undefined, undefined);
      });

      it('should return exercise progress with custom params', async () => {
        const progress = [{ date: new Date(), weight: 100, reps: 10, volume: 1000 }];
        service.getExerciseProgress.mockResolvedValue(progress);

        await controller.getExerciseProgress('exercise-1', 30, 50);

        expect(service.getExerciseProgress).toHaveBeenCalledWith('exercise-1', 30, 50);
      });
    });
  });
});