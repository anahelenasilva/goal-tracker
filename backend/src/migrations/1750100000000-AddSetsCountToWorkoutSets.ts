import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSetsCountToWorkoutSets1750100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workout_sets" ADD COLUMN "sets" integer NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workout_sets" DROP COLUMN "sets"`);
  }
}
