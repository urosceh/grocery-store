import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import mongoose, { InferSchemaType, Schema } from 'mongoose';

export const USER_ROLES = ['manager', 'employee'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const PASSWORD_SALT_LENGTH = 16;
const PASSWORD_KEY_LENGTH = 64;

const hashPassword = (plaintext: string): string => {
  const salt = randomBytes(PASSWORD_SALT_LENGTH);
  const derived = scryptSync(plaintext, salt, PASSWORD_KEY_LENGTH);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
};

const verifyPassword = (stored: string, candidate: string): boolean => {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(candidate, salt, expected.length);
  return timingSafeEqual(expected, actual);
};

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: USER_ROLES,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreNode',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
    dbName: 'grocery-store',
  },
);

userSchema.pre('save', function handlePasswordHash(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = hashPassword(this.password);
  next();
});

userSchema.methods.verifyPassword = function verify(candidate: string): boolean {
  return verifyPassword(this.password, candidate);
};

export type UserDoc = InferSchemaType<typeof userSchema>;

export interface UserMethods {
  verifyPassword(candidate: string): boolean;
}

type UserModelType = mongoose.Model<UserDoc, object, UserMethods>;

export const UserModel = mongoose.model<UserDoc, UserModelType>('User', userSchema);
