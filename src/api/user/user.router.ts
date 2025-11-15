import { Router } from 'express';
import { JoiValidationMiddleware } from '../web.api.middleware/joi.validation.middleware';
import { StoreAccessMiddleware } from '../web.api.middleware/store.access.middleware';
import { TokenValidationMiddleware } from '../web.api.middleware/token.validation.middleware';
import { createUserValidation } from './request/create.user.request';
import { loginValidation } from './request/login.user.request';
import { UserController } from './user.controller';

export function userRouter(controller: UserController): Router {
  const router = Router();

  router.post(
    '/',
    TokenValidationMiddleware.verifyToken,
    StoreAccessMiddleware.verifyAccess,
    JoiValidationMiddleware.validate(createUserValidation),
    controller.create,
  );
  router.post('/login', JoiValidationMiddleware.validate(loginValidation), controller.login);
  router.post('/logout', TokenValidationMiddleware.verifyToken, controller.logout);

  return router;
}
