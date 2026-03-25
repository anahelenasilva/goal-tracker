import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkoutSchema1742856000000 implements MigrationInterface {
  name = 'WorkoutSchema1742856000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create exercises table
    await queryRunner.query(`
      CREATE TABLE "exercises" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "category" character varying NOT NULL,
        "is_custom" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exercises" PRIMARY KEY ("id")
      )
    `);

    // Create workout_sessions table
    await queryRunner.query(`
      CREATE TABLE "workout_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" character varying NOT NULL,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ended_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workout_sessions" PRIMARY KEY ("id")
      )
    `);

    // Create training_plans table
    await queryRunner.query(`
      CREATE TABLE "training_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "assigned_days" character varying[],
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_plans" PRIMARY KEY ("id")
      )
    `);

    // Create workout_sets table
    await queryRunner.query(`
      CREATE TABLE "workout_sets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "exercise_id" uuid NOT NULL,
        "reps" integer NOT NULL,
        "weight" decimal(10,2) NOT NULL,
        "weight_unit" character varying NOT NULL,
        "notes" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workout_sets" PRIMARY KEY ("id")
      )
    `);

    // Create training_plan_exercises table
    await queryRunner.query(`
      CREATE TABLE "training_plan_exercises" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "exercise_id" uuid NOT NULL,
        "order_index" integer NOT NULL,
        CONSTRAINT "PK_training_plan_exercises" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_exercises_name" ON "exercises" ("name")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_exercises_category" ON "exercises" ("category")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_workout_sessions_status" ON "workout_sessions" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_workout_sessions_started_at" ON "workout_sessions" ("started_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_workout_sets_session_id" ON "workout_sets" ("session_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_workout_sets_exercise_id" ON "workout_sets" ("exercise_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_training_plan_exercises_plan_id" ON "training_plan_exercises" ("plan_id")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "workout_sets"
      ADD CONSTRAINT "FK_workout_sets_session"
      FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "workout_sets"
      ADD CONSTRAINT "FK_workout_sets_exercise"
      FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "training_plan_exercises"
      ADD CONSTRAINT "FK_training_plan_exercises_plan"
      FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "training_plan_exercises"
      ADD CONSTRAINT "FK_training_plan_exercises_exercise"
      FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Insert built-in exercises
    await queryRunner.query(`
      INSERT INTO "exercises" ("name", "category", "is_custom") VALUES
        ('Bench Press', 'chest', false),
        ('Incline Dumbbell Press', 'chest', false),
        ('Cable Flyes', 'chest', false),
        ('Push-ups', 'chest', false),
        ('Deadlift', 'back', false),
        ('Barbell Row', 'back', false),
        ('Lat Pulldown', 'back', false),
        ('Seated Cable Row', 'back', false),
        ('Pull-ups', 'back', false),
        ('Overhead Press', 'shoulders', false),
        ('Lateral Raises', 'shoulders', false),
        ('Face Pulls', 'shoulders', false),
        ('Rear Delt Flyes', 'shoulders', false),
        ('Barbell Curl', 'biceps', false),
        ('Dumbbell Curl', 'biceps', false),
        ('Hammer Curl', 'biceps', false),
        ('Preacher Curl', 'biceps', false),
        ('Tricep Pushdown', 'triceps', false),
        ('Skull Crushers', 'triceps', false),
        ('Dips', 'triceps', false),
        ('Overhead Tricep Extension', 'triceps', false),
        ('Squat', 'legs', false),
        ('Leg Press', 'legs', false),
        ('Lunges', 'legs', false),
        ('Romanian Deadlift', 'legs', false),
        ('Leg Curl', 'legs', false),
        ('Leg Extension', 'legs', false),
        ('Calf Raises', 'legs', false),
        ('Plank', 'core', false),
        ('Crunches', 'core', false),
        ('Russian Twists', 'core', false),
        ('Leg Raises', 'core', false),
        ('Running', 'cardio', false),
        ('Cycling', 'cardio', false),
        ('Rowing', 'cardio', false),
        ('Jump Rope', 'cardio', false),
        ('Burpees', 'full_body', false),
        ('Clean and Press', 'full_body', false),
        ('Kettlebell Swing', 'full_body', false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "training_plan_exercises" DROP CONSTRAINT "FK_training_plan_exercises_exercise"`);
    await queryRunner.query(`ALTER TABLE "training_plan_exercises" DROP CONSTRAINT "FK_training_plan_exercises_plan"`);
    await queryRunner.query(`ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_workout_sets_exercise"`);
    await queryRunner.query(`ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_workout_sets_session"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "idx_training_plan_exercises_plan_id"`);
    await queryRunner.query(`DROP INDEX "idx_workout_sets_exercise_id"`);
    await queryRunner.query(`DROP INDEX "idx_workout_sets_session_id"`);
    await queryRunner.query(`DROP INDEX "idx_workout_sessions_started_at"`);
    await queryRunner.query(`DROP INDEX "idx_workout_sessions_status"`);
    await queryRunner.query(`DROP INDEX "idx_exercises_category"`);
    await queryRunner.query(`DROP INDEX "idx_exercises_name"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "training_plan_exercises"`);
    await queryRunner.query(`DROP TABLE "workout_sets"`);
    await queryRunner.query(`DROP TABLE "training_plans"`);
    await queryRunner.query(`DROP TABLE "workout_sessions"`);
    await queryRunner.query(`DROP TABLE "exercises"`);
  }
}