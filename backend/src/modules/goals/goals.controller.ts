import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { GoalEntry } from '../../entities/goal-entry.entity';
import { Goal } from '../../entities/goal.entity';
import { CreateGoalEntryDto } from './dto/create-goal-entry.dto';
import { GoalsService } from './goals.service';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) { }

  @Get('stats')
  async getStats(): Promise<{ totalDays: number }> {
    const totalDays = await this.goalsService.getTotalUniqueDays();
    return { totalDays };
  }

  @Get('entries/timeline')
  async getEntriesTimeline(): Promise<GoalEntry[]> {
    return this.goalsService.getAllEntriesTimeline();
  }

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
  ): Promise<{ entries: GoalEntry[]; count: number; hasEntryToday: boolean; hasEntryYesterday: boolean }> {
    const entries = await this.goalsService.getGoalEntries(id);
    const count = entries.length;
    const hasEntryToday = await this.goalsService.hasEntryForToday(id);
    const hasEntryYesterday = await this.goalsService.hasEntryForYesterday(id);

    return { entries, count, hasEntryToday, hasEntryYesterday };
  }

  @Post(':id/entries')
  @HttpCode(HttpStatus.CREATED)
  async createEntry(
    @Param('id') id: string,
    @Body() createGoalEntryDto: CreateGoalEntryDto,
  ): Promise<GoalEntry> {
    return this.goalsService.createEntry(id, createGoalEntryDto.createdAt);
  }
}
