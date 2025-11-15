import { Types } from 'mongoose';
import { StoreNode } from '../../src/domain/entity/StoreNode';

export function makeNode(id: Types.ObjectId, ancestors: Types.ObjectId[] = []): StoreNode {
  return new StoreNode({
    _id: id,
    displayName: `Node-${id.toString().slice(-4)}`,
    kind: 'STORE' as any,
    parentId: ancestors[0] ?? null,
    ancestorIds: ancestors,
  } as any);
}

export type SmallTree = {
  root: Types.ObjectId;
  child1: Types.ObjectId;
  child2: Types.ObjectId;
  child1a: Types.ObjectId;
  child2a: Types.ObjectId;
  child2b: Types.ObjectId;
  nodes: StoreNode[];
};

export function buildSmallStoreTree(): SmallTree {
  const root = new Types.ObjectId();
  const child1 = new Types.ObjectId();
  const child2 = new Types.ObjectId();
  const child1a = new Types.ObjectId();
  const child2a = new Types.ObjectId();
  const child2b = new Types.ObjectId();

  const makeNode = (id: Types.ObjectId, ancestors: Types.ObjectId[] = []): StoreNode =>
    new StoreNode({
      _id: id,
      displayName: `Node-${id.toString().slice(-4)}`,
      kind: 'STORE' as any,
      parentId: ancestors[0] ?? null,
      ancestorIds: ancestors,
    } as any);

  const nodes = [
    makeNode(root, []),
    makeNode(child1, [root]),
    makeNode(child2, [root]),
    makeNode(child1a, [root, child1]),
    makeNode(child2a, [root, child2]),
    makeNode(child2b, [root, child2]),
  ];

  return { root, child1, child2, child1a, child2a, child2b, nodes };
}
