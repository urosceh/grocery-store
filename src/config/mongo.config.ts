export const mongoConfig = {
  uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/grocery-store',
  user: process.env.MONGO_INITDB_ROOT_USERNAME ?? 'admin',
  pass: process.env.MONGO_INITDB_ROOT_PASSWORD ?? 'admin',
  authSource: process.env.MONGO_INITDB_AUTH_SOURCE ?? 'admin',
};
