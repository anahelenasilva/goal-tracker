import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Exercise } from '../../entities/exercise.entity';
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
import { WorkoutsService } from './workouts.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get('exercises')
  async getExercises(@Query('query') query?: string): Promise<Exercise[]> {
    return this.workoutsService.getExercises(query);
  }

  @Get('exercises/:id')
  async getExerciseById(@Param('id') id: string): Promise<Exercise> {
    return this.workoutsService.getExerciseById(id);
  }

  @Post('exercises')
  async createExercise(@Body() dto: CreateExerciseDto): Promise<Exercise> {
    return this.workoutsService.createExercise(dto);
  }

  @Patch('exercises/:id')
  async updateExercise(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
  ): Promise<Exercise> {
    return this.workoutsService.updateExercise(id, dto);
  }

  @Delete('exercises/:id')
  async deleteExercise(@Param('id') id: string): Promise<void> {
    return this.workoutsService.deleteExercise(id);
  }

  @Get('sessions/active')
  async getActiveSession(@Res() res: Response): Promise<void> {
    const session = await this.workoutsService.getActiveSession();
    res.json(session);
  }

  @Get('sessions')
  async getSessions(): Promise<WorkoutSession[]> {
    return this.workoutsService.getSessions();
  }

  @Get('sessions/:id')
  async getSessionById(@Param('id') id: string): Promise<WorkoutSession> {
    return this.workoutsService.getSessionById(id);
  }

  @Post('sessions')
  async createSession(@Body() dto?: CreateSessionDto): Promise<WorkoutSession> {
    return this.workoutsService.createSession(dto);
  }

  @Post('sessions/:id/end')
  async endSession(@Param('id') id: string): Promise<WorkoutSession> {
    return this.workoutsService.endSession(id);
  }

  @Post('sessions/:id/abandon')
  async abandonSession(@Param('id') id: string): Promise<WorkoutSession> {
    return this.workoutsService.abandonSession(id);
  }

  @Get('sessions/:sessionId/sets')
  async getSessionSets(@Param('sessionId') sessionId: string): Promise<WorkoutSet[]> {
    return this.workoutsService.getSetsBySession(sessionId);
  }

  @Post('sessions/:sessionId/sets')
  async addSet(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateWorkoutSetDto,
  ): Promise<WorkoutSet> {
    return this.workoutsService.addSet(sessionId, dto);
  }

  @Patch('sets/:id')
  async updateSet(
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutSetDto,
  ): Promise<WorkoutSet> {
    return this.workoutsService.updateSet(id, dto);
  }

  @Delete('sets/:id')
  async deleteSet(@Param('id') id: string): Promise<void> {
    return this.workoutsService.deleteSet(id);
  }

  @Get('plans')
  async getPlans(): Promise<TrainingPlan[]> {
    return this.workoutsService.getPlans();
  }

  @Get('plans/:id')
  async getPlanById(@Param('id') id: string): Promise<TrainingPlan> {
    return this.workoutsService.getPlanById(id);
  }

  @Post('plans')
  async createPlan(@Body() dto: CreateTrainingPlanDto): Promise<TrainingPlan> {
    return this.workoutsService.createPlan(dto);
  }

  @Patch('plans/:id')
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingPlanDto,
  ): Promise<TrainingPlan> {
    return this.workoutsService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string): Promise<void> {
    return this.workoutsService.deletePlan(id);
  }

  @Post('plans/:id/exercises')
  async addPlanExercise(
    @Param('id') id: string,
    @Body() dto: AddPlanExerciseDto,
  ): Promise<TrainingPlan> {
    return this.workoutsService.addPlanExercise(id, dto);
  }

  @Delete('plans/:id/exercises/:exerciseId')
  async removePlanExercise(
    @Param('id') id: string,
    @Param('exerciseId') exerciseId: string,
  ): Promise<TrainingPlan> {
    return this.workoutsService.removePlanExercise(id, exerciseId);
  }

  @Put('plans/:id/exercises/reorder')
  async reorderPlanExercises(
    @Param('id') id: string,
    @Body() dto: ReorderPlanExercisesDto,
  ): Promise<TrainingPlan> {
    return this.workoutsService.reorderPlanExercises(id, dto);
  }

  @Get('history/recent-sessions')
  async getRecentSessions(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<WorkoutSession[]> {
    return this.workoutsService.getRecentSessions(limit);
  }

  @Get('history/:exerciseId')
  async getExerciseHistory(@Param('exerciseId') exerciseId: string): Promise<
    Array<{
      id: string;
      sessionId: string;
      sessionStartedAt: Date;
      exerciseId: string;
      exercise: Exercise;
      sets: WorkoutSet[];
    }>
  > {
    return this.workoutsService.getExerciseHistory(exerciseId);
  }

  @Get('graphs/:exerciseId')
  async getExerciseProgress(
    @Param('exerciseId') exerciseId: string,
    @Query('period', new ParseIntPipe({ optional: true })) period?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<Array<{ date: Date; weight: number; reps: number; volume: number }>> {
    return this.workoutsService.getExerciseProgress(exerciseId, period, limit);
  }
}
