import { Router } from 'express';
import { JoiValidationMiddleware } from '../web.api.middleware/joi.validation.middleware';
import { StoreAccessMiddleware } from '../web.api.middleware/store.access.middleware';
import { TokenValidationMiddleware } from '../web.api.middleware/token.validation.middleware';
import { getPersonnelValidation } from './request/get.personnel.request';
import { StoreController } from './store.controller';

export function storeRouter(storeController: StoreController): Router {
  const router = Router();

  router.get(
    '/:storeId/personnel',
    TokenValidationMiddleware.verifyToken,
    JoiValidationMiddleware.validate(getPersonnelValidation),
    StoreAccessMiddleware.verifyAccess,
    storeController.getPersonnel,
  );

  return router;
}
