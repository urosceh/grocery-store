import { Types } from 'mongoose';
import type { UserRepository } from '../../../src/database/repository/User.repo';
import { User } from '../../../src/domain/entity/User';
import { UserService } from '../../../src/domain/service/User.service';
import type { CreateUserAttributes } from '../../../src/domain/types/CreateUserAttributes';

describe('UserService', () => {
  it('login signs and returns JWT', async () => {
    const fakeUser = new User({
      username: 'bob',
      name: 'Bob',
      role: 'employee',
      storeId: new Types.ObjectId(),
    } as any);

    const repo: Partial<UserRepository> = { login: jest.fn().mockResolvedValue(fakeUser) };

    const svc = new UserService(repo as UserRepository);
    const token = await svc.login('bob', 'password');
    expect(typeof token).toBe('string');
    expect(repo.login).toHaveBeenCalledWith('bob', 'password');
  });

  it('create delegates to repository', async () => {
    const repo: Partial<UserRepository> = { create: jest.fn().mockResolvedValue(undefined) };
    const svc = new UserService(repo as UserRepository);

    const attrs: CreateUserAttributes = {
      username: 'eve',
      name: 'Eve',
      password: 'pw',
      role: 'employee',
      storeId: new Types.ObjectId().toString(),
    };
    await svc.create(attrs);
    expect(repo.create).toHaveBeenCalledWith(attrs);
  });
});
