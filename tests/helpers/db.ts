import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// One in-memory MongoDB per test file. `connectDB()` in src/lib/mongodb.ts
// reads MONGODB_URI at import time, so the URI is set here and the module is
// connected directly through mongoose to keep the same connection cache.
let server: MongoMemoryServer | null = null;

export async function startDb() {
  server = await MongoMemoryServer.create();
  const uri = server.getUri("pww-academy-test");
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  // The app caches its connection in global.mongooseCache; seed it so
  // `connectDB()` reuses this connection instead of opening another.
  // Mutate the object the module already holds a reference to — replacing
  // it would leave the module with its own empty cache.
  const g = globalThis as unknown as { mongooseCache?: { conn: unknown; promise: unknown } };
  g.mongooseCache ??= { conn: null, promise: null };
  g.mongooseCache.conn = mongoose;
  g.mongooseCache.promise = Promise.resolve(mongoose);
}

export async function stopDb() {
  const g = globalThis as unknown as { mongooseCache?: { conn: unknown; promise: unknown } };
  if (g.mongooseCache) {
    g.mongooseCache.conn = null;
    g.mongooseCache.promise = null;
  }
  await mongoose.disconnect();
  await server?.stop();
  server = null;
}

export async function clearDb() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}
