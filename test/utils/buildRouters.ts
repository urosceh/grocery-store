import { Router } from 'express';
import { StoreController } from '../../src/api/store/store.controller';
import { storeRouter } from '../../src/api/store/store.router';
import { UserController } from '../../src/api/user/user.controller';
import { userRouter } from '../../src/api/user/user.router';
import { StoreNodeModel } from '../../src/database/model/StoreNode.model';
import { UserModel } from '../../src/database/model/User.model';
import { StoreNodeRepository } from '../../src/database/repository/StoreNode.repo';
import { UserRepository } from '../../src/database/repository/User.repo';
import { JwtUserToken } from '../../src/domain/entity/JwtToken';
import { StoreNodeService } from '../../src/domain/service/StoreNode.service';
import { UserService } from '../../src/domain/service/User.service';

export async function createUserRouter(): Promise<Router> {
  const userRepo = new UserRepository(UserModel);
  const userService = new UserService(userRepo);
  JwtUserToken.initialize();
  return userRouter(new UserController(userService));
}

export async function createStoreRouter(): Promise<Router> {
  const userRepo = new UserRepository(UserModel);
  const storeRepo = new StoreNodeRepository(StoreNodeModel);
  const storeService = new StoreNodeService(storeRepo, userRepo);
  await storeService.initializeStoreTree();
  JwtUserToken.initialize();
  return storeRouter(new StoreController(storeService));
}
