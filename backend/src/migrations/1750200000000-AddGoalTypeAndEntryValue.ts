import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoalTypeAndEntryValue1750200000000
  implements MigrationInterface {
  name = 'AddGoalTypeAndEntryValue1750200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "goals"
      ADD COLUMN IF NOT EXISTS "type" character varying(20) NOT NULL DEFAULT 'exercise'
    `);

    await queryRunner.query(`
      ALTER TABLE "goal_entries"
      ADD COLUMN IF NOT EXISTS "value" numeric(10,2)
    `);

    await queryRunner.query(`
      UPDATE "goals"
      SET "type" = 'treadmill'
      WHERE LOWER("title") = 'treadmill'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "goal_entries"
      DROP COLUMN IF EXISTS "value"
    `);

    await queryRunner.query(`
      ALTER TABLE "goals"
      DROP COLUMN IF EXISTS "type"
    `);
  }
}
