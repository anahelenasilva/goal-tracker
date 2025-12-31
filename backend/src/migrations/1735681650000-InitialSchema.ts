import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735681650000 implements MigrationInterface {
  name = 'InitialSchema1735681650000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("id")
      )
    `);

    // Create goals table
    await queryRunner.query(`
      CREATE TABLE "goals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying NOT NULL,
        "title" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id")
      )
    `);

    // Create goal_entries table
    await queryRunner.query(`
      CREATE TABLE "goal_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "goal_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_6c6f8b6b6b6b6b6b6b6b6b6b6b6" PRIMARY KEY ("id")
      )
    `);

    // Create index for goal_entries
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_goal_entry_date" ON "goal_entries" ("goal_id", "created_at")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "goals"
      ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f4_users"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "goal_entries"
      ADD CONSTRAINT "FK_6c6f8b6b6b6b6b6b6b6b6b6b6b6_goals"
      FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "goal_entries" DROP CONSTRAINT "FK_6c6f8b6b6b6b6b6b6b6b6b6b6b6_goals"`);
    await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_4c88e956195bba85977da21b8f4_users"`);

    // Drop index
    await queryRunner.query(`DROP INDEX "idx_goal_entry_date"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "goal_entries"`);
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
