import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;
let mongoUri: string | null = null;

const DB_NAME = 'grocery-store';

export async function startInMemoryMongo(): Promise<string> {
  if (mongoServer) {
    return mongoUri as string;
  }
  mongoServer = await MongoMemoryServer.create();
  // Ensure we use a consistent dbName across models
  mongoUri = mongoServer.getUri(DB_NAME);
  await mongoose.connect(mongoUri, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 20_000,
    connectTimeoutMS: 20_000,
  });
  return mongoUri;
}

export async function clearDatabase(): Promise<void> {
  const conn = mongoose.connection;
  const database = conn.db;
  if (!database) {
    return;
  }
  const collections = await database.collections();
  await Promise.all(
    collections.map((collection) => {
      // Keep indexes between tests; only clear data
      return collection.deleteMany({});
    }),
  );
}

export async function stopInMemoryMongo(): Promise<void> {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
  mongoServer = null;
  mongoUri = null;
}
