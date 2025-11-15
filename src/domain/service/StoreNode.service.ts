import { PersonnelType } from '../../api/store/request/get.personnel.request';
import { StoreNodeRepository } from '../../database/repository/StoreNode.repo';
import { UserRepository } from '../../database/repository/User.repo';
import { StoreTree } from '../entity/StoreTree';
import { User } from '../entity/User';

export class StoreNodeService {
  constructor(private readonly storeRepository: StoreNodeRepository, private readonly userRepository: UserRepository) {}

  public async getPersonnel(
    storeId: string,
    type: PersonnelType,
    options: {
      includeChildNodes: boolean;
      limit: number;
      offset: number;
    },
  ): Promise<User[]> {
    const targetStoreIds: string[] = options.includeChildNodes
      ? [storeId, ...StoreTree.getInstance().getDescendants(storeId)]
      : [storeId];

    const users = await this.userRepository.getByStoreIdsPaged(targetStoreIds, {
      type,
      limit: options.limit,
      offset: options.offset,
    });

    return users;
  }

  public async initializeStoreTree(): Promise<void> {
    const nodes = await this.storeRepository.getAll();

    if (nodes.length === 0) {
      throw new Error('No store nodes found');
    }

    StoreTree.initialize(nodes);
  }
}
