import mongoose, { Types } from 'mongoose';
import { StoreNodeModel } from '../../src/database/model/StoreNode.model';
import { StoreNodeRepository } from '../../src/database/repository/StoreNode.repo';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../utils/mongoMemory';
import { seedStoreNodes } from '../utils/seed';

jest.setTimeout(30000);

describe('StoreNodeRepository (integration)', () => {
  const repo = new StoreNodeRepository(StoreNodeModel);

  beforeAll(async () => {
    await startInMemoryMongo();
    await seedStoreNodes();
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.disconnect();
    await stopInMemoryMongo();
  });

  it('create inserts a new store node', async () => {
    const id = new Types.ObjectId();
    const parentId = Types.ObjectId.createFromHexString('000000000000000000000001');
    const created = await repo.create({
      _id: id,
      displayName: 'Test Store',
      kind: 'STORE',
      parentId,
      ancestorIds: [parentId],
    } as any);
    expect(created.id).toBe(id.toString());
    expect(created.displayName).toBe('Test Store');
  });

  it('getAll returns seeded nodes', async () => {
    const all = await repo.getAll();
    expect(all.length).toBeGreaterThan(0);
    const root = all.find((n) => n.id === '000000000000000000000001');
    expect(root).toBeDefined();
  });

  it('getByIds returns requested nodes', async () => {
    const ids = ['000000000000000000000001', '00000000000000000000000e'];
    const nodes = await repo.getByIds(ids);
    expect(nodes.length).toBe(ids.length);
    const returnedIds = new Set(nodes.map((n) => n.id));
    ids.forEach((id) => expect(returnedIds.has(id)).toBe(true));
  });
});
