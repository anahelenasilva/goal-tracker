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

  async createEntry(goalId: string): Promise<GoalEntry> {
    const goal = await this.findOne(goalId);

    const hasEntryToday = await this.hasEntryForToday(goalId);

    if (hasEntryToday) {
      throw new ConflictException(
        'An entry for today already exists for this goal',
      );
    }

    const entry = this.goalEntriesRepository.create({
      goalId: goal.id,
    });

    return this.goalEntriesRepository.save(entry);
  }

  async hasEntryForToday(goalId: string): Promise<boolean> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
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
}
