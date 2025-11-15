import { ObjectId } from 'mongodb';
import { StoreTree } from '../../../src/domain/entity/StoreTree';
import { buildSmallStoreTree } from '../../helpers/storeTree';

// Helper to reset the StoreTree singleton between tests
function resetStoreTree(): void {
  (StoreTree as any).instance = undefined;
}

describe('StoreTree', () => {
  beforeEach(() => {
    resetStoreTree();
  });

  it('throws when not initialized', () => {
    expect(() => StoreTree.getInstance()).toThrow('Store tree not initialized');
  });

  it('initializes once and prevents double init', () => {
    const { nodes } = buildSmallStoreTree();
    const tree = StoreTree.initialize(nodes);
    expect(tree).toBe(StoreTree.getInstance());
    expect(() => StoreTree.initialize(nodes)).toThrow('Store tree already initialized');
  });

  it('isInSubtree checks ancestry', () => {
    const { root, child1, child2, child1a, nodes } = buildSmallStoreTree();
    StoreTree.initialize(nodes);

    const tree = StoreTree.getInstance();
    expect(tree.isInSubtree(new ObjectId(root.toString()), new ObjectId(root.toString()))).toBe(true);
    expect(tree.isInSubtree(new ObjectId(root.toString()), new ObjectId(child1.toString()))).toBe(true);
    expect(tree.isInSubtree(new ObjectId(root.toString()), new ObjectId(child2.toString()))).toBe(true);
    expect(tree.isInSubtree(new ObjectId(child1.toString()), new ObjectId(root.toString()))).toBe(false);
    expect(tree.isInSubtree(new ObjectId(child1.toString()), new ObjectId(child1a.toString()))).toBe(true);
    expect(tree.isInSubtree(new ObjectId(child1.toString()), new ObjectId(child2.toString()))).toBe(false);
  });

  it('getDescendants returns ids below a node', () => {
    const { root, child1, child2, child1a, child2a, child2b, nodes } = buildSmallStoreTree();
    StoreTree.initialize(nodes);
    const tree = StoreTree.getInstance();

    const descendants = tree.getDescendants(root.toString());
    expect(descendants.sort()).toEqual(
      [child1.toString(), child2.toString(), child1a.toString(), child2a.toString(), child2b.toString()].sort(),
    );
    expect(tree.getDescendants(child1a.toString())).toEqual([]);
  });
});
