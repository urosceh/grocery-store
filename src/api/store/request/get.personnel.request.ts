import Joi from 'joi';
import { UnauthorizedAccess } from '../../../domain/error/error.index';
import { AbstractUserRequest } from '../../abstract/abstract.user.request';
import { mongoObjectIdSchema } from '../../common/validation';

export type PersonnelType = 'manager' | 'employee' | 'all';

export const getPersonnelValidation = {
  params: Joi.object({
    storeId: mongoObjectIdSchema.required(),
  }),
  query: Joi.object({
    type: Joi.string().valid('manager', 'employee', 'all'),
    includeChildNodes: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    offset: Joi.number().integer().min(0),
  }),
};

export class GetPersonnelRequest extends AbstractUserRequest {
  private readonly _targetStoreId: string;
  private readonly _type: PersonnelType;
  private readonly _includeChildNodes: boolean;
  private readonly _limit: number;
  private readonly _offset: number;

  constructor(req: any) {
    super(req);
    this._targetStoreId = req.params.storeId as string;
    this._includeChildNodes = req.query.includeChildNodes === 'true';
    this._limit = Number(req.query.limit as number) ?? 100;
    this._offset = Number(req.query.offset as number) ?? 0;
    switch (req.query.type) {
      case 'manager':
        if (this.userRole !== 'manager') {
          throw new UnauthorizedAccess('You are not authorized to get manager personnel');
        }
        this._type = 'manager';
        break;
      case 'employee':
        this._type = 'employee';
        break;
      default:
        this._type = this.userRole === 'manager' ? 'all' : 'employee';
        break;
    }
  }

  public get targetStoreId(): string {
    return this._targetStoreId;
  }

  public get type(): PersonnelType {
    return this._type;
  }

  public get includeChildNodes(): boolean {
    return this._includeChildNodes;
  }

  public get limit(): number {
    return this._limit;
  }

  public get offset(): number {
    return this._offset;
  }
}
