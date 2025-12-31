import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { GoalEntry } from '../../entities/goal-entry.entity';
import { Goal } from '../../entities/goal.entity';
import { GoalsService } from './goals.service';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) { }

  @Get()
  async findAll(): Promise<Goal[]> {
    return this.goalsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Goal> {
    return this.goalsService.findOne(id);
  }

  @Get(':id/entries')
  async getEntries(
    @Param('id') id: string,
  ): Promise<{ entries: GoalEntry[]; count: number; hasEntryToday: boolean }> {
    const entries = await this.goalsService.getGoalEntries(id);
    const count = entries.length;
    const hasEntryToday = await this.goalsService.hasEntryForToday(id);

    return { entries, count, hasEntryToday };
  }

  @Post(':id/entries')
  @HttpCode(HttpStatus.CREATED)
  async createEntry(@Param('id') id: string): Promise<GoalEntry> {
    return this.goalsService.createEntry(id);
  }
}
