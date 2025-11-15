import { User } from '../../domain/entity/User';
import { UnauthorizedAccess } from '../../domain/error/error.index';
import { UserDoc, UserModel } from '../model/User.model';

export class UserRepository {
  constructor(private readonly userModel: typeof UserModel) {}

  async login(username: string, candidate: string): Promise<User> {
    const userWithPassword = await this.userModel.findOne({ username }).select('+password').exec();
    if (userWithPassword === null) {
      throw new UnauthorizedAccess('User not found');
    }

    const isValid = userWithPassword.verifyPassword(candidate);
    if (!isValid) {
      throw new UnauthorizedAccess('Invalid credentials');
    }

    return new User(userWithPassword.toObject());
  }

  async getByStoreId(storeId: string): Promise<User[]> {
    const users = await this.userModel.find({ storeId });

    return users.map((user: UserDoc) => new User(user));
  }
}
