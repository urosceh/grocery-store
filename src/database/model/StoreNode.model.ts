import mongoose, { InferSchemaType, Schema, Types } from 'mongoose';

export const STORE_NODE_KINDS = ['OFFICE', 'STORE'];

const storeNodeSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => new Types.ObjectId(),
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: STORE_NODE_KINDS,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'StoreNode',
      default: null,
      index: true,
    },
    ancestorIds: {
      type: [Schema.Types.ObjectId],
      required: true,
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'store',
  },
);

const example: StoreNodeDoc = {
  _id: new Types.ObjectId(),
  displayName: 'test',
  kind: 'STORE',
  parentId: null,
  ancestorIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export type StoreNodeDoc = InferSchemaType<typeof storeNodeSchema>;

export const StoreNodeModel = mongoose.model('StoreNode', storeNodeSchema);
