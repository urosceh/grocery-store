### Grocery Store API

A TypeScript/Express API backed by MongoDB and Mongoose for a hierarchical grocery store organization. Includes JWT-based auth, request validation, and a store-tree access model, plus seeders and unit tests.

### Tech stack

- **Runtime**: Node.js + TypeScript (`ts-node`)
- **Web**: Express 5, Joi validation
- **DB**: MongoDB (Mongoose 8)
- **Auth**: JWT (HS256)
- **Tests**: Jest + ts-jest
- **Container**: Docker Compose (MongoDB only)

### Prerequisites

- Node.js 20+ and npm
  - If you use nvm:
    - Use the project’s version: `nvm use`
    - If it says no version installed: `nvm install` then `nvm use`
- Docker (optional, recommended for MongoDB)

### Quick start (local)

1. Install dependencies

```bash
nvm use || nvm install && nvm use
npm install
```

2. Start MongoDB (via Docker)

```bash
docker-compose up -d
```

This starts Mongo on `localhost:27017` with username/password `admin/admin`.

3. Seed the database

```bash
npm exec ts-node scripts/seedStoreTree.ts
npm exec ts-node scripts/seedUsers.ts
```

Notes:

- Seed scripts honor `MONGODB_URI` and connect using the Mongo credentials above.
- Run store tree seeding before user seeding.

4. Start the API

```bash
npm start
```

The API listens on `http://localhost:${PORT}` (default `3000`).

### NPM scripts

- `npm start` — run API via `ts-node`
- `npm test` — run Jest tests
- `npm run test:watch` — watch mode
- `npm run coverage` — coverage report

### Running tests

```bash
npm test
```

Notes:

- Tests run under Node and do not require MongoDB.
- `test/jest.setup.ts` provides default `JWT_SECRET` and `JWT_EXPIRES_IN` for tests.

### Postman collection

- Import `postman/GroceryStore.postman_collection.json` into Postman.
- Collection variables:
  - `grocery-store-host` — defaults to `localhost:3000`
  - `jwt` — set automatically by the Login request test
- Workflow:
  1. Run the `User / Login` request first (uses seeded credentials).
  2. The returned JWT is stored in the `jwt` collection variable.
  3. Other requests inherit Bearer auth and will use `{{jwt}}` automatically.

### Running MongoDB with Docker Compose

```bash
docker-compose up -d
docker-compose ps
docker-compose logs -f mongo
```

To stop:

```bash
docker-compose down
```

Data is persisted in the `mongo_data` volume.

### Project structure

- `src/api` — express routers, controllers, and middleware
- `src/domain` — entities, services, types, domain errors
- `src/database` — Mongoose models and repositories
- `src/config` — configuration (Mongo)
- `scripts` — seed scripts and data files
- `test` — unit tests (domain entities and services)

### Troubleshooting

- Node version issues
  - Use `nvm use`. If not installed for this version, run `nvm install` then `nvm use`.
- Cannot connect to MongoDB
  - Ensure Docker is running and `docker-compose ps` shows `mongo` healthy.
  - Confirm credentials and `MONGODB_URI` match your environment.
  - The app uses `MONGO_INITDB_*` and `MONGODB_URI` (defaults shown above).
- JWT errors (401/403)
  - Ensure `JWT_SECRET` is set in `.env` and the `Authorization: Bearer <token>` header is present.
- Store access denied (403)
  - The authenticated user must have access to the requested store subtree.
- Empty results from `/personnel`
  - Confirm you seeded the store tree and users, and used a valid `storeId`.
- App fails on startup complaining about missing data
  - Seed the store tree first, then users.

### License

ISC (see `package.json`).
