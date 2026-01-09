import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { GoalEntry } from '../../entities/goal-entry.entity';
import { Goal } from '../../entities/goal.entity';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private goalsRepository: Repository<Goal>,
    @InjectRepository(GoalEntry)
    private goalEntriesRepository: Repository<GoalEntry>,
  ) { }

  async findAll(): Promise<Goal[]> {
    return this.goalsRepository.find({
      relations: ['entries'],
    });
  }

  async findOne(id: string): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id },
      relations: ['entries'],
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    return goal;
  }

  async getGoalEntries(goalId: string): Promise<GoalEntry[]> {
    const goal = await this.findOne(goalId);
    return this.goalEntriesRepository.find({
      where: { goalId: goal.id },
      order: { createdAt: 'DESC' },
    });
  }

  async getGoalEntriesCount(goalId: string): Promise<number> {
    const goal = await this.findOne(goalId);
    return this.goalEntriesRepository.count({
      where: { goalId: goal.id },
    });
  }

  async createEntry(goalId: string, createdAt?: string): Promise<GoalEntry> {
    const goal = await this.findOne(goalId);

    const entryDate = createdAt ? new Date(createdAt) : new Date();
    const hasEntryForDate = await this.hasEntryForDate(goalId, entryDate);

    if (hasEntryForDate) {
      throw new ConflictException(
        'An entry for this date already exists for this goal',
      );
    }

    const entry = this.goalEntriesRepository.create({
      goalId: goal.id,
      createdAt: entryDate,
    });

    return this.goalEntriesRepository.save(entry);
  }

  async hasEntryForToday(goalId: string): Promise<boolean> {
    return this.hasEntryForDate(goalId, new Date());
  }

  async hasEntryForYesterday(goalId: string): Promise<boolean> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.hasEntryForDate(goalId, yesterday);
  }

  async hasEntryForDate(goalId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );

    const count = await this.goalEntriesRepository.count({
      where: {
        goalId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    return count > 0;
  }

  async getTotalUniqueDays(): Promise<number> {
    const entries = await this.goalEntriesRepository.find();

    const uniqueDates = new Set<string>();
    entries.forEach((entry) => {
      const date = new Date(entry.createdAt);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      uniqueDates.add(dateString);
    });

    return uniqueDates.size;
  }

  async getAllEntriesTimeline(): Promise<GoalEntry[]> {
    return this.goalEntriesRepository.find({
      relations: ['goal'],
      order: { createdAt: 'DESC' },
    });
  }
}
