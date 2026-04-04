import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeWeightNullable1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`
      SELECT is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'workout_sets' AND column_name = 'weight'
    `);
    if (rows.length > 0 && rows[0].is_nullable === 'NO') {
      await queryRunner.query(
        `ALTER TABLE "workout_sets" ALTER COLUMN "weight" DROP NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`
      SELECT is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'workout_sets' AND column_name = 'weight'
    `);
    if (rows.length > 0 && rows[0].is_nullable === 'YES') {
      await queryRunner.query(
        `UPDATE "workout_sets" SET "weight" = 0 WHERE "weight" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "workout_sets" ALTER COLUMN "weight" SET NOT NULL`,
      );
    }
  }
}
