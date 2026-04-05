import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropWeightUnitColumn1750200000000 implements MigrationInterface {
  name = 'DropWeightUnitColumn1750200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workout_sets"
      DROP COLUMN IF EXISTS "weight_unit"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workout_sets"
      ADD COLUMN IF NOT EXISTS "weight_unit" character varying NOT NULL DEFAULT 'kg'
    `);
  }
}
