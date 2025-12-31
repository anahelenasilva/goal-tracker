import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { makeGoal } from '../../../test/mocks/mocks';
import { GoalEntry } from '../../entities/goal-entry.entity';
import { Goal } from '../../entities/goal.entity';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

describe('GoalsController', () => {
  let controller: GoalsController;
  let service: MockProxy<GoalsService>;

  beforeEach(async () => {
    service = mock<GoalsService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [
        {
          provide: GoalsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<GoalsController>(GoalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of goals', async () => {
      const goals: Goal[] = [
        { ...makeGoal() },
      ];

      service.findAll.mockResolvedValue(goals);

      const result = await controller.findAll();

      expect(result).toEqual(goals);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a goal by id', async () => {
      const goal: Goal = {
        id: '1',
        userId: 'user1',
        title: 'exercise',
        createdAt: new Date(),
        user: {
          id: 'user1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          createdAt: new Date(),
          goals: [],
        },
        entries: [],
      };

      service.findOne.mockResolvedValue(goal);

      const result = await controller.findOne('1');

      expect(result).toEqual(goal);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('getEntries', () => {
    it('should return entries with count and hasEntryToday flag', async () => {
      const entries: GoalEntry[] = [
        {
          id: 'entry1',
          goalId: '1',
          createdAt: new Date(),
        } as GoalEntry,
      ];

      service.getGoalEntries.mockResolvedValue(entries);
      service.hasEntryForToday.mockResolvedValue(true);

      const result = await controller.getEntries('1');

      expect(result).toEqual({
        entries,
        count: 1,
        hasEntryToday: true,
      });
      expect(service.getGoalEntries).toHaveBeenCalledWith('1');
      expect(service.hasEntryForToday).toHaveBeenCalledWith('1');
    });
  });

  describe('createEntry', () => {
    it('should create and return a new entry', async () => {
      const newEntry: GoalEntry = {
        id: 'entry1',
        goalId: '1',
        createdAt: new Date(),
      } as GoalEntry;

      service.createEntry.mockResolvedValue(newEntry);

      const result = await controller.createEntry('1');

      expect(result).toEqual(newEntry);
      expect(service.createEntry).toHaveBeenCalledWith('1');
    });
  });
});
