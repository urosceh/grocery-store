import { PipelineStage, Types } from 'mongoose';
import { PersonnelType } from '../../api/store/request/get.personnel.request';
import { User } from '../../domain/entity/User';
import { UnauthorizedAccess } from '../../domain/error/error.index';
import { CreateUserAttributes } from '../../domain/types/CreateUserAttributes';
import { UserDoc, UserModel } from '../model/User.model';

export class UserRepository {
  constructor(private readonly userModel: typeof UserModel) {}

  async create(createUserAttributes: CreateUserAttributes): Promise<User> {
    const user = await this.userModel.create(createUserAttributes);
    return new User(user.toObject());
  }

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

  async getByStoreIds(storeIds: string[]): Promise<User[]> {
    const ids = storeIds.map((id) => Types.ObjectId.createFromHexString(id));
    const users = await this.userModel
      .find({ storeId: { $in: ids } })
      .lean()
      .exec();
    return users.map((user: UserDoc) => new User(user));
  }

  async getByStoreIdsPaged(
    storeIds: string[],
    options: { type: PersonnelType; limit: number; offset: number },
  ): Promise<User[]> {
    const ids = storeIds.map((id) => Types.ObjectId.createFromHexString(id));
    const filter: any = { storeId: { $in: ids } };
    if (options.type !== 'all') filter.role = options.type;

    const pipeline: PipelineStage[] = [
      { $match: filter },
      { $sort: { username: 1 } },
      { $skip: options.offset },
      { $limit: Math.min(options.limit, 1000) },
    ];

    const result = await this.userModel.aggregate(pipeline).exec();

    return result.map((user: any) => new User(user));
  }
}
