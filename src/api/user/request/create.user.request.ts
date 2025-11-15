import { Request } from 'express';

import Joi from 'joi';
import { CreateUserAttributes } from '../../../domain/types/CreateUserAttributes';
import { AbstractUserRequest } from '../../abstract/abstract.user.request';
import { mongoObjectIdSchema } from '../../common/validation';

export const createUserValidation = {
  body: Joi.object({
    username: Joi.string().trim().required(),
    name: Joi.string().trim().required(),
    password: Joi.string().min(1).required(),
    role: Joi.string().valid('manager', 'employee').required(),
    storeId: mongoObjectIdSchema.required(),
  }),
};

export class CreateUserRequest extends AbstractUserRequest {
  private readonly _createUserAttributes: CreateUserAttributes;

  constructor(req: Request) {
    super(req);
    const { username, name, password, role, storeId } = req.body;
    this._createUserAttributes = { username, name, password, role, storeId };
  }

  public get createUserBody(): CreateUserAttributes {
    return this._createUserAttributes;
  }
}
