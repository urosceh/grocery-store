import type { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { BadRequest } from '../error/error.index';
import { StoreNode } from './StoreNode';

export class StoreTree {
  public static instance: StoreTree;

  private _ancestryIndex: Map<string, Set<string>>;

  private constructor(nodes: StoreNode[]) {
    this._ancestryIndex = this.buildAncestryIndex(nodes);
  }

  public static getInstance(): StoreTree {
    if (!StoreTree.instance) {
      throw new BadRequest('Store tree not initialized');
    }
    return StoreTree.instance;
  }

  public static initialize(nodes: StoreNode[]): StoreTree {
    if (StoreTree.instance) {
      throw new BadRequest('Store tree already initialized');
    }
    StoreTree.instance = new StoreTree(nodes);
    return StoreTree.instance;
  }

  public doesStoreExist(storeId: string): boolean {
    return Types.ObjectId.isValid(storeId) && this._ancestryIndex.has(storeId.toString());
  }

  public isInSubtree(nodeId: ObjectId, storeId: ObjectId): boolean {
    const rootKey = nodeId.toString();
    const searchKey = storeId.toString();

    const ancestry = this._ancestryIndex.get(searchKey);
    if (!ancestry) {
      return false;
    }

    return ancestry.has(rootKey);
  }

  public getDescendants(nodeId: string | ObjectId): string[] {
    const rootKey = nodeId.toString();
    const result: string[] = [];
    for (const [nodeKey, ancestry] of this._ancestryIndex.entries()) {
      if (nodeKey !== rootKey && ancestry.has(rootKey)) {
        result.push(nodeKey);
      }
    }
    return result;
  }

  private buildAncestryIndex(nodes: StoreNode[]): Map<string, Set<string>> {
    const ancestryIndex = new Map();

    for (const node of nodes) {
      const nodeKey = node.id.toString();

      if (ancestryIndex.has(nodeKey)) {
        console.warn(`Node ${nodeKey} already exists in the tree`);
        continue;
      }

      const ancestry = new Set<string>();
      ancestry.add(nodeKey);

      for (const ancestorId of node.ancestorIds) {
        ancestry.add(ancestorId.toString());
      }

      ancestryIndex.set(nodeKey, ancestry);
    }

    return ancestryIndex;
  }
}
