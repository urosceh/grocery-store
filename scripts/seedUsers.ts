import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { UserModel } from '../src/database/model/User.model';

type RawUser = {
  username: string;
  password: string;
  name: string;
  role: string;
  storeId: string;
};

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/grocery-store';

async function loadUsers(): Promise<RawUser[]> {
  const usersPath = path.resolve(process.cwd(), './scripts/data/users.json');
  const contents = await readFile(usersPath, 'utf8');
  return JSON.parse(contents) as RawUser[];
}

async function seed() {
  const mongoUri = process.env.MONGODB_URI ?? DEFAULT_URI;
  await mongoose.connect(mongoUri, {
    user: 'admin',
    pass: 'admin',
    authSource: 'admin',
  });

  const users = await loadUsers();

  await UserModel.deleteMany({});
  // pre('save') hook will be executed for each user
  for (const user of users) {
    const newUser = new UserModel(user);
    await newUser.save();
  }

  const total = await UserModel.countDocuments();
  console.log(`Inserted ${total} users into collection "${UserModel.collection.name}".`);
}

seed()
  .then(() => mongoose.disconnect())
  .catch((error) => {
    console.error(error);
    return mongoose.disconnect().finally(() => process.exit(1));
  });
