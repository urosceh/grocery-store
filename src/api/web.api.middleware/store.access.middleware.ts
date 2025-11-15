import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { StoreTree } from '../../domain/entity/StoreTree';
import { BadRequest, ForbiddenAccess } from '../../domain/error/error.index';

export class StoreAccessMiddleware {
  public static verifyAccess = (req: Request, _res: Response, next: NextFunction) => {
    try {
      const targetStoreId = req.params.storeId || req.body.storeId;
      const userStoreId = req.headers.store_id as string;

      if (!targetStoreId || !userStoreId) {
        throw new BadRequest('No store ids provided');
      }

      const target = Types.ObjectId.createFromHexString(targetStoreId);
      const root = Types.ObjectId.createFromHexString(userStoreId);

      const isAllowed = StoreTree.getInstance().isInSubtree(root as unknown as any, target as unknown as any);
      if (!isAllowed) {
        throw new ForbiddenAccess('User does not have access to the requested store');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
