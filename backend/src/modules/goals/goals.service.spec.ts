import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { GoalEntry } from '../../entities/goal-entry.entity';
import { Goal } from '../../entities/goal.entity';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  let service: GoalsService;
  let goalsRepository: MockProxy<Repository<Goal>>;
  let goalEntriesRepository: MockProxy<Repository<GoalEntry>>;

  beforeEach(async () => {
    goalsRepository = mock<Repository<Goal>>();
    goalEntriesRepository = mock<Repository<GoalEntry>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: getRepositoryToken(Goal),
          useValue: goalsRepository,
        },
        {
          provide: getRepositoryToken(GoalEntry),
          useValue: goalEntriesRepository,
        },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of goals', async () => {
      const goals: Goal[] = [
        {
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
        },
      ];

      goalsRepository.find.mockResolvedValue(goals);

      const result = await service.findAll();

      expect(result).toEqual(goals);
      expect(goalsRepository.find).toHaveBeenCalledWith({
        relations: ['entries'],
      });
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

      goalsRepository.findOne.mockResolvedValue(goal);

      const result = await service.findOne('1');

      expect(result).toEqual(goal);
      expect(goalsRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['entries'],
      });
    });

    it('should throw NotFoundException when goal not found', async () => {
      goalsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGoalEntries', () => {
    it('should return entries for a goal', async () => {
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

      const entries: GoalEntry[] = [
        {
          id: 'entry1',
          goalId: '1',
          createdAt: new Date(),
        } as GoalEntry,
      ];

      goalsRepository.findOne.mockResolvedValue(goal);
      goalEntriesRepository.find.mockResolvedValue(entries);

      const result = await service.getGoalEntries('1');

      expect(result).toEqual(entries);
      expect(goalEntriesRepository.find).toHaveBeenCalledWith({
        where: { goalId: '1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getGoalEntriesCount', () => {
    it('should return count of entries for a goal', async () => {
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

      goalsRepository.findOne.mockResolvedValue(goal);
      goalEntriesRepository.count.mockResolvedValue(5);

      const result = await service.getGoalEntriesCount('1');

      expect(result).toBe(5);
      expect(goalEntriesRepository.count).toHaveBeenCalledWith({
        where: { goalId: '1' },
      });
    });
  });

  describe('createEntry', () => {
    it('should create a new entry for today', async () => {
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

      const newEntry: GoalEntry = {
        id: 'entry1',
        goalId: '1',
        createdAt: new Date(),
      } as GoalEntry;

      goalsRepository.findOne.mockResolvedValue(goal);
      goalEntriesRepository.count.mockResolvedValue(0);
      goalEntriesRepository.create.mockReturnValue(newEntry);
      goalEntriesRepository.save.mockResolvedValue(newEntry);

      const result = await service.createEntry('1');

      expect(result).toEqual(newEntry);
      expect(goalEntriesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: '1',
          createdAt: expect.any(Date),
        })
      );
      expect(goalEntriesRepository.save).toHaveBeenCalledWith(newEntry);
    });

    it('should throw ConflictException when entry already exists for today', async () => {
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

      const existingEntry: GoalEntry = {
        id: 'entry1',
        goalId: '1',
        createdAt: new Date(),
      } as GoalEntry;

      goalsRepository.findOne.mockResolvedValue(goal);
      goalEntriesRepository.count.mockResolvedValue(1);

      await expect(service.createEntry('1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when goal does not exist', async () => {
      goalsRepository.findOne.mockResolvedValue(null);

      await expect(service.createEntry('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hasEntryForToday', () => {
    it('should return true when entry exists for today', async () => {
      goalEntriesRepository.count.mockResolvedValue(1);

      const result = await service.hasEntryForToday('1');

      expect(result).toBe(true);
    });

    it('should return false when no entry exists for today', async () => {
      goalEntriesRepository.count.mockResolvedValue(0);

      const result = await service.hasEntryForToday('1');

      expect(result).toBe(false);
    });
  });
});
