import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanIdToWorkoutSessions1748500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'workout_sessions' AND column_name = 'plan_id'
    `);

    if (hasColumn.length === 0) {
      await queryRunner.query(
        `ALTER TABLE workout_sessions ADD COLUMN plan_id UUID`,
      );
      await queryRunner.query(
        `ALTER TABLE workout_sessions ADD CONSTRAINT fk_workout_sessions_plan
         FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE SET NULL`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_workout_sessions_plan_id ON workout_sessions(plan_id)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE workout_sessions DROP CONSTRAINT IF EXISTS fk_workout_sessions_plan`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_workout_sessions_plan_id`,
    );
    await queryRunner.query(
      `ALTER TABLE workout_sessions DROP COLUMN IF EXISTS plan_id`,
    );
  }
}
