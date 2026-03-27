import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkoutSchema1742856000000 implements MigrationInterface {
  name = 'WorkoutSchema1742856000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create exercises table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercises" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "name_pt" character varying NOT NULL,
        "category" character varying NOT NULL,
        "is_custom" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exercises" PRIMARY KEY ("id")
      )
    `);

    // Create workout_sessions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workout_sessions" (
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
      CREATE TABLE IF NOT EXISTS "training_plans" (
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
      CREATE TABLE IF NOT EXISTS "workout_sets" (
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
      CREATE TABLE IF NOT EXISTS "training_plan_exercises" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "exercise_id" uuid NOT NULL,
        "order_index" integer NOT NULL,
        CONSTRAINT "PK_training_plan_exercises" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_exercises_name" ON "exercises" ("name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_exercises_category" ON "exercises" ("category")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_workout_sessions_status" ON "workout_sessions" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_workout_sessions_started_at" ON "workout_sessions" ("started_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_workout_sets_session_id" ON "workout_sets" ("session_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_workout_sets_exercise_id" ON "workout_sets" ("exercise_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_training_plan_exercises_plan_id" ON "training_plan_exercises" ("plan_id")`);

    // Add foreign key constraints (idempotent)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_workout_sets_session') THEN
          ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_workout_sets_session"
          FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_workout_sets_exercise') THEN
          ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_workout_sets_exercise"
          FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END $$
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_training_plan_exercises_plan') THEN
          ALTER TABLE "training_plan_exercises" ADD CONSTRAINT "FK_training_plan_exercises_plan"
          FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_training_plan_exercises_exercise') THEN
          ALTER TABLE "training_plan_exercises" ADD CONSTRAINT "FK_training_plan_exercises_exercise"
          FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END $$
    `);

    // Insert built-in exercises (idempotent - only insert if not exists)
    await queryRunner.query(`
      INSERT INTO "exercises" ("name", "name_pt", "category", "is_custom")
      VALUES
        ('Bench Press', 'Supino Reto', 'chest', false),
        ('Incline Dumbbell Press', 'Supino Inclinado com Halteres', 'chest', false),
        ('Cable Flyes', 'Crucifixo no Cabo', 'chest', false),
        ('Dumbbell Fly', 'Supino Fly (Crucifixo com Halteres)', 'chest', false),
        ('Push-ups', 'Flexão de Braços', 'chest', false),
        ('Deadlift', 'Levantamento Terra', 'back', false),
        ('Barbell Row', 'Remada com Barra', 'back', false),
        ('Lat Pulldown', 'Puxada na Polia Alta', 'back', false),
        ('Seated Cable Row', 'Remada Sentada no Cabo', 'back', false),
        ('Pull-ups', 'Barra Fixa', 'back', false),
        ('Overhead Press', 'Desenvolvimento', 'shoulders', false),
        ('Lateral Raises', 'Elevação Lateral', 'shoulders', false),
        ('Face Pulls', 'Puxada para o Rosto', 'shoulders', false),
        ('Rear Delt Flyes', 'Crucifixo Inverso', 'shoulders', false),
        ('Barbell Curl', 'Rosca Direta com Barra', 'biceps', false),
        ('Dumbbell Curl', 'Rosca Direta com Halteres', 'biceps', false),
        ('Hammer Curl', 'Rosca Martelo', 'biceps', false),
        ('Preacher Curl', 'Rosca Scott', 'biceps', false),
        ('Cable Bicep Curl', 'Rosca Bíceps na Polia', 'biceps', false),
        ('Tricep Pushdown', 'Tríceps na Polia', 'triceps', false),
        ('Skull Crushers', 'Tríceps Testa', 'triceps', false),
        ('Dips', 'Mergulho', 'triceps', false),
        ('Overhead Tricep Extension', 'Tríceps Francês', 'triceps', false),
        ('Squat', 'Agachamento', 'legs', false),
        ('Leg Press', 'Leg Press', 'legs', false),
        ('Lunges', 'Avanço', 'legs', false),
        ('Romanian Deadlift', 'Levantamento Terra Romeno', 'legs', false),
        ('Leg Curl', 'Mesa Flexora', 'legs', false),
        ('Leg Extension', 'Cadeira Extensora', 'legs', false),
        ('Calf Raises', 'Elevação de Panturrilha', 'legs', false),
        ('Plank', 'Prancha Frontal', 'core', false),
        ('Crunch', 'Abdominal Reto (Tradicional)', 'core', false),
        ('Sit-up', 'Abdominal Completo', 'core', false),
        ('Bicycle Crunch', 'Abdominal Bicicleta', 'core', false),
        ('Jackknife', 'Abdominal Canivete', 'core', false),
        ('Reverse Crunch', 'Abdominal Infra', 'core', false),
        ('Oblique Crunch', 'Abdominal Oblíquo', 'core', false),
        ('Heel Touch', 'Toque no Calcanhar (Tic-Tac)', 'core', false),
        ('Mountain Climber', 'Escalador', 'core', false),
        ('Scissor Kick', 'Abdominal Tesoura', 'core', false),
        ('Dead Bug', 'Dead Bug', 'core', false),
        ('Russian Twists', 'Rotação Russa', 'core', false),
        ('Leg Raises', 'Elevação de Pernas', 'core', false),
        ('Running', 'Corrida', 'cardio', false),
        ('Cycling', 'Ciclismo', 'cardio', false),
        ('Rowing', 'Remo', 'cardio', false),
        ('Jump Rope', 'Pular Corda', 'cardio', false),
        ('Burpees', 'Burpees', 'full_body', false),
        ('Clean and Press', 'Arremesso e Desenvolvimento', 'full_body', false),
        ('Kettlebell Swing', 'Swing com Kettlebell', 'full_body', false),
        ('Tricep Kickback', 'Tríceps Coice', 'triceps', false),
        ('Wall Sit', 'Agachamento Isométrico na Parede', 'legs', false),
        ('Lateral Walk', 'Deslocamento Lateral com Elástico', 'legs', false),
        ('Barbell Wrist Curl', 'Rosca de Punho com Barra', 'other', false),
        ('Glute Bridge', 'Elevação Pélvica', 'legs', false),
        ('Box Step-up', 'Subida no Caixote', 'legs', false),
        ('Hip Abduction Machine', 'Cadeira Abdutora', 'legs', false),
        ('Seated Leg Curl', 'Cadeira Flexora', 'legs', false),
        ('Hip Adduction Machine', 'Cadeira Adutora', 'legs', false)
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE IF EXISTS "training_plan_exercises" DROP CONSTRAINT IF EXISTS "FK_training_plan_exercises_exercise"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "training_plan_exercises" DROP CONSTRAINT IF EXISTS "FK_training_plan_exercises_plan"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "workout_sets" DROP CONSTRAINT IF EXISTS "FK_workout_sets_exercise"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "workout_sets" DROP CONSTRAINT IF EXISTS "FK_workout_sets_session"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_training_plan_exercises_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_sets_exercise_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_sets_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_sessions_started_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_sessions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_exercises_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_exercises_name"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "training_plan_exercises"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workout_sets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "training_plans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workout_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exercises"`);
  }
}