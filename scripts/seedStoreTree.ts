import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import { StoreNodeModel } from '../src/database/model/StoreNode.model';

dotenv.config();

type RawStoreNode = {
  _id: string;
  displayName: string;
  kind: string;
  children?: RawStoreNode[];
};

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/grocery-store';
const treePath = path.resolve(process.cwd(), './scripts/data/storeTree.json');

async function loadTree(): Promise<RawStoreNode[]> {
  const contents = await readFile(treePath, 'utf8');
  return JSON.parse(contents) as RawStoreNode[];
}

function flattenTree(
  nodes: RawStoreNode[],
  parentId: Types.ObjectId | null,
  ancestorIds: Types.ObjectId[],
  pathPrefix: string[],
): any[] {
  return nodes.flatMap((node) => {
    const currentId = Types.ObjectId.createFromHexString(node._id);
    const nodePath = [...pathPrefix, node.displayName];
    const nodeAncestorIds = parentId ? [...ancestorIds, parentId] : [];

    const currentDoc = {
      _id: currentId,
      displayName: node.displayName,
      kind: node.kind,
      parentId,
      ancestorIds,
    };

    if (!node.children?.length) {
      return [currentDoc];
    }

    return [currentDoc, ...flattenTree(node.children, currentId, nodeAncestorIds, nodePath)];
  });
}

async function seed() {
  const mongoUri = process.env.MONGODB_URI ?? DEFAULT_URI;
  const tree = await loadTree();
  await mongoose.connect(mongoUri, {
    user: 'admin',
    pass: 'admin',
    authSource: 'admin',
  });

  const docs = flattenTree(tree, null, [], []);

  await StoreNodeModel.deleteMany({});
  await StoreNodeModel.insertMany(docs, { ordered: true });

  const total = await StoreNodeModel.countDocuments();
  console.log(`Inserted ${total} store nodes into collection "${StoreNodeModel.collection.name}".`);
}

seed()
  .then(() => mongoose.disconnect())
  .catch((error) => {
    console.error(error);
    return mongoose.disconnect().finally(() => process.exit(1));
  });
