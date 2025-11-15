import { UserRepository } from '../../database/repository/User.repo';
import { JwtUserToken } from '../entity/JwtToken';
import { StoreTree } from '../entity/StoreTree';
import { CreateUserAttributes } from '../types/CreateUserAttributes';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async login(username: string, password: string): Promise<string> {
    const user = await this.userRepository.login(username, password);

    const token = JwtUserToken.sign({ username: user.username, role: user.role, storeId: user.storeId });

    return token;
  }

  public async create(createUserAttributes: CreateUserAttributes): Promise<void> {
    const user = await this.userRepository.create(createUserAttributes);
  }

  public async getAvailableStores(storeId: string): Promise<string[]> {
    const tree = StoreTree.getInstance();
    return tree.getDescendants(storeId);
  }
}
