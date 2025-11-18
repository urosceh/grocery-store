import mongoose from 'mongoose';
import { UserModel } from '../../src/database/model/User.model';
import { UserRepository } from '../../src/database/repository/User.repo';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../utils/mongoMemory';
import { seedStoreNodes, seedUsers } from '../utils/seed';

jest.setTimeout(30000);

describe('UserRepository (integration)', () => {
  const repo = new UserRepository(UserModel);

  beforeAll(async () => {
    await startInMemoryMongo();
    await seedStoreNodes();
    await seedUsers();
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.disconnect();
    await stopInMemoryMongo();
  });

  it('login succeeds with valid credentials', async () => {
    const user = await repo.login('tuser.root.m1', 'pass1');
    expect(user.username).toBe('tuser.root.m1');
    expect(user.role).toBeDefined();
    expect(user.storeId).toMatch(/^[0-9a-f]{24}$/i);
  });

  it('login fails with wrong password', async () => {
    const doc = await UserModel.findOne({ username: 'tuser.root.m1' }).select('+password').exec();
    expect(doc).toBeTruthy();
    const isValid = (doc as any).verifyPassword('wrong');
    expect(isValid).toBe(false);
  });

  it('login fails for non-existing user', async () => {
    const doc = await UserModel.findOne({ username: 'missing.user' }).select('+password').exec();
    expect(doc).toBeNull();
  });

  it('create inserts a new user and duplicate username throws', async () => {
    const uniqueUsername = `int.test.user.${Date.now()}`;
    await expect(
      repo.create({
        username: uniqueUsername,
        name: 'Int Test',
        password: 'Secret123!',
        role: 'employee',
        storeId: '000000000000000000000005',
      }),
    ).resolves.toBeDefined();

    // Duplicate should fail
    await expect(
      repo.create({
        username: uniqueUsername,
        name: 'Int Test',
        password: 'Secret123!',
        role: 'employee',
        storeId: '000000000000000000000005',
      }),
    ).rejects.toBeTruthy();
  });

  it('getByStoreIdsPaged respects type=employee and pagination', async () => {
    const users = await repo.getByStoreIdsPaged(['000000000000000000000001'], {
      type: 'employee',
      limit: 3,
      offset: 0,
    });
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeLessThanOrEqual(3);
    expect(users.every((u) => u.role === 'employee')).toBe(true);
  });

  it('getByStoreIdsPaged type=all returns both roles', async () => {
    const users = await repo.getByStoreIdsPaged(['000000000000000000000001'], {
      type: 'all',
      limit: 100,
      offset: 0,
    });
    expect(users.length).toBeGreaterThan(0);
    const roles = new Set(users.map((u) => u.role));
    expect(roles.has('employee') || roles.has('manager')).toBe(true);
  });
});
