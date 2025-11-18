import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { startInMemoryMongo, clearDatabase, stopInMemoryMongo } from '../utils/mongoMemory';
import { seedStoreNodes, seedUsers } from '../utils/seed';
import { ErrorHandlingMiddleware } from '../../src/api/web.api.middleware/error.handling.middleware';
import { createStoreRouter, createUserRouter } from '../utils/buildRouters';

jest.setTimeout(30000);

describe('store.router (integration)', () => {
  let app: express.Express;
  let rootToken = '';
  let employeeToken = '';
  let beogradManagerToken = '';
  let r1ManagerToken = '';

  beforeAll(async () => {
    await startInMemoryMongo();
    await seedStoreNodes();
    await seedUsers();

    app = express();
    app.use(express.json());
    app.use('/api/store', await createStoreRouter());
    app.use('/api/user', await createUserRouter());
    app.use(ErrorHandlingMiddleware.handleErrors);

    // Login tokens
    const root = await request(app).post('/api/user/login').send({ username: 'tuser.root.m1', password: 'pass1' });
    rootToken = typeof root.body === 'string' ? root.body : JSON.parse(root.text);
    const employee = await request(app)
      .post('/api/user/login')
      .send({ username: 'tuser.root.e1', password: 'pass2' });
    employeeToken = typeof employee.body === 'string' ? employee.body : JSON.parse(employee.text);
    const beograd = await request(app)
      .post('/api/user/login')
      .send({ username: 'tuser.bg.m1', password: 'pass4' });
    beogradManagerToken = typeof beograd.body === 'string' ? beograd.body : JSON.parse(beograd.text);
    const r1Manager = await request(app)
      .post('/api/user/login')
      .send({ username: 'tuser.r1.m1', password: 'pass13' });
    r1ManagerToken = typeof r1Manager.body === 'string' ? r1Manager.body : JSON.parse(r1Manager.text);
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.disconnect();
    await stopInMemoryMongo();
  });

  describe('GET /api/store/user-stores', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/store/user-stores');
      expect(res.status).toBe(401);
    });

    it('returns 401 on invalid token', async () => {
      const res = await request(app).get('/api/store/user-stores').set('Authorization', 'Bearer invalid.token');
      expect(res.status).toBe(401);
    });

    it('returns 200 with { stores: [] }', async () => {
      const res = await request(app).get('/api/store/user-stores').set('Authorization', `Bearer ${rootToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body?.stores)).toBe(true);
      expect(res.body.stores.length).toBeGreaterThan(0);
      const shapeOk = res.body.stores.every(
        (s: any) => s && typeof s.displayName === 'string' && /^[0-9a-f]{24}$/i.test(s.id),
      );
      expect(shapeOk).toBe(true);
    });
  });

  describe('GET /api/store/:storeId/personnel', () => {
    const STORES = {
      root: '000000000000000000000001',
      radnja1: '000000000000000000000005',
      noviBeograd: '00000000000000000000000f',
      beograd: '00000000000000000000000e',
    };

    it('returns 401 without token', async () => {
      const res = await request(app).get(`/api/store/${STORES.radnja1}/personnel`);
      expect(res.status).toBe(401);
    });

    it('returns 400 on invalid limit', async () => {
      const res = await request(app)
        .get(`/api/store/${STORES.radnja1}/personnel`)
        .set('Authorization', `Bearer ${rootToken}`)
        .query({ limit: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('returns 400 on invalid storeId param', async () => {
      const res = await request(app)
        .get(`/api/store/xyz/personnel`)
        .set('Authorization', `Bearer ${rootToken}`);
      expect(res.status).toBe(400);
    });

    it('returns 400 on non existing storeId', async () => {
      const res = await request(app)
        .get(`/api/store/000000000000000000000022/personnel`)
        .set('Authorization', `Bearer ${rootToken}`);
      expect(res.status).toBe(400);
    });

    it('manager default params: 200 with personnel only from passed store', async () => {
      const res = await request(app)
        .get(`/api/store/${STORES.radnja1}/personnel`)
        .set('Authorization', `Bearer ${rootToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body?.personnel)).toBe(true);
      expect(res.body.personnel.every((u: any) => u.storeId === STORES.radnja1)).toBe(true);
    });

    it('employee cannot request type=manager => 403', async () => {
      const res = await request(app)
        .get(`/api/store/${STORES.radnja1}/personnel`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .query({ type: 'manager', limit: 5, offset: 0 });
      expect(res.status).toBe(403);
    });

    it('employee with type=all only returns employees', async () => {
      const res = await request(app)
        .get(`/api/store/${STORES.radnja1}/personnel`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .query({ type: 'all', limit: 5, offset: 0 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body?.personnel)).toBe(true);
      expect(res.body.personnel.every((u: any) => u.role === 'employee')).toBe(true);
    });

    it('includeChildNodes increases or equals result size', async () => {
      const base = await request(app)
        .get(`/api/store/${STORES.beograd}/personnel`)
        .set('Authorization', `Bearer ${beogradManagerToken}`)
        .query({ type: 'all', includeChildNodes: 'false', limit: 1000, offset: 0 });
      expect(base.status).toBe(200);
      const withChildren = await request(app)
        .get(`/api/store/${STORES.beograd}/personnel`)
        .set('Authorization', `Bearer ${beogradManagerToken}`)
        .query({ type: 'all', includeChildNodes: 'true', limit: 1000, offset: 0 });
      expect(withChildren.status).toBe(200);
      expect((withChildren.body?.personnel || []).length).toBeGreaterThanOrEqual(
        (base.body?.personnel || []).length,
      );
    });

    it('root manager with includeChildNodes returns personnel from all stores', async () => {
      const res = await request(app)
        .get(`/api/store/${STORES.root}/personnel`)
        .set('Authorization', `Bearer ${rootToken}`)
        .query({ type: 'all', includeChildNodes: 'true', limit: 1000, offset: 0 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body?.personnel)).toBe(true);
      expect(res.body.personnel.length).toBeGreaterThan(0);
    });

    it('pagination yields no overlap', async () => {
      const q = { type: 'employee', includeChildNodes: 'true', limit: 2, offset: 0 };
      const page1 = await request(app)
        .get(`/api/store/${STORES.root}/personnel`)
        .set('Authorization', `Bearer ${rootToken}`)
        .query(q);
      expect(page1.status).toBe(200);
      const page2 = await request(app)
        .get(`/api/store/${STORES.root}/personnel`)
        .set('Authorization', `Bearer ${rootToken}`)
        .query({ ...q, offset: 2 });
      expect(page2.status).toBe(200);

      const set1 = new Set((page1.body?.personnel || []).map((u: any) => u.username));
      const set2 = new Set((page2.body?.personnel || []).map((u: any) => u.username));
      const intersection = [...set1].filter((x) => set2.has(x));
      expect(intersection.length).toBe(0);
    });

    it('cross-subtree access is forbidden', async () => {
      const res = await request(app)
        .get(`/api/store/000000000000000000000011/personnel`)
        .set('Authorization', `Bearer ${r1ManagerToken}`)
        .query({ limit: 5, offset: 0 });
      expect(res.status).toBe(403);
    });
  });
});


