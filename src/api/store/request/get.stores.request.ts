import { Request } from 'express';
import { AbstractUserRequest } from '../../abstract/abstract.user.request';

export class GetStoresRequest extends AbstractUserRequest {
  constructor(req: Request) {
    super(req);
  }
}
