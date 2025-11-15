import { Router } from 'express';
import { StoreController } from './store/store.controller';
import { storeRouter } from './store/store.router';
import { UserController } from './user/user.controller';
import { userRouter } from './user/user.router';

export function createApiRouter(userController: UserController, storeController: StoreController): Router {
  const api = Router();
  api.use('/user', userRouter(userController));
  api.use('/store', storeRouter(storeController));
  return api;
}
