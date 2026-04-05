import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
  ) { }

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    // Check if admin user already exists
    let adminUser = await this.userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      // Create admin user
      adminUser = this.userRepository.create({
        name: 'Admin',
        email: 'admin@example.com',
      });
      adminUser = await this.userRepository.save(adminUser);
      console.log('Admin user created');
    }

    // Check if goals already exist
    const existingGoals = await this.goalRepository.count({
      where: { userId: adminUser.id },
    });

    if (existingGoals === 0) {
      // Create default goals
      const exerciseGoal = this.goalRepository.create({
        userId: adminUser.id,
        title: 'exercise',
      });

      const treadmillGoal = this.goalRepository.create({
        userId: adminUser.id,
        title: 'treadmill',
        type: 'treadmill',
      });

      await this.goalRepository.save([exerciseGoal, treadmillGoal]);
      console.log('Default goals created: exercise, treadmill');
    }
  }
}
