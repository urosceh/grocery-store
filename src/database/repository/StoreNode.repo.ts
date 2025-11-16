import { Types } from 'mongoose';
import { StoreNode } from '../../domain/entity/StoreNode';
import { StoreNodeDoc, StoreNodeModel } from '../model/StoreNode.model';

export class StoreNodeRepository {
  constructor(private readonly storeNodeModel: typeof StoreNodeModel) {}

  async create(storeNode: StoreNodeDoc): Promise<StoreNode> {
    const createdNode = await this.storeNodeModel.create(storeNode);

    return new StoreNode(createdNode.toObject());
  }

  async getByIds(ids: string[]): Promise<StoreNode[]> {
    const objectIds = ids.map((id) => Types.ObjectId.createFromHexString(id));

    const nodes = await this.storeNodeModel
      .find({ _id: { $in: objectIds } })
      .lean()
      .exec();

    return nodes.map((node: StoreNodeDoc) => new StoreNode(node));
  }

  async getAll(): Promise<StoreNode[]> {
    const nodes = await this.storeNodeModel.find().lean().exec();

    return nodes.map((node: StoreNodeDoc) => new StoreNode(node));
  }
}
