import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { ErrorHandlingMiddleware } from '../../src/api/web.api.middleware/error.handling.middleware';
import { createStoreRouter, createUserRouter } from '../utils/buildRouters';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../utils/mongoMemory';
import { seedStoreNodes, seedUsers } from '../utils/seed';

jest.setTimeout(30000);

describe('user.router (integration)', () => {
  let app: express.Express;

  beforeAll(async () => {
    await startInMemoryMongo();
    await seedStoreNodes();
    await seedUsers();

    app = express();
    app.use(express.json());
    app.use('/api/store', await createStoreRouter());
    app.use('/api/user', await createUserRouter());
    app.use(ErrorHandlingMiddleware.handleErrors);
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.disconnect();
    await stopInMemoryMongo();
  });

  describe('POST /api/user/login', () => {
    it('returns 400 on invalid body', async () => {
      const res = await request(app).post('/api/user/login').send({ username: 'tuser.root.m1' });
      expect(res.status).toBe(400);
    });

    it('returns 401 on wrong password', async () => {
      const res = await request(app).post('/api/user/login').send({ username: 'tuser.root.m1', password: 'nope' });
      expect(res.status).toBe(401);
    });

    it('returns 200 and a JWT on success', async () => {
      const res = await request(app).post('/api/user/login').send({ username: 'tuser.root.m1', password: 'pass1' });
      expect(res.status).toBe(200);
      const token = typeof res.body === 'string' ? res.body : JSON.parse(res.text);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });
  });

  describe('POST /api/user/logout', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/user/logout');
      expect(res.status).toBe(401);
    });

    it('returns 204 with valid token', async () => {
      const login = await request(app).post('/api/user/login').send({ username: 'tuser.root.m1', password: 'pass1' });
      const token = typeof login.body === 'string' ? login.body : JSON.parse(login.text);

      const res = await request(app).post('/api/user/logout').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });
  });

  describe('POST /api/user (create)', () => {
    it('returns 401 when missing token', async () => {
      const res = await request(app).post('/api/user').send({
        username: 'no_access_user',
        name: 'X',
        password: 'x',
        role: 'employee',
        storeId: '000000000000000000000005',
      });
      expect(res.status).toBe(401);
    });

    it('returns 400 on invalid body', async () => {
      const login = await request(app).post('/api/user/login').send({ username: 'tuser.root.m1', password: 'pass1' });
      const token = typeof login.body === 'string' ? login.body : JSON.parse(login.text);

      const res = await request(app)
        .post('/api/user')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'abc' });
      expect(res.status).toBe(400);
    });

    it('returns 403 on cross-subtree create', async () => {
      // Radnja 1 manager should not create in Radnja 6 (different subtree)
      const r1Manager = await request(app)
        .post('/api/user/login')
        .send({ username: 'tuser.r1.m1', password: 'pass13' });

      const res = await request(app)
        .post('/api/user')
        .set(
          'Authorization',
          `Bearer ${typeof r1Manager.body === 'string' ? r1Manager.body : JSON.parse(r1Manager.text)}`,
        )
        .send({
          username: 'no_access_user',
          name: 'NoAccess',
          password: 'x',
          role: 'employee',
          storeId: '000000000000000000000011',
        });
      expect(res.status).toBe(403);
    });

    it('returns 200 on success and allows login', async () => {
      const rootLogin = await request(app)
        .post('/api/user/login')
        .send({ username: 'tuser.root.m1', password: 'pass1' });
      const token = typeof rootLogin.body === 'string' ? rootLogin.body : JSON.parse(rootLogin.text);
      const username = `new_user_${Date.now()}`;

      const createRes = await request(app).post('/api/user').set('Authorization', `Bearer ${token}`).send({
        username,
        name: 'E2E New',
        password: 'Secret123!',
        role: 'employee',
        storeId: '000000000000000000000005',
      });
      expect([200, 201]).toContain(createRes.status);

      const loginNew = await request(app).post('/api/user/login').send({ username, password: 'Secret123!' });
      expect(loginNew.status).toBe(200);
      const loginToken = typeof loginNew.body === 'string' ? loginNew.body : JSON.parse(loginNew.text);
      expect(loginToken.length).toBeGreaterThan(10);
    });

    it('returns 4xx/5xx on duplicate username', async () => {
      const rootLogin = await request(app)
        .post('/api/user/login')
        .send({ username: 'tuser.root.m1', password: 'pass1' });
      const token = typeof rootLogin.body === 'string' ? rootLogin.body : JSON.parse(rootLogin.text);
      const dup = `dup_user_${Date.now()}`;

      const first = await request(app).post('/api/user').set('Authorization', `Bearer ${token}`).send({
        username: dup,
        name: 'Dup',
        password: 'x',
        role: 'employee',
        storeId: '000000000000000000000005',
      });
      expect([200, 201]).toContain(first.status);

      const second = await request(app).post('/api/user').set('Authorization', `Bearer ${token}`).send({
        username: dup,
        name: 'Dup',
        password: 'x',
        role: 'employee',
        storeId: '00000000000000000000000a',
      });
      expect(second.status).toBeGreaterThanOrEqual(400);
      expect(second.status).toBeLessThan(600);
    });
  });
});
