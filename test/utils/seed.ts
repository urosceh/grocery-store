import { Types } from 'mongoose';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { StoreNodeModel } from '../../src/database/model/StoreNode.model';
import { UserModel } from '../../src/database/model/User.model';

type RawStoreNode = {
  _id: string;
  displayName: string;
  kind: string;
  children?: RawStoreNode[];
};

type InsertStoreNode = {
  _id: Types.ObjectId;
  displayName: string;
  kind: string;
  parentId: Types.ObjectId | null;
  ancestorIds: Types.ObjectId[];
};

const storeTreePath = path.resolve(process.cwd(), './test/data/storeTree.small.json');
const usersPath = path.resolve(process.cwd(), './test/data/users.small.json');

async function loadStoreTree(): Promise<RawStoreNode[]> {
  const contents = await readFile(storeTreePath, 'utf8');
  return JSON.parse(contents) as RawStoreNode[];
}

function flattenTree(
  nodes: RawStoreNode[],
  parentId: Types.ObjectId | null,
  ancestorIds: Types.ObjectId[],
): InsertStoreNode[] {
  return nodes.flatMap((node) => {
    const currentId = Types.ObjectId.createFromHexString(node._id);
    const nodeAncestorIds = parentId ? [...ancestorIds, parentId] : [];

    const currentDoc: InsertStoreNode = {
      _id: currentId,
      displayName: node.displayName,
      kind: node.kind,
      parentId,
      ancestorIds: nodeAncestorIds,
    };

    if (!node.children?.length) {
      return [currentDoc];
    }
    return [currentDoc, ...flattenTree(node.children, currentId, nodeAncestorIds)];
  });
}

export async function seedStoreNodes(): Promise<void> {
  const tree = await loadStoreTree();
  const docs = flattenTree(tree, null, []);
  await StoreNodeModel.deleteMany({});
  await StoreNodeModel.insertMany(docs, { ordered: true });
}

type RawUser = {
  username: string;
  password: string;
  name: string;
  role: string;
  storeId: string;
};

async function loadUsers(): Promise<RawUser[]> {
  const contents = await readFile(usersPath, 'utf8');
  return JSON.parse(contents) as RawUser[];
}

export async function seedUsers(): Promise<void> {
  const users = await loadUsers();
  await UserModel.deleteMany({});
  for (const u of users) {
    const newUser = new UserModel(u as any);
    await newUser.save();
  }
}
