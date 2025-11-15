import type { NextFunction, Request, Response } from 'express';
import { JwtUserToken } from '../../domain/entity/JwtToken';
import { UnauthorizedAccess } from '../../domain/error/error.index';
import { JwtUserTokenPayload } from '../../domain/types/JwtUserTokenPayload';

export class TokenValidationMiddleware {
  public static verifyToken = (req: Request, _res: Response, next: NextFunction) => {
    try {
      const headerAuth = req.header('authorization') ?? req.header('Authorization');
      if (!headerAuth || !headerAuth.startsWith('Bearer ')) {
        throw new UnauthorizedAccess('Missing or invalid Authorization header');
      }

      const token = headerAuth.substring('Bearer '.length).trim();

      const payload: JwtUserTokenPayload = JwtUserToken.verify(token);
      if (!payload.username || !payload.storeId || !payload.role) {
        throw new UnauthorizedAccess('Invalid token payload');
      }

      // Bridge data to AbstractUserRequest via headers
      (req.headers as any).username = payload.username;
      (req.headers as any).store_id = payload.storeId;
      (req.headers as any).user_role = payload.role;

      next();
    } catch (err) {
      next(err);
    }
  };
}
