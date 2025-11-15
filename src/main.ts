import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { createApiRouter } from './api/router.index';
import { StoreController } from './api/store/store.controller';
import { UserController } from './api/user/user.controller';
import { ErrorHandlingMiddleware } from './api/web.api.middleware/error.handling.middleware';
import { StoreNodeModel } from './database/model/StoreNode.model';
import { UserModel } from './database/model/User.model';
import { StoreNodeRepository } from './database/repository/StoreNode.repo';
import { UserRepository } from './database/repository/User.repo';
import { JwtUserToken } from './domain/entity/JwtToken';
import { StoreNodeService } from './domain/service/StoreNode.service';
import { UserService } from './domain/service/User.service';

dotenv.config();

async function bootstrap() {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/grocery-store';
  await mongoose.connect(mongoUri, {
    user: 'admin',
    pass: 'admin',
    authSource: 'admin',
  });

  const userRepo = new UserRepository(UserModel);
  const storeRepo = new StoreNodeRepository(StoreNodeModel);
  const userService = new UserService(userRepo);
  const storeService = new StoreNodeService(storeRepo, userRepo);

  await storeService.initializeStoreTree();
  JwtUserToken.initialize();

  const userController = new UserController(userService);
  const storeController = new StoreController(storeService);

  const app = express();
  app.use(express.json());

  app.use('/api', createApiRouter(userController, storeController));
  app.use(ErrorHandlingMiddleware.handleErrors);

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
