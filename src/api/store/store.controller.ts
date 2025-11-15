import type { Request, Response } from 'express';
import { StoreNodeService } from '../../domain/service/StoreNode.service';
import { GetPersonnelRequest } from './request/get.personnel.request';
import { GetStoresRequest } from './request/get.stores.request';

export class StoreController {
  constructor(private readonly storeNodeService: StoreNodeService) {}

  public getPersonnel = async (req: Request, res: Response) => {
    const request = new GetPersonnelRequest(req);
    const personnel = await this.storeNodeService.getPersonnel(request.targetStoreId, request.type, {
      includeChildNodes: request.includeChildNodes,
      limit: request.limit,
      offset: request.offset,
    });
    res.json({ personnel });
  };

  public getUserStores = async (req: Request, res: Response) => {
    const request = new GetStoresRequest(req);
    const stores = await this.storeNodeService.getUserStores(request.storeId);
    res.json({ stores });
  };
}
