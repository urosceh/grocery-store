import { Types } from 'mongoose';
import { StoreNode } from '../../domain/entity/StoreNode';
import { NotFound } from '../../domain/error/error.index';
import { StoreNodeDoc, StoreNodeModel } from '../model/StoreNode.model';

export class StoreNodeRepository {
  constructor(private readonly storeNodeModel: typeof StoreNodeModel) {}

  async create(storeNode: StoreNodeDoc): Promise<StoreNode> {
    const createdNode = await this.storeNodeModel.create(storeNode);

    return new StoreNode(createdNode.toObject());
  }

  async findById(id: string): Promise<StoreNode> {
    const node = await this.storeNodeModel.findById(id);

    if (node === null) {
      throw new NotFound('Store node not found');
    }

    return new StoreNode(node.toObject());
  }

  async getByIds(ids: string[]): Promise<StoreNode[]> {
    const objectIds = ids.map((id) => Types.ObjectId.createFromHexString(id));

    const nodes = await this.storeNodeModel.find({ _id: { $in: objectIds } });

    return nodes.map((node: StoreNodeDoc) => new StoreNode(node));
  }

  async getAll(): Promise<StoreNode[]> {
    const nodes = await this.storeNodeModel.find();

    return nodes.map((node: StoreNodeDoc) => new StoreNode(node));
  }
}
