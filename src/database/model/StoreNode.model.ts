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

export type StoreNodeDoc = InferSchemaType<typeof storeNodeSchema>;

export const StoreNodeModel = mongoose.model('StoreNode', storeNodeSchema);
