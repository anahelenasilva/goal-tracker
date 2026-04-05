import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Workouts E2E', () => {
  let app: INestApplication<App>;
  let exerciseId: string;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete workout flow', () => {
    it('should have an exercise available', async () => {
      const response = await request(app.getHttpServer())
        .get('/workouts/exercises')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      exerciseId = response.body[0].id;
    });

    it('should start with no active session', async () => {
      const response = await request(app.getHttpServer())
        .get('/workouts/sessions/active')
        .expect(200);

      expect(response.body).toBeNull();
    });

    it('should create a new workout session', async () => {
      const response = await request(app.getHttpServer())
        .post('/workouts/sessions')
        .expect(201);

      expect(response.body.status).toBe('active');
      expect(response.body.endedAt).toBeNull();
      expect(response.body.id).toBeDefined();
      sessionId = response.body.id;
    });

    it('should reflect the active session', async () => {
      const response = await request(app.getHttpServer())
        .get('/workouts/sessions/active')
        .expect(200);

      expect(response.body).not.toBeNull();
      expect(response.body.id).toBe(sessionId);
      expect(response.body.status).toBe('active');
    });

    it('should reject creating another session while one is active', async () => {
      await request(app.getHttpServer())
        .post('/workouts/sessions')
        .expect(409);
    });

    it('should add sets to the session', async () => {
      const response = await request(app.getHttpServer())
        .post(`/workouts/sessions/${sessionId}/sets`)
        .send({
          exerciseId,
          reps: 10,
          weight: 100,
        })
        .expect(201);

      expect(response.body.exerciseId).toBe(exerciseId);
      expect(response.body.reps).toBe(10);
      expect(response.body.weight).toBe(100);
    });

    it('should add a second set', async () => {
      const response = await request(app.getHttpServer())
        .post(`/workouts/sessions/${sessionId}/sets`)
        .send({
          exerciseId,
          reps: 12,
          weight: 105,
        })
        .expect(201);

      expect(response.body.reps).toBe(12);
    });

    it('should list sets in the session', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workouts/sessions/${sessionId}/sets`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].exercise).toBeDefined();
    });

    it('should update a set', async () => {
      const setsResponse = await request(app.getHttpServer())
        .get(`/workouts/sessions/${sessionId}/sets`)
        .expect(200);

      const setId = setsResponse.body[0].id;

      const response = await request(app.getHttpServer())
        .patch(`/workouts/sets/${setId}`)
        .send({ reps: 11 })
        .expect(200);

      expect(response.body.reps).toBe(11);
    });

    it('should end the session', async () => {
      const response = await request(app.getHttpServer())
        .post(`/workouts/sessions/${sessionId}/end`)
        .expect(201);

      expect(response.body.status).toBe('completed');
      expect(response.body.endedAt).not.toBeNull();
    });

    it('should no longer have an active session after ending', async () => {
      const response = await request(app.getHttpServer())
        .get('/workouts/sessions/active')
        .expect(200);

      expect(response.body).toBeNull();
    });

    it('should reject adding sets to completed session', async () => {
      await request(app.getHttpServer())
        .post(`/workouts/sessions/${sessionId}/sets`)
        .send({
          exerciseId,
          reps: 10,
          weight: 100,
        })
        .expect(409);
    });

    it('should show session in sessions list', async () => {
      const response = await request(app.getHttpServer())
        .get('/workouts/sessions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const completedSession = response.body.find((s: { id: string }) => s.id === sessionId);
      expect(completedSession).toBeDefined();
      expect(completedSession.status).toBe('completed');
    });

    it('should show session in recent sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/workouts/history/recent-sessions?limit=10')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((s: { id: string }) => s.id === sessionId)).toBe(true);
    });

    it('should show exercise history for the exercise', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workouts/history/${exerciseId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].exerciseId).toBe(exerciseId);
      expect(response.body[0].sets.length).toBe(2);
    });

    it('should show exercise progress graph', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workouts/graphs/${exerciseId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].weight).toBeDefined();
      expect(response.body[0].reps).toBeDefined();
      expect(response.body[0].volume).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent session', async () => {
      await request(app.getHttpServer())
        .get('/workouts/sessions/non-existent-id')
        .expect(404);
    });

    it('should return 404 for non-existent exercise', async () => {
      await request(app.getHttpServer())
        .get('/workouts/exercises/non-existent-id')
        .expect(404);
    });

    it('should return 404 for non-existent plan', async () => {
      await request(app.getHttpServer())
        .get('/workouts/plans/non-existent-id')
        .expect(404);
    });

    it('should return 404 for non-existent set', async () => {
      await request(app.getHttpServer())
        .get('/workouts/sets/non-existent-id')
        .expect(404);
    });
  });
});