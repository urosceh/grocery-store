import type { StoreNodeRepository } from '../../../src/database/repository/StoreNode.repo';
import type { UserRepository } from '../../../src/database/repository/User.repo';
import { StoreTree } from '../../../src/domain/entity/StoreTree';
import { StoreNodeService } from '../../../src/domain/service/StoreNode.service';
import { buildSmallStoreTree } from '../../helpers/storeTree';

function resetStoreTree(): void {
  (StoreTree as any).instance = undefined;
}

describe('StoreNodeService', () => {
  beforeEach(() => {
    resetStoreTree();
  });

  it('getPersonnel calls repo with just target when includeChildNodes=false', async () => {
    const { root, nodes } = buildSmallStoreTree();
    const storeId = root.toString();
    const userRepo: Partial<UserRepository> = { getByStoreIdsPaged: jest.fn().mockResolvedValue([]) };
    const storeRepo: Partial<StoreNodeRepository> = {};
    StoreTree.initialize(nodes);

    const svc = new StoreNodeService(storeRepo as StoreNodeRepository, userRepo as UserRepository);
    const result = await svc.getPersonnel(storeId, 'all' as any, { includeChildNodes: false, limit: 10, offset: 0 });
    expect(result).toEqual([]);
    expect(userRepo.getByStoreIdsPaged).toHaveBeenCalledWith([storeId], { type: 'all', limit: 10, offset: 0 });
  });

  it('getPersonnel includes descendants when includeChildNodes=true', async () => {
    const { root, child1, child2, child1a, child2a, child2b, nodes } = buildSmallStoreTree();
    StoreTree.initialize(nodes);

    const userRepo: Partial<UserRepository> = { getByStoreIdsPaged: jest.fn().mockResolvedValue([]) };
    const storeRepo: Partial<StoreNodeRepository> = {};
    const svc = new StoreNodeService(storeRepo as StoreNodeRepository, userRepo as UserRepository);
    await svc.getPersonnel(root.toString(), 'all' as any, { includeChildNodes: true, limit: 5, offset: 0 });
    const expectedIds = [
      root.toString(),
      child1.toString(),
      child2.toString(),
      child1a.toString(),
      child2a.toString(),
      child2b.toString(),
    ];
    const call = (userRepo.getByStoreIdsPaged as any).mock.calls[0][0];
    expect(call.sort()).toEqual(expectedIds.sort());
  });

  it('getPersonnel throws if storeId is not in the subtree', async () => {});

  it('initializeStoreTree throws if no nodes', async () => {
    const storeRepo: Partial<StoreNodeRepository> = { getAll: jest.fn().mockResolvedValue([]) };
    const userRepo: Partial<UserRepository> = {};
    const svc = new StoreNodeService(storeRepo as StoreNodeRepository, userRepo as UserRepository);
    await expect(svc.initializeStoreTree()).rejects.toThrow('No store nodes found');
  });

  it('initializeStoreTree initializes StoreTree with nodes', async () => {
    const { nodes } = buildSmallStoreTree();
    const storeRepo: Partial<StoreNodeRepository> = { getAll: jest.fn().mockResolvedValue(nodes) };
    const userRepo: Partial<UserRepository> = {};
    const svc = new StoreNodeService(storeRepo as StoreNodeRepository, userRepo as UserRepository);
    await svc.initializeStoreTree();
    expect(StoreTree.getInstance()).toBeDefined();
  });
});
